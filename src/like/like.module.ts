import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { likeProviders } from './repository/like.provider';
import { LikeRepository } from './repository/like.repository';

@Module({
  controllers: [LikeController],
  providers: [LikeService, ...likeProviders, LikeRepository],
})
export class LikeModule {}
