import { Module } from '@nestjs/common';
import { RawContentStorageService } from './services/raw-content-storage.service';
import { StoragePathGeneratorService } from './services/storage-path-generator.service';
import { DigitalOceanSpacesService } from '../whatsapp/services/digital-ocean-spaces.service';

@Module({
  providers: [
    RawContentStorageService,
    StoragePathGeneratorService,
    DigitalOceanSpacesService,
  ],
  exports: [
    RawContentStorageService,
    StoragePathGeneratorService,
  ],
})
export class StorageModule {}
