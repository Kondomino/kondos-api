import { Injectable } from '@nestjs/common';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { LikeRepository } from './repository/like.repository';

@Injectable()
export class LikeService {
  
  constructor(
    private readonly LikeRepository: LikeRepository
) {}

  async create(createLikeDto: CreateLikeDto) {
    const { kondoId, unitId, userId } = createLikeDto;

    if (kondoId)
      return await this.LikeRepository.create({ kondoId, userId });

    if (unitId)
      return await this.LikeRepository.create({ unitId, userId });
  }

  findAll() {
    return `This action returns all like`;
  }

  findOne(id: number) {
    return `This action returns a #${id} like`;
  }

  update(id: number, updateLikeDto: UpdateLikeDto) {
    return `This action updates a #${id} like with payload ${JSON.stringify(updateLikeDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} like`;
  }
}
