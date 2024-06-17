"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegratorService = void 0;
const common_1 = require("@nestjs/common");
const kondo_repository_1 = require("../kondo/repository/kondo.repository");
const xlsx_1 = require("xlsx");
const boolean_columns_1 = require("./types/boolean_columns");
const create_kondo_dto_1 = require("../kondo/dto/create-kondo.dto");
const slugify_service_1 = require("../utils/slugify/slugify.service");
let IntegratorService = class IntegratorService {
    constructor(slugifyService, KondoRepository) {
        this.slugifyService = slugifyService;
        this.KondoRepository = KondoRepository;
        this.dataTypes = [];
        this.updated = 0;
        this.created = 0;
    }
    async run() {
        const options = {
            'file': './files/kondos.xlsx',
            'filepath': 'C:/Projetos/kondos-api/src/integrator/files/kondos.xlsx'
        };
        return this.runIntegrator(options);
    }
    async runIntegrator(options) {
        const { sheets, rows, workbook } = await this.readExcel(options.filepath);
        this.prepareData(sheets, rows, workbook);
        this.showLogs();
        return 'successfull';
    }
    async readExcel(filePath) {
        const workbook = (0, xlsx_1.readFile)(filePath);
        const sheets = workbook.SheetNames;
        const rows = [];
        for (const sheet of sheets) {
            if (sheet == 'Kondos') {
                const worksheet = workbook.Sheets[sheet];
                const range = xlsx_1.utils.decode_range(worksheet['!ref']);
                const columns = [];
                for (let c = range.s.c; c <= range.e.c; c++) {
                    let columnType = 'text';
                    const cellAddress = xlsx_1.utils.encode_cell({ r: range.s.r, c });
                    const cellValue = worksheet[cellAddress] ? worksheet[cellAddress].v : '';
                    const column = cellValue.toLowerCase().replace(/\s/g, "_");
                    if (boolean_columns_1.boolean_columns.includes(column)) {
                        columnType = 'boolean';
                    }
                    columns.push(column);
                    this.dataTypes.push([columnType]);
                }
                rows.push(columns);
            }
        }
        return {
            sheets,
            rows,
            workbook
        };
    }
    async prepareData(sheets, rows, workbook) {
        console.log('preparing data..');
        for (let i = 0; i < sheets.length; i++) {
            if (sheets[i] == 'Kondos') {
                const tableName = sheets[i];
                const columnsNames = rows[i];
                const worksheet = workbook.Sheets[tableName];
                const options = {
                    header: 1,
                    raw: false,
                    dateNF: 'yyyy-mm-dd',
                    blankrows: false,
                    defval: ''
                };
                const tableData = xlsx_1.utils.sheet_to_json(worksheet, options);
                tableData.shift();
                await this.insertData(tableData, columnsNames);
            }
        }
    }
    async insertData(records, columnsNames) {
        console.log('inserting data....');
        try {
            let slug = '';
            records.map(async (rows) => {
                const condoDTO = new create_kondo_dto_1.CreateKondoDto();
                const sanitizedRecord = rows.map((col, colIndex) => {
                    if (colIndex == 0) {
                        if (rows[1] && rows[1] != '') {
                            col = slug = this.slugifyService.run(rows[1]);
                        }
                    }
                    else if (this.dataTypes[colIndex] == "boolean") {
                        col = col == "1" ? "1" : "0";
                    }
                    else if (this.dataTypes[colIndex] == "text") {
                    }
                    condoDTO[columnsNames[colIndex]] = col;
                    return col;
                });
                const rowString = sanitizedRecord.join(", ");
                if (slug !== '') {
                    try {
                        const condo = await this.KondoRepository.findOrCreate({
                            where: { slug: condoDTO.slug },
                            defaults: condoDTO
                        });
                        if (!condo[1]) {
                            this.KondoRepository.update(condoDTO, { slug: condoDTO.slug });
                            this.updated++;
                        }
                        else {
                            this.created++;
                        }
                        slug = '';
                    }
                    catch (error) {
                        console.error("Error inserting data: ", error);
                        throw error;
                    }
                }
                return `(${rowString})`;
            }).join(", ");
        }
        catch (error) {
            console.error("Error inserting data: ", error);
            throw error;
        }
        finally {
        }
    }
    showLogs() {
        console.log('------ LOGS -----');
        console.log('updated', this.updated);
        console.log('created', this.created);
    }
};
IntegratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [slugify_service_1.SlugifyService,
        kondo_repository_1.KondoRepository])
], IntegratorService);
exports.IntegratorService = IntegratorService;
//# sourceMappingURL=integrator.service.js.map