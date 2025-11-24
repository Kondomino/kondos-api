import { Injectable } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  create(createUnitDto: CreateUnitDto) {
    return `This action adds a new unit with payload ${JSON.stringify(createUnitDto)}`;
  }

  findAll() {
    return `This action returns all unit`;
  }

  findOne(id: number) {
    return `This action returns a #${id} unit`;
  }

  update(id: number, updateUnitDto: UpdateUnitDto) {
    return `This action updates a #${id} unit with payload ${JSON.stringify(updateUnitDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} unit`;
  }
}
