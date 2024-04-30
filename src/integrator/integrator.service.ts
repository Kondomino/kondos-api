import { Inject, Injectable } from '@nestjs/common';
import { KONDO_REPOSITORY } from 'src/core/constants';
import { IDataServices } from 'src/database/pg.dataservice/idata.services';
import { Kondo } from 'src/kondo/entities/Kondo.entity';
import { SlugifyService } from 'src/utils/slugify/slugify.service';
const { boolean_columns } = require("./types/boolean_columns");
import { readFile, utils } from 'xlsx';

//encode_cell
//sheet_to_json

@Injectable()
export class IntegratorService {
  dataTypes: any[] = [];
  updated = 0;
  created = 0;

  constructor(
    private slugifyService: SlugifyService,
    //@Inject(KONDO_REPOSITORY) private readonly KondoRepository: typeof Kondo
    private dataServices: IDataServices,
  ) {}

  run() {

    const ae = this.dataServices.kondos.findAll();
    //const condos = this.KondoRepository.findAll();
    return ae;

    const options = {
      'file': './files/kondos.xlsx',
      'filepath': 'C:/Projetos/kondos-api/src/integrator/files/kondos.xlsx'
    };

    return this.runIntegrator(options);
  }

  async runIntegrator(options) {

    // let's first read the excel file
    const { sheets, rows, workbook } = await this.readExcel(options.filepath);

    // let's normalize the data
    this.prepareData(sheets,rows,workbook);


    // let's check if the item exists
    console.log('------ LOGS -----');
    console.log('updated', this.updated);
    console.log('created',this.created);

    return 'successfull'
  }

  async readExcel(filePath) {
    
    const workbook = readFile(filePath);
    const sheets = workbook.SheetNames;
  
    let rows = [];
  
    // Retrieving column names form 
    for (const sheet of sheets) {
      
      if (sheet == 'Kondos') {
        const worksheet = workbook.Sheets[sheet];
        const range = utils.decode_range(worksheet['!ref']);
  
        let columns = []; //Emptying list for new sheet
        
        
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
        const tableCols = rows[i].map((columnName, index) => {
          return `${columnName}`
        }).join(", ");
  
        const columnsNames = rows[i];
  
        const worksheet = workbook.Sheets[tableName];
        const options = { 
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd',
          blankrows: false,
          defval: ''
         };
        var tableData = utils.sheet_to_json(worksheet, options);
  
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
  
      var slug = '';
      var rowForUpdate = '';
  
      //    const client = await pool.connect();
      const values = records.map(async (rows, rowIndex) => {
  
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
          if (col === "") {
            col = "''";
          } else {
            col = `'${col}'`;
          }
  
          // preparing cols and values for an update
          rowForUpdate += `${columnsNames[colIndex]} = ${col},`;
        });
  
        const rowString = sanitizedRecord.join(", ");
  
        //
        if (slug !== '') {
  
          //let condo = this.KondoRepository.findOne<Kondo>({ where: { slug } });
          let condo = 'ae';
          console.log('condo fetched is ', condo);
          //let condo = 1;
  
          console.log('condo fetched is ', condo);
          if (condo) {
            // remove the last comma
            rowForUpdate = rowForUpdate.slice(0, -1);
            // UPDATE
            //updateCondo(slug, rowForUpdate);
            this.updated++;
          }
          else {
            // CREATE
            //createCondo(sanitizedRecord, tableCols);
            this.created++;
          }
  
          slug = '';
          rowForUpdate = '';
        }
  
        return `(${rowString})`;
      }).join(", ");
  
      //const query = `INSERT INTO "${tableName}" (${tableCols}) VALUES ${values};`;
      //await client.query(query);
    } catch (error) {
      console.error("Error inserting data: ", error);
      throw error;
    } finally {
      //pool.release();
    }
  }
}
