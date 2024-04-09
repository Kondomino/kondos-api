import { Table, Column, Model, DataType } from 'sequelize-typescript';

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
        type: DataType.ENUM,
        values: ['bairro', 'casas', 'chacaras', 'predios', 'comercial', 'industrial'],
        allowNull: true,
    })
    type: string;

    @Column({
        allowNull: true,
    })
    lot_min_price: string;

    @Column({
        allowNull: true,
    })
    lot_avg_price: string;

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
        allowNull: true,
    })
    state: string;

    @Column({
        allowNull: true,
    })
    infra_lobby_24h: boolean; // Portaria 24h

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
    infra_broadband: boolean; // Banda larga

    @Column({
        allowNull: true,
    })
    imediate_delivery: boolean; // Entrega imediata do lote

    @Column({
        allowNull: true,
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
}