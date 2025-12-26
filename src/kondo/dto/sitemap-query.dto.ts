import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SitemapQueryDto {
    @ApiProperty({ required: false, default: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly page?: number = 1;

    @ApiProperty({ required: false, default: 50000 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    readonly limit?: number = 50000;

    @ApiProperty({ required: false, description: "'1' for highlighted only, '0' for regular only" })
    @IsString()
    @IsOptional()
    readonly highlighted?: string;
}

export interface KondoCountResponse {
    highlighted: number;
    regular: number;
}

export interface KondoSitemapItem {
    slug: string;
    updatedAt: Date;
    highlight: boolean;
}
