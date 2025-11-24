import { Module } from '@nestjs/common';
import { 
  KondoQualityConfig, 
  createKondoQualityConfigFromEnv 
} from './kondo-quality.config';

@Module({
  providers: [
    {
      provide: 'KONDO_QUALITY_CONFIG',
      useFactory: (): KondoQualityConfig => {
        return createKondoQualityConfigFromEnv();
      },
    },
  ],
  exports: ['KONDO_QUALITY_CONFIG'],
})
export class ConfigModule {}
