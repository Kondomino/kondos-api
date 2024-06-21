import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './core/database/database.module';
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

const requireSSL_for_prod_only = process.env.NODE_ENV === 'PRODUCTION'?  { ssl: { require: true, rejectUnauthorized: false }}: {};
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule, 
    SequelizeModule.forRoot({
      dialect: 'postgres' as Dialect,
      dialectOptions: requireSSL_for_prod_only,
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [User, Kondo, Media],
      autoLoadModels: true,
    }),
    UserModule, 
    KondoModule,
    IntegratorModule,
    MediaModule,
    /*
    SeederModule.forRoot({
      // Activate this if you want to run the seeders if the table is empty in the database
      runOnlyIfTableIsEmpty: true,
   }),*/
    //SequelizeModule.forFeature([User, Kondo])
  ],
  controllers: [AppController],
  providers: [...kondoProviders],
})


export class AppModule {}
