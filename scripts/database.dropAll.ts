import { Sequelize, QueryTypes } from 'sequelize';
// Note: keep the explicit .ts extension so ESM loaders (ts-node/tsx) resolve this file correctly
import getDbConfig from '../src/database/config.ts';

// Build a standalone Sequelize instance using the same config used by the app/CLI
const dbConfig = getDbConfig();
const sequelize = dbConfig.url
  ? new Sequelize(dbConfig.url, dbConfig as any)
  : new Sequelize(dbConfig.database, dbConfig.username as string, dbConfig.password as string, dbConfig as any);

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
