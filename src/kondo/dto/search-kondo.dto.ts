import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../core/pagination/page.options.dto";
import { KondoStatus } from "../entities/kondo.entity";
import { ApiProperty } from "@nestjs/swagger";

export class SearchKondoDto extends PageOptionsDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    slug: string;

    @ApiProperty()
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    active: boolean = true;

    @ApiProperty()
    @IsString()
    @IsOptional()
    status: string = KondoStatus.DONE;

    @ApiProperty()
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    conveniences: string;
}
