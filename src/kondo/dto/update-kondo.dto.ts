import { PartialType } from '@nestjs/mapped-types';
import { CreateKondoDto } from './create-kondo.dto';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateKondoDto extends PartialType(CreateKondoDto) {
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly name: string;

    @ApiProperty()
    @IsEmail()
    @IsOptional()
    readonly email: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional() // Defaults to true
    readonly active: boolean;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly type: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly lot_min_price: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly lot_avg_price: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly cep: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly address_street_and_numbers: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly neighborhood: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly city: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly state: string;
    
    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_lobby_24h: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_sports_court: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_barbecue_zone: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_pool: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_living_space: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_lagoon: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_eletricity: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_water: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_sidewalks: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly infra_broadband: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    readonly imediate_delivery: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly url: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    readonly phone: string;
}
