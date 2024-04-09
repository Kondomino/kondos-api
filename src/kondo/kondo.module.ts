import { Module } from '@nestjs/common';
import { KondoService } from './kondo.service';
import { KondoController } from './kondo.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Kondo } from './entities/Kondo.entity';
import { kondoProviders } from './kondo.provider';

@Module({
  controllers: [KondoController],
  providers: [KondoService, ...kondoProviders],
  imports: [SequelizeModule.forFeature([Kondo])]
})
export class KondoModule {}
