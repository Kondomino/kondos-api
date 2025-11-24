import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { Gender } from "../entities/user.entity";

export class UserDto {

    @ApiProperty()
    @IsEmail()
    readonly email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly password?: string;
    
    @ApiProperty()
    @IsEnum(Gender)
    @IsOptional()
    readonly gender?: Gender;

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
