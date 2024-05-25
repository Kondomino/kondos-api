import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class SearchKondoDto {
    @IsString()
    @IsOptional()
    name: string;

    @IsString()
    @IsOptional()
    slug: string;

    @IsEmail()
    @IsOptional()
    email: string;
}
