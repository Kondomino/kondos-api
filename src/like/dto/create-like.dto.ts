import { Type } from "class-transformer";
import { IsInt, IsOptional } from "class-validator";

export class CreateLikeDto {

    @IsInt()
    @Type(() => Number)
    userId: number;

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    kondoId?: number;
    
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    unitId?: number;
}
