import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsEnum, IsNumber, IsBoolean } from "class-validator";
import { Gender } from "../entities/user.entity";

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsString()
    password: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    firstName?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    lastName?: string;

    @ApiProperty({ required: false, enum: Gender })
    @IsEnum(Gender)
    @IsOptional()
    gender?: Gender;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    age?: number;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    active?: boolean;
}