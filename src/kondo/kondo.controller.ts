import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { KondoService } from './kondo.service';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { UpdateKondoDto } from './dto/update-kondo.dto';

@Controller('kondo')
export class KondoController {
  constructor(private readonly kondoService: KondoService) {}

  @Post()
  create(@Body() createKondoDto: CreateKondoDto) {
    return this.kondoService.create(createKondoDto);
  }

  @Get()
  findAll() {
    return this.kondoService.findActives();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kondoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKondoDto: UpdateKondoDto) {
    return this.kondoService.update(+id, updateKondoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kondoService.deactivateKondo(+id);
  }
}
