import { CreateKondoDto } from './create-kondo.dto';
declare const UpdateKondoDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateKondoDto>>;
export declare class UpdateKondoDto extends UpdateKondoDto_base {
    readonly name: string;
    readonly email: string;
    readonly active: boolean;
    readonly type: string;
    readonly lot_min_price: string;
    readonly lot_avg_price: string;
    readonly cep: string;
    readonly address_street_and_number: string;
    readonly neighborhood: string;
    readonly city: string;
    readonly state: string;
    readonly infra_lobby_24h: boolean;
    readonly infra_sports_court: boolean;
    readonly infra_barbecue_zone: boolean;
    readonly infra_pool: boolean;
    readonly infra_living_space: boolean;
    readonly infra_lagoon: boolean;
    readonly infra_eletricity: boolean;
    readonly infra_water: boolean;
    readonly infra_sidewalks: boolean;
    readonly infra_broadband: boolean;
    readonly imediate_delivery: boolean;
    readonly url: string;
    readonly phone: string;
}
export {};
