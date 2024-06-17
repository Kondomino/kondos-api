import { Controller, Get, Post, Body, Patch, Param, Delete, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { UpdateKondoDto } from './dto/update-Kondo.dto';
import { KondoService } from './kondo.service';

@Controller('kondo')
@UseInterceptors(ClassSerializerInterceptor)
export class KondoController {
  constructor(private readonly kondoService: KondoService) {}

  @Post()
  create(@Body() createKondoDto: CreateKondoDto) {
    return this.kondoService.create(createKondoDto);
  }

  @Get()
  async findAll() {
    return this.kondoService.findActives();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kondoService.findOne(+id);
  }

  @Post('/findBy')
  findBy(@Body() searchKondoDto: SearchKondoDto) {
    console.log('findBy');
    return this.kondoService.findBy(searchKondoDto);
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
