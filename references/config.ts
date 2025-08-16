// src/database/config.ts
import { ConfigService } from '@nestjs/config';
import { Dialect } from 'sequelize';

interface DbConfig {
  dialect: Dialect;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

interface SequelizeConfig {
  development: DbConfig;
  staging: DbConfig;
  production: DbConfig;
}

const getConfig = (configService: ConfigService): SequelizeConfig => ({
  development: {
    dialect: configService.get<Dialect>('DB_DIALECT') || 'postgres',
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'password',
    database: configService.get<string>('DB_DATABASE') || 'mydb_dev',
  },
  staging: {
    dialect: configService.get<Dialect>('DB_DIALECT') || 'postgres',
    host: configService.get<string>('DB_HOST') || 'staging-host',
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'password',
    database: configService.get<string>('DB_DATABASE') || 'mydb_staging',
  },
  production: {
    dialect: configService.get<Dialect>('DB_DIALECT') || 'postgres',
    host: configService.get<string>('DB_HOST') || 'prod-host',
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'password',
    database: configService.get<string>('DB_DATABASE') || 'mydb_prod',
  },
});

// Export for NestJS runtime
export const databaseConfig = (configService: ConfigService) => {
  const env = configService.get<string>('NODE_ENV') || 'development';
  return getConfig(configService)[env];
};

// Export for Sequelize CLI
export default (configService: ConfigService = new ConfigService()) => {
  const env = process.env.NODE_ENV || 'development';
  return getConfig(configService)[env];
};