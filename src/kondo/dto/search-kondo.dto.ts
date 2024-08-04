import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../core/pagination/page.options.dto";
import { KondoStatus } from "../entities/kondo.entity";

export class SearchKondoDto extends PageOptionsDto {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    slug: string;

    @IsEmail()
    @IsOptional()
    email: string;

    @IsBoolean()
    @IsOptional()
    active: boolean = true;

    @IsString()
    @IsOptional()
    status: string = KondoStatus.DONE;

    @IsString()
    @IsOptional()
    phrase: string;
}
