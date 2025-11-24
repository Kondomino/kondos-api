// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        ...databaseConfig(),
        autoLoadModels: true,
        synchronize: false, // Set to false to use migrations
      }),
    }),
  ],
})
export class DatabaseModule {}