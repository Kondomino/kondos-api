import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserDto {

    @IsEmail()
    readonly email: string;

    @IsString()
    @IsOptional()
    readonly password?: string;
    
    @IsString()
    @IsOptional()
    readonly gender?: string;

    @IsString()
    readonly firstName: string;

    @IsString()
    @IsOptional()
    readonly lastName?: string;

    @IsString()
    @IsOptional()
    readonly picture?: string;
}
