import { Type } from 'class-transformer';
import { IsOptional, IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { CreateKondoDto } from './create-kondo.dto';

// Simple media DTO for relations
export class SimpleMediaDto {
    @IsString()
    filename: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsBoolean()
    @IsOptional()
    active?: boolean;
}

export class CreateKondoWithRelationsDto extends CreateKondoDto {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SimpleMediaDto)
    medias?: SimpleMediaDto[];
}