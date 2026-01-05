import { Sequelize, QueryTypes } from 'sequelize';
// Note: keep the explicit .ts extension so ESM loaders (ts-node/tsx) resolve this file correctly
import getDbConfig from '../src/database/config.ts';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--prod') || args.includes('--production');

// Build Sequelize instance
let sequelize: Sequelize;

if (isProduction) {
  console.log('🔴 PRODUCTION MODE: Targeting production database');
  
  // Use RENDER_EXTERNAL_URL for external connections (has full hostname)
  const productionUrl = process.env.RENDER_EXTERNAL_URL || process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ ERROR: RENDER_EXTERNAL_URL or DATABASE_URL must be set for production');
    process.exit(1);
  }
  
  console.log(`🔗 Host: ${productionUrl.split('@')[1]?.split('/')[0] || 'N/A'}`);
  console.log('');
  
  sequelize = new Sequelize(productionUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  } as any);
  
} else {
  console.log('🟢 DEVELOPMENT MODE: Targeting local database');
  
  const dbConfig = getDbConfig();
  
  console.log(`📍 Database: ${dbConfig.database}`);
  console.log(`🔗 Host: ${dbConfig.host}`);
  console.log('');
  
  sequelize = dbConfig.url
    ? new Sequelize(dbConfig.url, dbConfig as any)
    : new Sequelize(dbConfig.database, dbConfig.username as string, dbConfig.password as string, dbConfig as any);
}

async function dropAll() {
  const qi = sequelize.getQueryInterface();

  try {
    console.log("1) Dropping all tables…");
    await qi.dropAllTables();

    console.log("2) Dropping all ENUM types…");
    const enumTypes = await sequelize.query<{ typname: string }>(`
      SELECT t.typname 
      FROM pg_type t 
      WHERE t.typname LIKE 'enum_%';
    `, { type: QueryTypes.SELECT });

    for (const row of enumTypes) {
      const typeName = row.typname;
      await sequelize.query(`DROP TYPE IF EXISTS "${typeName}" CASCADE;`);
      console.log(`   ✔ Dropped enum type: ${typeName}`);
    }

    console.log("3) Dropping leftover sequences…");
    const sequences = await sequelize.query<{ sequence_name: string }>(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public';
    `, { type: QueryTypes.SELECT });

    for (const seq of sequences) {
      const seqName = seq.sequence_name;
      await sequelize.query(`DROP SEQUENCE IF EXISTS "${seqName}" CASCADE;`);
      console.log(`   ✔ Dropped sequence: ${seqName}`);
    }

    console.log("✨ DONE: all tables, enums, and sequences removed.");
    process.exit(0);

  } catch (err) {
    console.error("❌ ERROR while dropping:", err);
    process.exit(1);
  }
}

dropAll();
