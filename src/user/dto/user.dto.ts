import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UserDto {

    @ApiProperty()
    @IsEmail()
    readonly email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly password?: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly gender?: string;

    @ApiProperty()
    @IsString()
    readonly firstName: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly lastName?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly picture?: string;
}
