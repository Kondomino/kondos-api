import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { PageOptionsDto } from "../../core/pagination/page.options.dto";
import { KondoStatus } from "../entities/kondo.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SearchKondoDto extends PageOptionsDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    slug?: string;

    @ApiProperty()
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    active?: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    status?: string = KondoStatus.DONE;

    @ApiProperty()
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    conveniences?: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    randomize?: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    highlight?: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeHighlighted?: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    includeInactive?: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    allStatuses?: boolean = false;
}
