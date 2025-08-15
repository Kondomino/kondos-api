import * as dotenv from 'dotenv';
import { IDatabaseConfig } from './interfaces/dbConfig.interface';

dotenv.config();

export const databaseConfig: IDatabaseConfig = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_DEVELOPMENT,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
    },
    test: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_TEST,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
    },
    production: {
        // Use Render.com URLs if available, otherwise fall back to individual env vars
        // RENDER_INTERNAL_URL for production deployment, RENDER_EXTERNAL_URL for local testing
        url: process.env.RENDER_INTERNAL_URL || process.env.RENDER_EXTERNAL_URL || undefined,
        username: process.env.RENDER_USR || process.env.DB_USER,
        password: process.env.RENDER_PWD || process.env.DB_PASSWORD,
        database: process.env.RENDER_DB || process.env.DB_NAME_PRODUCTION,
        host: process.env.RENDER_HOSTNAME || process.env.DB_HOST,
        port: process.env.RENDER_DB_PORT || process.env.DB_PORT || 5432,
        dialect: process.env.DB_DIALECT || 'postgres',
        dialectOptions: {
            ssl: { require: true, rejectUnauthorized: false }
        },
    },
};