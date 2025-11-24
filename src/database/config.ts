import { ConfigService } from '@nestjs/config';
import { Dialect } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DbConfig {
  dialect: Dialect;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  url?: string;
  dialectOptions?: {
    ssl?: {
      require: boolean;
      rejectUnauthorized: boolean;
    };
  };
}

interface SequelizeConfig {
  development: DbConfig;
  test: DbConfig;
  production: DbConfig;
}

const getConfig = (): SequelizeConfig => ({
  development: {
    dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'kondo',
  },
  test: {
    dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'kondo_test',
    dialectOptions: {
      ssl: { require: false, rejectUnauthorized: false }
    },
  },
  production: {
    // Use DATABASE_URL if available, otherwise fall back to individual env vars
    url: process.env.DATABASE_URL || process.env.RENDER_INTERNAL_URL || process.env.RENDER_EXTERNAL_URL || undefined,
    dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
    host: process.env.RENDER_HOSTNAME || process.env.DB_HOST,
    port: parseInt(process.env.RENDER_DB_PORT || process.env.DB_PORT || '5432', 10),
    username: process.env.RENDER_USR || process.env.DB_USER,
    password: process.env.RENDER_PWD || process.env.DB_PASSWORD,
    database: process.env.RENDER_DB || process.env.DB_NAME_PRODUCTION,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
  },
});

// Export for NestJS runtime (keeping ConfigService parameter for compatibility)
export const databaseConfig = (configService?: ConfigService) => {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  const dbconfig = getConfig()[env];
  console.log(`📦 Loading database config for environment: ${env.toUpperCase()}`);
  console.log(dbconfig);
  return dbconfig;
};

// Export for Sequelize CLI
export default () => {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return getConfig()[env];
};
