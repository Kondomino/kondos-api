import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

export class CreateKondoDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    slug: string;

    @IsEmail()
    @IsOptional()
    email: string;

    @IsBoolean()
    @IsOptional() // Defaults to true
    active: boolean;
    
    @IsString()
    @IsOptional()
    type: string;
    
    @IsString()
    @IsOptional()
    lot_min_price: string;
    
    @IsString()
    @IsOptional()
    lot_avg_price: string;
    
    @IsString()
    @IsOptional()
    cep: string;
    
    @IsString()
    @IsOptional()
    address: string;
    
    @IsString()
    @IsOptional()
    neighborhood: string;
    
    @IsString()
    @IsOptional()
    city: string;
    
    @IsString()
    @IsOptional()
    state: string;
    
    @IsBoolean()
    @IsOptional()
    infra_lobby_24h: boolean;

    @IsBoolean()
    @IsOptional()
    infra_sports_court: boolean;

    @IsBoolean()
    @IsOptional()
    infra_barbecue_zone: boolean;

    @IsBoolean()
    @IsOptional()
    infra_pool: boolean;

    @IsBoolean()
    @IsOptional()
    infra_living_space: boolean;

    @IsBoolean()
    @IsOptional()
    infra_lagoon: boolean;

    @IsBoolean()
    @IsOptional()
    infra_eletricity: boolean;

    @IsBoolean()
    @IsOptional()
    infra_water: boolean;

    @IsBoolean()
    @IsOptional()
    infra_sidewalks: boolean;

    @IsBoolean()
    @IsOptional()
    infra_broadband: boolean;

    @IsBoolean()
    @IsOptional()
    imediate_delivery: boolean;

    @IsString()
    @IsOptional()
    url: string;

    @IsString()
    @IsOptional()
    phone: string;
}
