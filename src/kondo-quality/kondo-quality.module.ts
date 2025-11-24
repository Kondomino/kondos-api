import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '../config/config.module';
import { KondoQualityAssessmentService } from './services/kondo-quality-assessment.service';
import { KondoContentAnalyzerService } from './services/kondo-content-analyzer.service';
import { Kondo } from '../kondo/entities/kondo.entity';
import { Media } from '../media/entities/media.entity';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([Kondo, Media]),
  ],
  providers: [
    KondoQualityAssessmentService,
    KondoContentAnalyzerService,
  ],
  exports: [
    KondoQualityAssessmentService,
    KondoContentAnalyzerService,
  ],
})
export class KondoQualityModule {}
