import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { likeProviders } from './repository/like.provider';
import { LikeRepository } from './repository/like.repository';
import { Like } from './entities/like.entity';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  controllers: [LikeController],
  providers: [LikeService, ...likeProviders, LikeRepository],
  imports: [
      SequelizeModule.forFeature([Like]), 
    ]
})
export class LikeModule {}
