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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegratorService = void 0;
const common_1 = require("@nestjs/common");
const kondo_repository_1 = require("../kondo/repository/kondo.repository");
const xlsx_1 = require("xlsx");
const boolean_columns_1 = require("./types/boolean_columns");
const create_kondo_dto_1 = require("../kondo/dto/create-kondo.dto");
const slugify_service_1 = require("../utils/slugify/slugify.service");
//encode_cell
//sheet_to_json
let IntegratorService = class IntegratorService {
    constructor(slugifyService, KondoRepository) {
        this.slugifyService = slugifyService;
        this.KondoRepository = KondoRepository;
        this.dataTypes = [];
        this.updated = 0;
        this.created = 0;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                'file': './files/kondos.xlsx',
                'filepath': 'C:/Projetos/kondos-api/src/integrator/files/kondos.xlsx'
                //'filepath': './files/kondos.xlsx'
            };
            return this.runIntegrator(options);
        });
    }
    runIntegrator(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // let's first read the excel file
            const { sheets, rows, workbook } = yield this.readExcel(options.filepath);
            // let's normalize the data
            this.prepareData(sheets, rows, workbook);
            this.showLogs();
            return 'successfull';
        });
    }
    readExcel(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const workbook = (0, xlsx_1.readFile)(filePath);
            const sheets = workbook.SheetNames;
            const rows = [];
            // Retrieving column names form 
            for (const sheet of sheets) {
                if (sheet == 'Kondos') {
                    const worksheet = workbook.Sheets[sheet];
                    const range = xlsx_1.utils.decode_range(worksheet['!ref']);
                    const columns = []; //Emptying list for new sheet
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
                    // Adding columns name of each sheet into rows list for mapping
                    rows.push(columns);
                }
            }
            return {
                sheets,
                rows,
                workbook
            };
        });
    }
    prepareData(sheets, rows, workbook) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('preparing data..');
            for (let i = 0; i < sheets.length; i++) {
                if (sheets[i] == 'Kondos') {
                    const tableName = sheets[i];
                    // Iterating columns
                    /*
                    const tableCols = rows[i].map((columnName, index) => {
                      return `${columnName}`
                    }).join(", ");
                    */
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
                    yield this.insertData(tableData, columnsNames);
                }
            }
        });
    }
    /**
    This function inserts data into a specified table in a PostgreSQL database.
    @param tableName - The name of the table where the data will be inserted.
    @param tableCols - The columns of the table where the data will be inserted.
    @param records - The records parameter is an array of arrays, where each inner array represents a
    row of data to be inserted into the specified table. Each inner array contains values for each
    column in the table, in the order specified by the tableCols parameter.
     */
    insertData(records, columnsNames) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('inserting data....');
            try {
                let slug = '';
                //let rowForUpdate = '';
                //    const client = await pool.connect();
                records.map((rows) => __awaiter(this, void 0, void 0, function* () {
                    const condoDTO = new create_kondo_dto_1.CreateKondoDto();
                    // Now each row here is a Condo
                    const sanitizedRecord = rows.map((col, colIndex) => {
                        // first column is slug
                        if (colIndex == 0) {
                            // Does the condo have a valid name to slugify?
                            if (rows[1] && rows[1] != '') {
                                col = slug = this.slugifyService.run(rows[1]);
                            }
                        }
                        // Boolean normalization
                        else if (this.dataTypes[colIndex] == "boolean") {
                            col = col == "1" ? "1" : "0";
                        }
                        // Check if cell value is empty and assign a default value
                        else if (this.dataTypes[colIndex] == "text") {
                            // Any treatment for strings?
                        }
                        // preparing cols and values for an update
                        condoDTO[columnsNames[colIndex]] = col;
                        return col;
                    });
                    const rowString = sanitizedRecord.join(", ");
                    // Got a slug?
                    if (slug !== '') {
                        try {
                            const condo = yield this.KondoRepository.findOrCreate({
                                where: { slug: condoDTO.slug },
                                defaults: condoDTO
                            });
                            // Condo was created?
                            if (!condo[1]) {
                                // UPDATE
                                this.KondoRepository.update(condoDTO, { slug: condoDTO.slug });
                                this.updated++;
                            }
                            else {
                                // CREATE
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
                })).join(", ");
            }
            catch (error) {
                console.error("Error inserting data: ", error);
                throw error;
            }
            finally {
                //pool.release();
            }
        });
    }
    showLogs() {
        // let's check if the item exists
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
