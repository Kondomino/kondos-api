import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { mediaProviders } from './repository/media.provider';
import { Media } from './entities/media.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { MediaRepository } from './repository/media.repository';

@Module({
  controllers: [MediaController],
  providers: [MediaService, ...mediaProviders, MediaRepository],
  imports: [SequelizeModule.forFeature([Media])]
})
export class MediaModule {}
