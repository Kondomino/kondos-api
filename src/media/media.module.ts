import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { mediaProviders } from './repository/media.provider';
import { Media } from './entities/media.entity';
import { SequelizeModule } from '@nestjs/sequelize';
import { MediaRepository } from './repository/media.repository';
import { SeedMedia } from './seeds/media.seeder';
import { SeederModule } from 'nestjs-sequelize-seeder';

@Module({
  controllers: [MediaController],
  providers: [MediaService, ...mediaProviders, MediaRepository],
  imports: [
    SequelizeModule.forFeature([Media]), 
    SeederModule.forFeature([SeedMedia])
  ]
})
export class MediaModule {}
