import { ConfigService } from '@nestjs/config';
import { Dialect } from 'sequelize';

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

const getConfig = (configService: ConfigService): SequelizeConfig => ({
  development: {
    dialect: (configService.get<string>('DB_DIALECT') || 'postgres') as Dialect,
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('DB_USER') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'postgres',
    database: configService.get<string>('DB_NAME_DEVELOPMENT') || 'kondo',
  },
  test: {
    dialect: (configService.get<string>('DB_DIALECT') || 'postgres') as Dialect,
    host: configService.get<string>('DB_HOST') || 'localhost',
    port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('DB_USER') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'postgres',
    database: configService.get<string>('DB_NAME_TEST') || 'kondo_test',
    dialectOptions: {
      ssl: { require: false, rejectUnauthorized: false }
    },
  },
  production: {
    // Use Render.com URLs if available, otherwise fall back to individual env vars
    url: configService.get<string>('RENDER_INTERNAL_URL') || configService.get<string>('RENDER_EXTERNAL_URL') || undefined,
    dialect: (configService.get<string>('DB_DIALECT') || 'postgres') as Dialect,
    host: configService.get<string>('RENDER_HOSTNAME') || configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('RENDER_DB_PORT') || configService.get<string>('DB_PORT') || '5432', 10),
    username: configService.get<string>('RENDER_USR') || configService.get<string>('DB_USER'),
    password: configService.get<string>('RENDER_PWD') || configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('RENDER_DB') || configService.get<string>('DB_NAME_PRODUCTION'),
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
  },
});

// Export for NestJS runtime
export const databaseConfig = (configService: ConfigService) => {
  const env = (configService.get<string>('NODE_ENV') || 'development').toLowerCase();
  return getConfig(configService)[env];
};

// Export for Sequelize CLI
export default (configService: ConfigService = new ConfigService()) => {
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  return getConfig(configService)[env];
};
