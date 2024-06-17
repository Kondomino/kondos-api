import { KondoRepository } from 'src/kondo/repository/kondo.repository';
import { SlugifyService } from 'src/utils/slugify/slugify.service';
export declare class IntegratorService {
    private slugifyService;
    private readonly KondoRepository;
    dataTypes: unknown[];
    updated: number;
    created: number;
    constructor(slugifyService: SlugifyService, KondoRepository: KondoRepository);
    run(): Promise<string>;
    runIntegrator(options: any): Promise<string>;
    readExcel(filePath: any): Promise<{
        sheets: string[];
        rows: any[];
        workbook: import("xlsx").WorkBook;
    }>;
    prepareData(sheets: any, rows: any, workbook: any): Promise<void>;
    insertData(records: any, columnsNames: any): Promise<void>;
    showLogs(): void;
}
