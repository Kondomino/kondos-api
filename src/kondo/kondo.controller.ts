import { Controller, Get, Post, Body, Patch, Param, Delete, ClassSerializerInterceptor, UseInterceptors, Query } from '@nestjs/common';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { UpdateKondoDto } from './dto/update-kondo.dto';
import { KondoService } from './kondo.service';
import { Public } from '../auth/decorators/public.decorator';
import { SitemapQueryDto } from './dto/sitemap-query.dto';

@Controller('kondo')
@UseInterceptors(ClassSerializerInterceptor)
export class KondoController {
  constructor(private readonly kondoService: KondoService) {}

  @Public()
  @Post()
  create(@Body() createKondoDto: CreateKondoDto) {
    return this.kondoService.create(createKondoDto);
  }

  @Public()
  @Get()
  async findAll(@Query() searchKondoDto: SearchKondoDto) {
    return await this.kondoService.findAll(searchKondoDto);
  }

  @Public()
  @Get('/conveniences')
  async getConveniences() {
    return this.kondoService.getConveniences();
  }

  @Public()
  @Get('/count')
  async getCount() {
    return this.kondoService.getCount();
  }

  @Public()
  @Get('/sitemap')
  async getSitemap(@Query() sitemapQueryDto: SitemapQueryDto) {
    return this.kondoService.getSitemapData(sitemapQueryDto);
  }

  // @Public()
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   console.log('api received kondo/findOne request');
  //   return this.kondoService.findOne(+id);
  // }

  @Public()
  @Post('/findBy')
  findBy(@Body() searchKondoDto: SearchKondoDto) {
    //console.log('received kondo/findBy request', searchKondoDto);
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
