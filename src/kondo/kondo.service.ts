import { Injectable } from '@nestjs/common';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { UpdateKondoDto } from './dto/update-kondo.dto';

@Injectable()
export class KondoService {
  create(createKondoDto: CreateKondoDto) {
    return 'This action adds a new kondo';
  }

  findAll() {
    return `This action returns all kondo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} kondo`;
  }

  update(id: number, updateKondoDto: UpdateKondoDto) {
    return `This action updates a #${id} kondo`;
  }

  remove(id: number) {
    return `This action removes a #${id} kondo`;
  }
}
