import { DataTypes } from 'sequelize';
import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
        allowNull: true,
    })
    cep: string;

    @Column({
        allowNull: true,
    })
    address: string;

    @Column({
        allowNull: true,
    })
    neighborhood: string; // Bairro

    @Column({
        allowNull: true,
    })
    city: string;
    
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
}