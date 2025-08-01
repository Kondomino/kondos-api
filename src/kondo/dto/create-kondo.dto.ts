import { IsBoolean, IsEmail, IsOptional, IsString, IsIn, IsNumber } from "class-validator";
import { KondoTypes, KondoStatus } from '../entities/kondo.entity';

export class CreateKondoDto {
    // Basic Information
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
    @IsIn(Object.values(KondoStatus))
    status: string;

    @IsBoolean()
    @IsOptional()
    highlight: boolean;

    @IsString()
    @IsOptional()
    featured_image: string;
    
    @IsString()
    @IsOptional()
    @IsIn(Object.values(KondoTypes))
    type: string;

    @IsString()
    @IsOptional()
    description: string;

    // Address Information
    @IsString()
    @IsOptional()
    minutes_from_bh: string;
    
    @IsString()
    @IsOptional()
    cep: string;
    
    @IsString()
    @IsOptional()
    address_street_and_numbers: string;
    
    @IsString()
    @IsOptional()
    neighborhood: string;

    @IsString()
    @IsOptional()
    city: string;

    // Financial Details
    @IsNumber()
    @IsOptional()
    lot_avg_price: number;

    @IsNumber()
    @IsOptional()
    condo_rent: number;

    @IsBoolean()
    @IsOptional()
    lots_available: boolean;

    @IsString()
    @IsOptional()
    lots_min_size: string;

    @IsBoolean()
    @IsOptional()
    finance: boolean;

    @IsString()
    @IsOptional()
    finance_tranches: string;

    @IsBoolean()
    @IsOptional()
    finance_fees: boolean;

    @IsString()
    @IsOptional()
    entry_value_percentage: string;

    @IsString()
    @IsOptional()
    total_area: string;

    @IsBoolean()
    @IsOptional()
    immediate_delivery: boolean;

    // Infrastructure Description
    @IsString()
    @IsOptional()
    infra_description: string;

    // Basic Infrastructure
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
    infra_internet: boolean;

    // Security Infrastructure
    @IsBoolean()
    @IsOptional()
    infra_lobby_24h: boolean;

    @IsBoolean()
    @IsOptional()
    infra_security_team: boolean;

    @IsBoolean()
    @IsOptional()
    infra_wall: boolean;

    // Convenience Infrastructure
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
    infra_pet_area: boolean;

    @IsBoolean()
    @IsOptional()
    infra_kids_area: boolean;

    @IsBoolean()
    @IsOptional()
    infra_grass_area: boolean;

    @IsBoolean()
    @IsOptional()
    infra_gourmet_area: boolean;

    @IsBoolean()
    @IsOptional()
    infra_parking_lot: boolean;

    @IsBoolean()
    @IsOptional()
    infra_market_nearby: boolean;

    @IsBoolean()
    @IsOptional()
    infra_party_saloon: boolean;

    @IsBoolean()
    @IsOptional()
    infra_lounge_bar: boolean;

    @IsBoolean()
    @IsOptional()
    infra_home_office: boolean;

    // Extra Infrastructure
    @IsBoolean()
    @IsOptional()
    infra_lagoon: boolean;

    @IsBoolean()
    @IsOptional()
    infra_generates_power: boolean;

    @IsBoolean()
    @IsOptional()
    infra_woods: boolean;

    @IsBoolean()
    @IsOptional()
    infra_vegetable_garden: boolean;

    @IsBoolean()
    @IsOptional()
    infra_nature_trail: boolean;

    @IsBoolean()
    @IsOptional()
    infra_gardens: boolean;

    @IsBoolean()
    @IsOptional()
    infra_heliport: boolean;

    @IsBoolean()
    @IsOptional()
    infra_gym: boolean;

    @IsBoolean()
    @IsOptional()
    infra_interactive_lobby: boolean;

    // Contact Information
    @IsString()
    @IsOptional()
    url: string;

    @IsString()
    @IsOptional()
    phone: string;

    @IsString()
    @IsOptional()
    video: string;
}
