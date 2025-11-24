import { IsNumber, Min, Max, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class QualityScoresDto {
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  contentQuality: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  mediaQuality: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  overallQuality: number;
}

export class ContentQualityBreakdownDto {
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  basicInfo: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  pricing: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  conveniences: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  details: number;
}

export class MediaQualityBreakdownDto {
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  images: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  quality: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  videos: number;

  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  recency: number;
}

export class QualityBreakdownDto {
  @Type(() => ContentQualityBreakdownDto)
  content: ContentQualityBreakdownDto;

  @Type(() => MediaQualityBreakdownDto)
  media: MediaQualityBreakdownDto;
}

export class QualityAssessmentDto extends QualityScoresDto {
  @IsNumber()
  kondoId: number;

  @IsBoolean()
  meetsThreshold: boolean;

  @IsDate()
  @Type(() => Date)
  lastUpdated: Date;

  @Type(() => QualityBreakdownDto)
  breakdown: QualityBreakdownDto;
}

export class UpdateQualityScoresDto {
  @IsNumber()
  kondoId: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  contentQuality?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(1.0)
  mediaQuality?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}
