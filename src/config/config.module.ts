import { Module } from '@nestjs/common';
import { 
  KondoQualityConfig, 
  createKondoQualityConfigFromEnv 
} from './kondo-quality.config';
import {
  ScrapingConfig,
  createScrapingConfigFromEnv
} from './scraping.config';

@Module({
  providers: [
    {
      provide: 'KONDO_QUALITY_CONFIG',
      useFactory: (): KondoQualityConfig => {
        return createKondoQualityConfigFromEnv();
      },
    },
    {
      provide: 'SCRAPING_CONFIG',
      useFactory: (): ScrapingConfig => {
        return createScrapingConfigFromEnv();
      },
    },
  ],
  exports: ['KONDO_QUALITY_CONFIG', 'SCRAPING_CONFIG'],
})
export class ConfigModule {}
