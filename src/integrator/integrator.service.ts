import { Injectable } from '@nestjs/common';
import { KondoRepository } from '../kondo/repository/kondo.repository';
import { readFile, utils } from 'xlsx';
import { boolean_columns } from './types/boolean_columns';
import { CreateKondoDto } from '../kondo/dto/create-kondo.dto';
import { UpdateKondoDto } from '../kondo/dto/update-kondo.dto';
import { SlugifyService } from '../utils/slugify/slugify.service';
import { validateColumns } from './utils/column-validator';
import { normalizeKondoField } from './helpers/integrator.normalization.helper';

//encode_cell
//sheet_to_json

@Injectable()
export class IntegratorService {
  dataTypes: unknown[] = [];
  updated = 0;
  created = 0;
  uncapturedColumns: Set<string> = new Set();

  constructor(
    private slugifyService: SlugifyService,
    private readonly KondoRepository: KondoRepository
  ) {}

  async run() {

    const options = {
      'file': './files/kondos.xlsx',
      //'filepath': 'C:/Projetos/kondos-api/src/integrator/files/kondos.xlsx'
      'filepath': '/mnt/c/files/kondos.xlsx'
      //'filepath': '\\wsl.localhost\Ubuntu\home\kzz\Projects\kondos-api\src\integrator\files\kondos.xlsx'
      //'filepath': './files/kondos.xlsx'
    };

    return this.runIntegrator(options);
  }

  async runIntegrator(options) {

    // let's first read the excel file
    const { sheets, rows, workbook } = await this.readExcel(options.filepath);

    // let's normalize the data
    await this.prepareData(sheets, rows, workbook);

    this.showLogs();

    return 'successful'
  }

  async readExcel(filePath) {
    
    const workbook = readFile(filePath);
    const sheets = workbook.SheetNames;
  
    const rows = [];
  
    // Retrieving column names form 
    for (const sheet of sheets) {
      
      if (sheet == 'Kondos') {
        const worksheet = workbook.Sheets[sheet];
        const range = utils.decode_range(worksheet['!ref']);
  
        const columns = []; //Emptying list for new sheet
        
        
        for (let c = range.s.c; c <= range.e.c; c++) {
          let columnType: string = 'text';
          const cellAddress = utils.encode_cell({ r: range.s.r, c });
          const cellValue = worksheet[cellAddress] ? worksheet[cellAddress].v : '';
          const column = cellValue.toLowerCase().replace(/\s/g, "_");
  
          if (boolean_columns.includes(column)){
            columnType = 'boolean';
          }
  
          columns.push(column);
          this.dataTypes.push([columnType]);
        }
  
        // Validate columns against the model
        const { validColumns, invalidColumns } = validateColumns(columns);
        invalidColumns.forEach(col => this.uncapturedColumns.add(col));
        
        // Adding columns name of each sheet into rows list for mapping
        rows.push(columns);
      }
    }
    
    return {
      sheets,
      rows,
      workbook
    }
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
        const tableData = utils.sheet_to_json(worksheet, options);

        tableData.shift();

        await this.insertData(tableData, columnsNames);
      }
    }
  }
  
  /**
   * Insert data into Kondo table
   * Collects all promises and waits for completion before returning
   * Only processes columns that exist in the model
   * @param records - Array of records from Excel
   * @param columnsNames - Array of column names
   */
  async insertData(records, columnsNames) {
    console.log('inserting data....');

    try {
      // Collect all promises for parallel processing
      const insertPromises: Promise<void>[] = [];

      for (const rows of records) {
        const condoDTO = new CreateKondoDto();
        let slug = '';

        // Process each column, only if valid
        const { validColumns } = validateColumns(columnsNames);
        
        rows.forEach((col, colIndex) => {
          const columnName = columnsNames[colIndex];
          
          // Only process columns that exist in the model
          if (!validColumns.includes(columnName)) {
            return; // Skip this column
          }

          // First column (index 0) should be slug
          if (colIndex == 0) {
            if (rows[1] && rows[1] != '') {
              slug = this.slugifyService.run(rows[1]);
              col = slug;
            }
          }
          // Boolean normalization
          else if (this.dataTypes[colIndex] && this.dataTypes[colIndex][0] == "boolean") {
            col = col == "1" ? "1" : "0";
          }

          // Assign to DTO only if it's a valid property
          if (validColumns.includes(columnName)) {
            const normalized = normalizeKondoField(columnName, col);
            if (normalized !== undefined) {
              condoDTO[columnName] = normalized;
            }
          }
        });

        // Got a valid slug? Create a promise for this record
        if (slug !== '') {
          const promise = this.processCondoRecord(condoDTO, slug);
          insertPromises.push(promise);
        }
      }

      // Wait for all promises to complete
      await Promise.all(insertPromises);

    } catch (error) {
      console.error("Error inserting data: ", error);
      throw error;
    }
  }

  /**
   * Process a single Condo record - find or create, and update if exists
   * @param condoDTO - The Condo DTO with data
   * @param slug - The slug identifier
   */
  private async processCondoRecord(condoDTO: CreateKondoDto, slug: string): Promise<void> {
    try {
      console.log('------------------');
      console.log('Processing condo:', slug);

      const condo = await this.KondoRepository.findOrCreate({
        where: { slug: slug },
        defaults: condoDTO
      });

      // condo[0] = instance, condo[1] = created (boolean)
      if (!condo[1]) {
        // Record already exists, update it
        await this.KondoRepository.update(
          condoDTO as unknown as UpdateKondoDto,
          { where: { slug: slug } }
        );
        this.updated++;
        console.log('Condo updated:', slug);
      } else {
        // Record was created
        this.created++;
        console.log('Condo created:', slug);
      }
    } catch (error) {
      console.error("Error processing condo:", slug, error);
      throw error;
    }
  }

  showLogs() {
    // Display final integration results
    console.log('\n------ INTEGRATION RESULTS -----');
    console.log('Created:', this.created);
    console.log('Updated:', this.updated);
    console.log('Total Processed:', this.created + this.updated);
    
    if (this.uncapturedColumns.size > 0) {
      console.log('\n------ UNCAPTURED COLUMNS -----');
      console.log('The following columns from Excel were not mapped to the model:');
      Array.from(this.uncapturedColumns).forEach(col => {
        console.log(`  - ${col}`);
      });
      console.log(`Total uncaptured: ${this.uncapturedColumns.size}`);
    }
    console.log('--------------------------------\n');
  }
}
