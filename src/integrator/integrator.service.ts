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
  skipped = 0;
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
   * Build a map of column name to column index for easy access
   * @param columnsNames - Array of column names from Excel
   * @returns Map<columnName, columnIndex>
   */
  private buildColumnIndexMap(columnsNames: string[]): Map<string, number> {
    const columnIndexMap = new Map<string, number>();
    columnsNames.forEach((name, index) => {
      columnIndexMap.set(name, index);
    });
    return columnIndexMap;
  }

  /**
   * Generate slug from name field using column name mapping
   * @param rows - Row data from Excel
   * @param columnIndexMap - Map of column names to indexes
   * @param condoDTO - The DTO being built
   * @returns Generated slug or empty string
   */
  private generateSlugFromName(
    rows: any[],
    columnIndexMap: Map<string, number>,
    condoDTO: CreateKondoDto
  ): string {
    const nameIndex = columnIndexMap.get('name');
    
    if (nameIndex !== undefined && rows[nameIndex] && rows[nameIndex] !== '') {
      return this.slugifyService.run(rows[nameIndex]);
    } else if (condoDTO.name && condoDTO.name.trim() !== '') {
      // Fallback: generate from DTO if name was already set
      return this.slugifyService.run(condoDTO.name);
    }
    
    return '';
  }

  /**
   * Process a single row by iterating through valid columns
   * @param rows - Row data from Excel
   * @param columnsNames - Array of column names
   * @param columnIndexMap - Map of column names to indexes
   * @returns Populated CreateKondoDto
   */
  private processRowData(
    rows: any[],
    columnsNames: string[],
    columnIndexMap: Map<string, number>
  ): CreateKondoDto {
    const condoDTO = new CreateKondoDto();
    const { validColumns } = validateColumns(columnsNames);

    // Process each valid column by name, not index
    for (const columnName of validColumns) {
      const colIndex = columnIndexMap.get(columnName);
      if (colIndex === undefined) continue; // Column not found in this row
      
      let value = rows[colIndex];
      
      // Skip empty/undefined values
      if (value === '' || value === undefined || value === null) {
        continue;
      }

      // Boolean normalization
      if (this.dataTypes[colIndex] && this.dataTypes[colIndex][0] === 'boolean') {
        value = value === '1' ? '1' : '0';
      }

      // Normalize and assign to DTO
      const normalized = normalizeKondoField(columnName, value);
      if (normalized !== undefined) {
        condoDTO[columnName] = normalized;
      }
    }

    return condoDTO;
  }

  /**
   * Validate that a record has all required fields
   * @param condoDTO - The DTO to validate
   * @param slug - The generated slug
   * @returns true if valid, false otherwise
   */
  private isValidRecord(condoDTO: CreateKondoDto, slug: string): boolean {
    if (!condoDTO.name || condoDTO.name.trim() === '') {
      console.log(`⚠️  Skipping record with slug "${slug || 'unknown'}" - missing required name field`);
      this.skipped++;
      return false;
    }
    
    if (!slug || slug === '') {
      console.log(`⚠️  Skipping record with name "${condoDTO.name}" - failed to generate slug`);
      this.skipped++;
      return false;
    }
    
    return true;
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
      // Build column name to index mapping
      const columnIndexMap = this.buildColumnIndexMap(columnsNames);
      console.log('Column mapping:', Object.fromEntries(columnIndexMap));

      // Collect all promises for parallel processing
      const insertPromises: Promise<void>[] = [];

      for (const rows of records) {
        // Process row data by column names
        const condoDTO = this.processRowData(rows, columnsNames, columnIndexMap);
        
        // Generate slug from name
        const slug = this.generateSlugFromName(rows, columnIndexMap, condoDTO);
        
        // Assign slug to DTO
        if (slug) {
          condoDTO.slug = slug;
        }

        // Validate record has required fields
        if (!this.isValidRecord(condoDTO, slug)) {
          continue; // Skip invalid record
        }

        // Create promise for this valid record
        const promise = this.processCondoRecord(condoDTO, slug);
        insertPromises.push(promise);
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
    console.log('Skipped:', this.skipped);
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
