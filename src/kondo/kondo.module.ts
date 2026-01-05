import { Module } from '@nestjs/common';
import { KondoService } from './kondo.service';
import { KondoController } from './kondo.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Kondo } from './entities/kondo.entity';
import { kondoProviders } from './repository/kondo.provider';
import { KondoRepository } from './repository/kondo.repository';
import { SlugifyModule } from '../utils/slugify/slugify.module';
import { StorageModule } from '../storage/storage.module';
import { MediaModule } from '../media/media.module';

@Module({
  controllers: [KondoController],
  providers: [KondoService, ...kondoProviders, KondoRepository],
  imports: [
    SequelizeModule.forFeature([Kondo]), 
    SlugifyModule,
    StorageModule,
    MediaModule
  ],
  exports: [KondoRepository, ...kondoProviders]
})
export class KondoModule {}
