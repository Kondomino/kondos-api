import { Controller, Get, Param } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /*
  @Post()
  create(@Body() createMediaDto: CreateMediaDto) {
    return this.mediaService.create(createMediaDto);
  }
  */

  @Get(':id')
  findMediasOfKondo(@Param('id') kondoId: string) {
    return this.mediaService.findMediasOfKondo(kondoId);
  }

  // @Get(':id')
  // findOne(@Body() searchMediaDto: SearchMediaDto) {
  //   return this.mediaService.findBy(searchMediaDto);
  // }

  /*
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }*/
}
