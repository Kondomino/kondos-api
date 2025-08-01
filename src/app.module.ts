import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { KondoModule } from './kondo/kondo.module';
import { AppController } from './app.controller';
import { IntegratorModule } from './integrator/integrator.module';
import { kondoProviders } from './kondo/repository/kondo.provider';
import { Dialect } from 'sequelize';
import { Kondo } from './kondo/entities/kondo.entity';
import { Media } from './media/entities/media.entity';
import { MediaModule } from './media/media.module';
import { User } from './user/entities/user.entity';
import { UnitModule } from './unit/unit.module';
import { Unit } from './unit/entities/unit.entity';
import { LikeModule } from './like/like.module';
import { Like } from './like/entities/like.entity';
import { AuthModule } from './auth/auth.module';
import { GoogleStrategy } from './auth/strategies/google.strategy';
import * as dotenv from 'dotenv';

dotenv.config();

const requireSSL_for_prod_only = process.env.NODE_ENV === 'PRODUCTION'?  { ssl: { require: true, rejectUnauthorized: false }}: {};

// Debug environment variables
console.log('🔍 Environment Variables Debug APP MODULE:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('DB_HOST:', process.env.DB_HOST || 'undefined (fallback: localhost)');
console.log('DB_PORT:', process.env.DB_PORT || 'undefined (fallback: 5433)');
console.log('DB_USER:', process.env.DB_USER || 'undefined (fallback: postgres)');
console.log('DB_NAME:', process.env.DB_NAME || 'undefined (fallback: kondo)');
console.log('DB_DIALECT:', process.env.DB_DIALECT || 'undefined (fallback: postgres)');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // DatabaseModule,  // TEMPORARILY DISABLED - might conflict with SequelizeModule.forRoot
    SequelizeModule.forRoot({
      dialect: (process.env.DB_DIALECT || 'postgres') as Dialect,
      dialectOptions: requireSSL_for_prod_only,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'kondo',
      models: [User, Kondo, Media, Unit, Like],
      autoLoadModels: true,
      logging: (msg) => console.log('🐘 DB Query:', msg),
      logQueryParameters: true,
      synchronize: false,
    }),
    UserModule, 
    KondoModule,
    IntegratorModule,
    MediaModule,
    UnitModule,
    LikeModule,
    AuthModule
  //   SeederModule.forRoot({
  //     // Activate this if you want to run the seeders if the table is empty in the database
  //     runOnlyIfTableIsEmpty: true,
  //     logging: true,
  //  }),
    //SequelizeModule.forFeature([User, Kondo])
  ],
  controllers: [AppController],
  providers: [...kondoProviders, GoogleStrategy],
})


export class AppModule {}
