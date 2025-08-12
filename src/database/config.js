require('dotenv').config();

module.exports = {
    development: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME_DEVELOPMENT || 'kondo',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5433,
        dialect: process.env.DB_DIALECT || 'postgres',
    },
    test: {
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME_TEST || 'kondo_test',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5433,
        dialect: process.env.DB_DIALECT || 'postgres',
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME_PRODUCTION,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: process.env.DB_DIALECT || 'postgres',
    },
}; 