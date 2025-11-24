import { PartialType } from '@nestjs/mapped-types';
import { CreateKondoDto } from './create-kondo.dto';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateKondoDto extends PartialType(CreateKondoDto) {
    @IsString()
    @IsOptional()
    readonly name: string;

    @IsEmail()
    @IsOptional()
    readonly email: string;

    @IsBoolean()
    @IsOptional() // Defaults to true
    readonly active: boolean;
    
    @IsString()
    @IsOptional()
    readonly type: string;
    
    @IsString()
    @IsOptional()
    readonly lot_min_price: string;
    
    @IsNumber()
    @IsOptional()
    readonly lot_avg_price: number;
    
    @IsString()
    @IsOptional()
    readonly cep: string;
    
    @IsString()
    @IsOptional()
    readonly address_street_and_numbers: string;
    
    @IsString()
    @IsOptional()
    readonly neighborhood: string;
    
    @IsString()
    @IsOptional()
    readonly city: string;
    
    @IsString()
    @IsOptional()
    readonly state: string;
    
    @IsBoolean()
    @IsOptional()
    readonly infra_lobby_24h: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_sports_court: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_barbecue_zone: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_pool: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_living_space: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_lagoon: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_eletricity: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_water: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_sidewalks: boolean;

    @IsBoolean()
    @IsOptional()
    readonly infra_broadband: boolean;

    @IsBoolean()
    @IsOptional()
    readonly imediate_delivery: boolean;

    @IsString()
    @IsOptional()
    readonly url: string;

    @IsString()
    @IsOptional()
    readonly phone: string;
}
