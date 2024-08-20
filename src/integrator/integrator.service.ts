import { Injectable } from '@nestjs/common';
import { KondoRepository } from '../kondo/repository/kondo.repository';
import { readFile, utils } from 'xlsx';
import { boolean_columns } from './types/boolean_columns';
import { CreateKondoDto } from '../kondo/dto/create-kondo.dto';
import { SlugifyService } from '../utils/slugify/slugify.service';

//encode_cell
//sheet_to_json

@Injectable()
export class IntegratorService {
  dataTypes: unknown[] = [];
  updated = 0;
  created = 0;

  constructor(
    private slugifyService: SlugifyService,
    private readonly KondoRepository: KondoRepository
  ) {}

  async run() {

    const options = {
      'file': './files/kondos.xlsx',
      'filepath': 'C:/Projetos/kondos-api/src/integrator/files/kondos.xlsx'
      //'filepath': './files/kondos.xlsx'
    };

    return this.runIntegrator(options);
  }

  async runIntegrator(options) {

    // let's first read the excel file
    const { sheets, rows, workbook } = await this.readExcel(options.filepath);

    // let's normalize the data
    this.prepareData(sheets,rows,workbook);

    this.showLogs();

    return 'successfull'
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
  
  async prepareData(sheets,rows, workbook) {
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
        const tableData = utils.sheet_to_json(worksheet, options);
  
        tableData.shift();
  
        await this.insertData(tableData, columnsNames);
      }
    }
  }
  
  
  /**
  This function inserts data into a specified table in a PostgreSQL database.
  @param tableName - The name of the table where the data will be inserted.
  @param tableCols - The columns of the table where the data will be inserted.
  @param records - The records parameter is an array of arrays, where each inner array represents a
  row of data to be inserted into the specified table. Each inner array contains values for each
  column in the table, in the order specified by the tableCols parameter.
   */
  async insertData(records, columnsNames) {

    console.log('inserting data....');

    try {
  
      let slug = '';
      //let rowForUpdate = '';
      
      //    const client = await pool.connect();
      records.map(async (rows) => {
  
        const condoDTO = new CreateKondoDto();

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
            col = col == "1"? "1":"0";
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

            console.log('------------------ ')
            console.log('lets try with ', condoDTO.slug);
            const condo = await this.KondoRepository.findOrCreate({
              where: { slug: condoDTO.slug },
              defaults: condoDTO
            });

            console.log('found condo 0 ??', condo[0]);
            console.log('found condo 1 ??', condo[1]);

            // Condo was created?
            if (!condo[1]) {
              // UPDATE
              this.KondoRepository.update(condoDTO, {slug: condoDTO.slug})
              this.updated++;
            }
            else {
              console.log('condo created', condoDTO.slug);
              // CREATE
              this.created++;
            }
    
            slug = '';
            
            } catch(error) {
              console.error("Error inserting data: ", error);
              throw error;
            } 
        }
  
        return `(${rowString})`;
      }).join(", ");
  
    } catch (error) {
      console.error("Error inserting data: ", error);
      throw error;
    } finally {
      //pool.release();
    }
  }

  showLogs() {

    // let's check if the item exists
    console.log('------ LOGS -----');
    console.log('updated', this.updated);
    console.log('created',this.created);
  }
}
