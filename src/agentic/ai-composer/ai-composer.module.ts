import { Module } from '@nestjs/common';
import { AIComposerService } from './ai-composer.service';
import { AIComposerController } from './ai-composer.controller';
import { DescriptionGeneratorService } from './processors/description-generator.service';
import { AmenityExtractorService } from './processors/amenity-extractor.service';
import { FieldFillerService } from './processors/field-filler.service';
import { KondoModule } from '../../kondo/kondo.module';
import { GrokService } from '../agents/chatty/grok.service';

@Module({
  imports: [KondoModule],
  controllers: [AIComposerController],
  providers: [
    AIComposerService,
    DescriptionGeneratorService,
    AmenityExtractorService,
    FieldFillerService,
    GrokService,
  ],
  exports: [AIComposerService],
})
export class AIComposerModule {}
