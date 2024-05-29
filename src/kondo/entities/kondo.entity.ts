import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { KondoDetailsType } from './kondo.details.abstract.entity';
import { KondoAddressType } from './kondo.address.abstract.entity';
import { Expose } from 'class-transformer';

const KondoTypes = Object.freeze({
    Bairro: 'bairro',
    Casas: 'casas',
    Chacaras: 'chacatas',
    Predios: 'predios',
    Comercial: 'comercial',
    Industrial: 'industrial'
  });

module.exports.KondoTypes = KondoTypes;
@Table
export class Kondo extends Model<Kondo> {
    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;
    
    @Column({
        defaultValue: true
    })
    active: boolean;

    @Column({
        unique: true
    })
    slug: string;

    @Column({
        values: Object.values(KondoTypes),
        defaultValue: 'casas',
    })
    type: string;
    
    @Column({
        allowNull: true,
    })
    description: string;


    /**
     * KONDO ADDRESS
     */
    @Column({
        allowNull: true
    })
    minutes_from_bh: string;

    @Column({
        allowNull: true,
    })
    cep: string;

    @Column({
        allowNull: true,
    })
    address_street_and_numbers: string;

    @Column({
        allowNull: true,
    })
    neighborhood: string; // Bairro

    @Column({
        allowNull: true,
    })
    city: string;
    /**
     * END OF KONDO ADDRESS
     */

    /**
     * KONDO DETAILS
     */
    @Column({
        allowNull: true,
    })
    lot_avg_price: string;

    @Column({
        allowNull: true,
    })
    condo_rent: string;

    @Column({
        defaultValue: false
    })
    lots_available: boolean;

    @Column({
        defaultValue: false
    })
    lots_min_size: string;

    @Column({
        defaultValue: false
    })
    finance: boolean; // Financiamento?
    
    @Column({
        allowNull: true,
    })
    finance_tranches: string; // Financiamento parcelas
    
    @Column({
        defaultValue: false
    })
    finance_fees: boolean; // Parcelamento com juros? 

    @Column({
        allowNull: true,
    })
    entry_value_percentage: string; // Valor inicial de entrada minimo?
    
    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    infra_description: string; // Descrição da Infraestrutura

    @Column({
        allowNull: true,
    })
    infra_lobby_24h: boolean; // Portaria 24h

    @Column({
        allowNull: true,
    })
    infra_security_team: boolean; // Equipe de segurança?
    
    @Column({
        allowNull: true,
    })
    infra_wall: boolean; // Muro de segurança?

    @Column({
        allowNull: true,
    })
    infra_sports_court: boolean; // Quadra de esportes

    @Column({
        allowNull: true,
    })
    infra_barbecue_zone: boolean; // Churrasqueira

    @Column({
        allowNull: true,
    })
    infra_pool: boolean;

    @Column({
        allowNull: true,
    })
    infra_living_space: boolean; // Espaço de Convivencia

    @Column({
        allowNull: true,
    })
    infra_pet_area: boolean; // Espaço Pet
    
    @Column({
        allowNull: true,
    })
    infra_kids_area: boolean; // Espaço Kids

    @Column({
        allowNull: true,
    })
    infra_lagoon: boolean; // Lagoa

    @Column({
        allowNull: true,
    })
    infra_eletricity: boolean;

    @Column({
        allowNull: true,
    })
    infra_water: boolean;

    @Column({
        allowNull: true,
    })
    infra_sidewalks: boolean; // Calçadas

    @Column({
        allowNull: true,
    })
    infra_internet: boolean; // Banda larga
    
    @Column({
        allowNull: true,
    })
    infra_generates_power: boolean; // Gera sua propria energia?
    
    @Column({
        allowNull: true,
    })
    infra_grass_area: boolean; // Area gramada
        
    @Column({
        allowNull: true,
    })
    infra_woods: boolean; // Bosque

    @Column({
        allowNull: true,
    })
    infra_vegetable_garden: boolean; // Horta

    @Column({
        allowNull: true,
    })
    infra_nature_trail: boolean; // Trilha

    @Column({
        allowNull: true,
    })
    immediate_delivery: boolean; // Entrega imediata do lote
    /**
     * END OF KONDO DETAILS
     */

    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    url: string; // Condominium Page

    @Column({
        allowNull: true,
    })
    phone: string;

    @Column({
        allowNull: true,
    })
    email: string;
    
    @Column({
        allowNull: true,
        type: DataType.TEXT
    })
    video: string;

    @Column({
        allowNull: true,
    })
    createdAt: Date;
    
    @Column({
        allowNull: true,
    })
    updatedAt: Date;

    @Expose()
    get details(): KondoDetailsType {
        return this.getDetails();
    }

    @Expose()
    get address(): KondoAddressType {
        return this.getAddress();
    }

    getDetails(): KondoDetailsType {
        return {
            lot_avg_price: this.lot_avg_price,
            condo_rent: this.condo_rent,
            lots_available: this.lots_available,
            lots_min_size: this.lots_min_size,
            finance: this.finance,
            finance_tranches: this.finance_tranches,
            finance_fees: this.finance_fees,
            entry_value_percentage: this.entry_value_percentage,
            infra_description: this.infra_description,
            infra_lobby_24h: this.infra_lobby_24h,
            infra_security_team: this.infra_security_team,
            infra_wall: this.infra_wall,
            infra_sports_court: this.infra_sports_court,
            infra_barbecue_zone: this.infra_barbecue_zone,
            infra_pool: this.infra_pool,
            infra_living_space: this.infra_living_space,
            infra_pet_area: this.infra_pet_area,
            infra_kids_area: this.infra_kids_area,
            infra_lagoon: this.infra_lagoon,
            infra_eletricity: this.infra_eletricity,
            infra_water: this.infra_water,
            infra_sidewalks: this.infra_sidewalks,
            infra_internet: this.infra_internet,
            infra_generates_power: this.infra_generates_power,
            infra_grass_area: this.infra_grass_area,
            infra_woods: this.infra_woods,
            infra_vegetable_garden: this.infra_vegetable_garden,
            infra_nature_trail: this.infra_nature_trail,
            immediate_delivery: this.immediate_delivery
        }
    }

    getAddress(): KondoAddressType {
        return {
            minutes_from_bh: this.minutes_from_bh,
            cep: this.cep,
            address_street_and_numbers: this.address_street_and_numbers,
            neighborhood: this.neighborhood,
            city: this.city,
        }
    }
}
