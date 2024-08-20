import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { KondoAddressType } from './kondo.address.abstract.entity';
import { Expose } from 'class-transformer';
import { KondoConveniencesType, basic_conveniences, conveniences_conveniences, extra_conveniences, security_conveniences } from './kondo.conveniences.abstract.entity';
import { Media } from '../../media/entities/media.entity';
import { Like } from '../../like/entities/like.entity';

export const KondoTypes = Object.freeze({
    Bairro: 'bairro',
    Casas: 'casas',
    Chacaras: 'chacatas',
    Predios: 'predios',
    Comercial: 'comercial',
    Industrial: 'industrial'
  });

export const KondoStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    DONE: 'done',
  });

module.exports.KondoTypes = KondoTypes;
@Table
export class Kondo extends Model {
    
    constructor(partial?: Partial<Kondo>) {
      super();
        
      if (partial)
        Object.assign(this, partial);
    }
     
    @Column({
        //type: DataType.STRING,
        allowNull: false,
    })
    name: string;
    
    @Column({
        defaultValue: true
    })
    active: boolean;

    @Column({
        values: Object.values(KondoStatus),
        defaultValue: KondoStatus.DRAFT
    })
    status: string;

    @Column({
        defaultValue: false
    })
    highlight: boolean;

    @Column({
        unique: true
    })
    slug: string;

    @Column({
        unique: false
    })
    featured_image: string;

    @Column({
        values: Object.values(KondoTypes),
        defaultValue: 'casas',
    })
    type: string;
    
    @Column({
        allowNull: true,
        type: DataType.TEXT
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

    @Column({
        allowNull: true,
    })
    infra_gourmet_area: boolean; // Area Gourmet

    @Column({
        allowNull: true,
    })
    infra_parking_lot: boolean; // Estacionamento

    @Column({
        allowNull: true,
    })
    infra_heliport: boolean; // Heliporto

    @Column({
        allowNull: true,
    })
    infra_gym: boolean; // Academia

    @Column({
        allowNull: true,
    })
    infra_gardens: boolean; // Jardins

    @Column({
        allowNull: true,
    })
    infra_interactive_lobby: boolean; // Portaria interativa?

    @Column({
        allowNull: true,
    })
    infra_home_office: boolean; // Escritório?

    @Column({
        allowNull: true,
    })
    infra_lounge_bar: boolean; // Lounge bar

    @Column({
        allowNull: true,
    })
    infra_party_saloon: boolean; // Salão de festas

    @Column({
        allowNull: true,
    })
    infra_market_nearby: boolean; // Mercado proximo
    /**
     * END OF CONVENIENECS
     */
    
    @Column({
        allowNull: true,
    })
    total_area: string; // Area total do empreendimento

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

    @HasMany(() => Media)
    medias: Media[];

    @HasMany(() => Like)
    likes: Like[];

    allConveniences: boolean = false;

    @Expose()
    get details() {
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

    getDetails() {
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
    
    getAllConveniences() {
        this.allConveniences = true;

        return this.getConveniences();
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
        for (let i=0; i< conveniences_of_a_type.length; i++) {
            const convenience = conveniences_of_a_type[i];

            // Will only add to the list, if it's getting All, or if the Kondo has it
            if (this.allConveniences) {
                conveniences.push(convenience);
            }
            else if (this[convenience])
                conveniences.push(convenience)
        }
        return conveniences;
    }
}