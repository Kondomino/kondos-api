import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { KondoDetailsType } from './kondo.details.abstract.entity';
import { KondoAddressType } from './kondo.address.abstract.entity';
import { Expose } from 'class-transformer';
import { KondoConveniencesType, basic_conveniences, conveniences_conveniences, extra_conveniences, security_conveniences } from './kondo.conveniences.abstract.entity';

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
    
    /*
    constructor(partial?: Partial<Kondo>) {
        super();
        
        if (partial)
            Object.assign(this, partial);
      }
    */
     
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
    @Expose()
    entry_value_percentage: string; // Valor inicial de entrada minimo?
    
    /**
     * CONVENIENCES
     */
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
    /**
     * END OF CONVENIENECS
     */

    /**
     * NEW CONVENIENCES TO MAP
     */
    // market_nearby
    // gym
    // home_office
    // lounge_bar
    // party_saloon

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

    // @Column({
    //     allowNull: true,
    // })
    // createdAt: Date;
    
    // @Column({
    //     allowNull: true,
    // })
    // updatedAt: Date;

    
    @Expose()
    get details(): KondoDetailsType {
        return this.getDetails();
    }

    @Expose()
    get conveniences(): unknown[] {
        return this.getConveniences();
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
            immediate_delivery: this.immediate_delivery,
            infra_description: this.infra_description,
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
    
    getConveniences(): KondoConveniencesType[] {
        const conveniences: KondoConveniencesType[] = [{
                "type": "basic",
                "conveniences": []
            },
            {
                "type": "security",
                "conveniences": []
            },
            {
                "type": "convenience",
                "conveniences": []
            },
            {
                "type": "extra",
                "conveniences": []
            }];

            return conveniences.map(item => {
                if (item.type == 'basic')
                    item.conveniences = this.getConveniencesOfType(basic_conveniences);
                if (item.type == 'extra')
                    item.conveniences = this.getConveniencesOfType(extra_conveniences);
                if (item.type == 'security')
                    item.conveniences = this.getConveniencesOfType(security_conveniences);
                if (item.type == 'convenience')
                    item.conveniences = this.getConveniencesOfType(conveniences_conveniences);
                return item;
            })
    }

    getConveniencesOfType(conveniences_of_a_type): string[] {

        const conveniences = [];
        for (let i=0; i<= conveniences_of_a_type.length; i++) {
            const convenience = conveniences_of_a_type[i];
            if (this[convenience])
                conveniences.push(convenience)
        }
        return conveniences;
    }
}
