import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { mediaProviders } from './repository/media.provider';
import { kondoProviders } from '../kondo/repository/kondo.provider';
import { Media } from './entities/media.entity';
import { Kondo } from '../kondo/entities/kondo.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { MediaRepository } from './repository/media.repository';
import { KondoRepository } from '../kondo/repository/kondo.repository';

@Module({
  controllers: [MediaController],
  providers: [MediaService, ...mediaProviders, ...kondoProviders, MediaRepository, KondoRepository],
  imports: [
    SequelizeModule.forFeature([Media, Kondo]), 
  ],
  exports: [MediaService, MediaRepository, ...mediaProviders]
})
export class MediaModule {}
