import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './core/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './user/entities/user.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { KondoModule } from './kondo/kondo.module';
import { Kondo } from './kondo/entities/kondo.entity';

@Module({
  imports: [UserModule, KondoModule, DatabaseModule, ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'cracker0',
      database: 'postgres',
      models: [User, Kondo],
      autoLoadModels: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
