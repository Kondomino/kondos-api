import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { UserDto } from './user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(UserDto) {
    @ApiProperty()
    @IsString()
    readonly name: string;
    
    readonly gender: string;
}
