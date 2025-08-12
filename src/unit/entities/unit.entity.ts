import { BelongsTo, Column, ForeignKey, Model, Table, DataType } from "sequelize-typescript";
import { Kondo } from "../../kondo/entities/kondo.entity";
import { User } from "../../user/entities/user.entity";

export const UnitStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    PUBLISHED: 'published',
});

export const UnitTypes = Object.freeze({
    APARTMENT: 'apartment',
    HOUSE: 'house',
    LOT: 'lot',
});

export const ConditionTypes = Object.freeze({
    NEW: 'new',
    USED: 'used',
    UNDER_CONSTRUCTION: 'under_construction',
});

export const ConservationStatus = Object.freeze({
    EXCELLENT: 'excellent',
    GOOD: 'good',
    REGULAR: 'regular',
    POOR: 'poor',
});

@Table
export class Unit extends Model {

    @Column({
        allowNull: false,
    })
    title: string;

    @ForeignKey(() => Kondo)
    @Column
    kondoId: number;
    
    @BelongsTo(() => Kondo)
    kondo: Kondo;
    
    @ForeignKey(() => User)
    @Column
    userId: number;
    
    @BelongsTo(() => User)
    user: User; // agent
    
    @Column({
        defaultValue: true
    })
    active: boolean;

    @Column({
        values: Object.values(UnitStatus),
        defaultValue: UnitStatus.DRAFT
    })
    status: string;

    // Price-related fields
    @Column({
        allowNull: true,
        type: DataType.DECIMAL(12, 2)
    })
    price: number;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(10, 2)
    })
    iptu: number;

    // Location and address
    @Column({
        allowNull: true,
    })
    address: string;

    @Column({
        allowNull: true,
    })
    neighborhood: string;

    @Column({
        allowNull: true,
    })
    city: string;

    @Column({
        allowNull: true,
    })
    state: string;

    @Column({
        allowNull: true,
    })
    zip_code: string;

    // Property characteristics
    @Column({
        defaultValue: 0
    })
    bedrooms: number;

    @Column({
        defaultValue: 0
    })
    baths: number;

    @Column({
        defaultValue: 0
    })
    suites: number;

    @Column({
        defaultValue: 0
    })
    parking_spaces: number;

    @Column({
        defaultValue: 0
    })
    total_rooms: number;

    @Column({
        defaultValue: 0
    })
    living_rooms: number;

    @Column({
        defaultValue: 0
    })
    dining_rooms: number;

    @Column({
        defaultValue: 0
    })
    kitchens: number;

    @Column({
        defaultValue: 0
    })
    service_areas: number;

    @Column({
        defaultValue: 0
    })
    balconies: number;

    @Column({
        defaultValue: false
    })
    is_roof: boolean; // Cobertura?

    @Column({
        defaultValue: false
    })
    garden: boolean;

    @Column({
        defaultValue: false
    })
    pool: boolean;

    @Column({
        defaultValue: false
    })
    barbecue: boolean;

    @Column({
        allowNull: true,
    })
    value: string; // Legacy field - consider removing

    @Column({
        defaultValue: false
    })
    furnished: boolean;

    @Column({
        defaultValue: false
    })
    closet: boolean;

    @Column({
        values: Object.values(UnitTypes),
        allowNull: false,
    })
    unit_type: string;

    @Column({
        allowNull: true,
        type: DataType.DECIMAL(10, 2)
    })
    area: number;

    @Column({
        allowNull: true,
    })
    lot_size: string;

    @Column({
        allowNull: true,
    })
    floor: number;

    @Column({
        allowNull: true,
    })
    building: string;

    // Construction and condition
    @Column({
        allowNull: true,
    })
    construction_year: number;

    @Column({
        values: Object.values(ConditionTypes),
        defaultValue: ConditionTypes.USED
    })
    condition: string;

    @Column({
        values: Object.values(ConservationStatus),
        defaultValue: ConservationStatus.GOOD
    })
    conservation_status: string;

    // Additional features
    @Column({
        defaultValue: false
    })
    air_conditioning: boolean;

    @Column({
        defaultValue: false
    })
    heating: boolean;

    @Column({
        defaultValue: false
    })
    elevator: boolean;

    @Column({
        defaultValue: false
    })
    security_system: boolean;

    @Column({
        defaultValue: false
    })
    internet: boolean;

    @Column({
        defaultValue: false
    })
    cable_tv: boolean;

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    description: string;

    @Column({
        allowNull: true,
        type: DataType.JSON
    })
    features: string[];

    // Media and documentation
    @Column({
        allowNull: true,
        type: DataType.JSON
    })
    images: string[];

    @Column({
        allowNull: true,
    })
    video_url: string;

    @Column({
        allowNull: true,
    })
    virtual_tour_url: string;

    @Column({
        allowNull: true,
    })
    blueprint_url: string;

    @Column({
        allowNull: true,
        type: DataType.JSON
    })
    documents: string[];

    // Contact information
    @Column({
        allowNull: true,
    })
    contact_phone: string;

    @Column({
        allowNull: true,
    })
    contact_email: string;

    // Listing metadata
    @Column({
        allowNull: true,
    })
    listing_id: string; // External listing ID from source

    @Column({
        allowNull: true,
    })
    source_url: string; // Original listing URL
}
