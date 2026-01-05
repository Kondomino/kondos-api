import { Module } from '@nestjs/common';
import { RawContentStorageService } from './services/raw-content-storage.service';
import { StoragePathGeneratorService } from './services/storage-path-generator.service';
import { StorageStreamCdnService } from './services/storage-stream-cdn.service';
import { DigitalOceanSpacesService } from '../whatsapp/services/digital-ocean-spaces.service';

@Module({
  providers: [
    RawContentStorageService,
    StoragePathGeneratorService,
    StorageStreamCdnService,
    DigitalOceanSpacesService,
  ],
  exports: [
    RawContentStorageService,
    StoragePathGeneratorService,
    StorageStreamCdnService,
    DigitalOceanSpacesService,
  ],
})
export class StorageModule {}
