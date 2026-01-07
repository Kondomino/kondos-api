import { Controller, Get, Post, Body, Patch, Param, Delete, ClassSerializerInterceptor, UseInterceptors, Query, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateKondoDto } from './dto/create-kondo.dto';
import { SearchKondoDto } from './dto/search-kondo.dto';
import { UpdateKondoDto } from './dto/update-kondo.dto';
import { UpdateFeaturedImageDto } from './dto/update-featured-image.dto';
import { KondoService } from './kondo.service';
import { Public } from '../auth/decorators/public.decorator';
import { SitemapQueryDto } from './dto/sitemap-query.dto';
import { ImageValidationPipe } from './pipes/image-validation.pipe';

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
    console.log('🔍 Full DTO:', JSON.stringify(searchKondoDto, null, 2));
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

  @Public()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateKondoDto: UpdateKondoDto) {
    return this.kondoService.update(+id, updateKondoDto);
  }

  @Public()
  @Post(':id/media')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFiles(new ImageValidationPipe()) files: Express.Multer.File[]
  ) {
    return this.kondoService.uploadMedia(+id, files);
  }

  @Public()
  @Patch(':id/featured-image')
  async updateFeaturedImage(
    @Param('id') id: string,
    @Body() updateFeaturedImageDto: UpdateFeaturedImageDto
  ) {
    return this.kondoService.updateFeaturedImage(+id, updateFeaturedImageDto.featured_image);
  }

  @Public()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.kondoService.deactivateKondo(+id);
  }
}
