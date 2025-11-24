import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsIn } from "class-validator";
import { UnitStatus, UnitTypes, ConditionTypes, ConservationStatus } from "../entities/unit.entity";

export class CreateUnitDto {
    @IsString()
    title: string;

    @IsNumber()
    kondoId: number;

    @IsNumber()
    userId: number;

    @IsString()
    @IsIn(Object.values(UnitTypes))
    unit_type: string;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(UnitStatus))
    status?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;

    // Price-related fields
    @IsOptional()
    @IsNumber()
    price?: number;

    @IsOptional()
    @IsNumber()
    iptu?: number;

    // Location and address
    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    neighborhood?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    zip_code?: string;

    // Property characteristics
    @IsOptional()
    @IsNumber()
    bedrooms?: number;

    @IsOptional()
    @IsNumber()
    baths?: number;

    @IsOptional()
    @IsNumber()
    suites?: number;

    @IsOptional()
    @IsNumber()
    parking_spaces?: number;

    @IsOptional()
    @IsNumber()
    total_rooms?: number;

    @IsOptional()
    @IsNumber()
    living_rooms?: number;

    @IsOptional()
    @IsNumber()
    dining_rooms?: number;

    @IsOptional()
    @IsNumber()
    kitchens?: number;

    @IsOptional()
    @IsNumber()
    service_areas?: number;

    @IsOptional()
    @IsNumber()
    balconies?: number;

    @IsOptional()
    @IsBoolean()
    is_roof?: boolean;

    @IsOptional()
    @IsBoolean()
    garden?: boolean;

    @IsOptional()
    @IsBoolean()
    pool?: boolean;

    @IsOptional()
    @IsBoolean()
    barbecue?: boolean;

    @IsOptional()
    @IsString()
    value?: string; // Legacy field

    @IsOptional()
    @IsBoolean()
    furnished?: boolean;

    @IsOptional()
    @IsBoolean()
    closet?: boolean;

    @IsOptional()
    @IsNumber()
    area?: number;

    @IsOptional()
    @IsString()
    lot_size?: string;

    @IsOptional()
    @IsNumber()
    floor?: number;

    @IsOptional()
    @IsString()
    building?: string;

    // Construction and condition
    @IsOptional()
    @IsNumber()
    construction_year?: number;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(ConditionTypes))
    condition?: string;

    @IsOptional()
    @IsString()
    @IsIn(Object.values(ConservationStatus))
    conservation_status?: string;

    // Additional features
    @IsOptional()
    @IsBoolean()
    air_conditioning?: boolean;

    @IsOptional()
    @IsBoolean()
    heating?: boolean;

    @IsOptional()
    @IsBoolean()
    elevator?: boolean;

    @IsOptional()
    @IsBoolean()
    security_system?: boolean;

    @IsOptional()
    @IsBoolean()
    internet?: boolean;

    @IsOptional()
    @IsBoolean()
    cable_tv?: boolean;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    features?: string[];

    // Media and documentation
    @IsOptional()
    @IsArray()
    images?: string[];

    @IsOptional()
    @IsString()
    video_url?: string;

    @IsOptional()
    @IsString()
    virtual_tour_url?: string;

    @IsOptional()
    @IsString()
    blueprint_url?: string;

    @IsOptional()
    @IsArray()
    documents?: string[];

    // Contact information
    @IsOptional()
    @IsString()
    contact_phone?: string;

    @IsOptional()
    @IsString()
    contact_email?: string;

    // Listing metadata
    @IsOptional()
    @IsString()
    listing_id?: string;

    @IsOptional()
    @IsString()
    source_url?: string;
}
