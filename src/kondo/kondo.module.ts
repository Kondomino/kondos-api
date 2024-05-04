import { Module } from '@nestjs/common';
import { KondoService } from './kondo.service';
import { KondoController } from './kondo.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Kondo } from './entities/Kondo.entity';
import { kondoProviders } from './repository/kondo.provider';
import { KondoRepository } from './repository/kondo.repository';

@Module({
  controllers: [KondoController],
  providers: [KondoService, ...kondoProviders, KondoRepository],
  imports: [SequelizeModule.forFeature([Kondo])]
})
export class KondoModule {}
