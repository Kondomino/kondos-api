import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateKondoDto {
    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    slug: string;

    @ApiProperty()
    @IsEmail()
    @IsOptional()
    email: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional() // Defaults to true
    active: boolean;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    type: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    description: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    minutes_from_bh: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    cep: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    address_street_and_numbers: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    neighborhood: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    lot_min_price: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    lot_avg_price: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    city: string;
    
    @ApiProperty()
    @IsString()
    @IsOptional()
    state: string;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    highlight: boolean;
    
    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_lobby_24h: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_sports_court: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_barbecue_zone: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_pool: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_living_space: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_lagoon: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_eletricity: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_water: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_sidewalks: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    infra_broadband: boolean;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    imediate_delivery: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    url: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    phone: string;
}
