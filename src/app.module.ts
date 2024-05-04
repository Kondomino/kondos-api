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

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
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
    SequelizeModule.forFeature([Kondo])
  ],
  controllers: [AppController],
  providers: [...kondoProviders],
})
export class AppModule {}
