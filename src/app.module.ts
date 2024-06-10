import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './core/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/entities/user.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { KondoModule } from './kondo/kondo.module';
import { Kondo } from './kondo/entities/kondo.entity';
import { AppController } from './app.controller';
import { IntegratorModule } from './integrator/integrator.module';
import { kondoProviders } from './kondo/repository/kondo.provider';
import { Dialect } from 'sequelize';
import { Media } from './media/entities/media.entity';
import { MediaModule } from './media/media.module';

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres' as Dialect,
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'cracker0',
      database: 'kondo-dev',
      models: [User, Kondo, Media],
      autoLoadModels: true,
    }),
    UserModule, 
    KondoModule,
    IntegratorModule,
    MediaModule
    //SequelizeModule.forFeature([User, Kondo])
  ],
  controllers: [AppController],
  providers: [...kondoProviders],
})
export class AppModule {}
