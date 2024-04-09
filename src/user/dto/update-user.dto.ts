import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { UserDto } from './user.dto';

export class UpdateUserDto extends PartialType(UserDto) {
    @IsString()
    readonly name: string;
    
    readonly gender: string;
}
