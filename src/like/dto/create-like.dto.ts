import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class CreateLikeDto {

    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    userId: number;

    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    kondoId?: number;
    
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    unitId?: number;
}
