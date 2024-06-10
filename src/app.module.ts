import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { KondoModule } from './kondo/kondo.module';
import { AppController } from './app.controller';
import { IntegratorModule } from './integrator/integrator.module';
import { kondoProviders } from './kondo/repository/kondo.provider';
import { MediaModule } from './media/media.module';
import { User } from './user/entities/user.entity';
import { Kondo } from './kondo/entities/Kondo.entity';
import { Media } from './media/entities/media.entity';
import { Dialect } from 'sequelize';
import { DatabaseModule } from './core/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres' as Dialect,
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'cracker0',
      database: 'kondo-dev',
      models: [User, Kondo],
      autoLoadModels: true,
    }),
    UserModule, 
    KondoModule,
    IntegratorModule,
    SequelizeModule.forFeature([Kondo, User]),
    DatabaseModule
  ],
  controllers: [AppController],
  providers: [...kondoProviders],
})
export class AppModule {}
