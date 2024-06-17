"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kondo = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const class_transformer_1 = require("class-transformer");
const kondo_conveniences_abstract_entity_1 = require("./kondo.conveniences.abstract.entity");
const KondoTypes = Object.freeze({
    Bairro: 'bairro',
    Casas: 'casas',
    Chacaras: 'chacatas',
    Predios: 'predios',
    Comercial: 'comercial',
    Industrial: 'industrial'
});
const KondoStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    DONE: 'done',
});
module.exports.KondoTypes = KondoTypes;
let Kondo = class Kondo extends sequelize_typescript_1.Model {
    // @Column({
    //     allowNull: true,
    // })
    // createdAt: Date;
    // @Column({
    //     allowNull: true,
    // })
    // updatedAt: Date;
    get details() {
        return this.getDetails();
    }
    get conveniences() {
        return this.getConveniences();
    }
    get address() {
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
        };
    }
    getAddress() {
        return {
            minutes_from_bh: this.minutes_from_bh,
            cep: this.cep,
            address_street_and_numbers: this.address_street_and_numbers,
            neighborhood: this.neighborhood,
            city: this.city,
        };
    }
    getConveniences() {
        const conveniences = [{
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
                item.conveniences = this.getConveniencesOfType(kondo_conveniences_abstract_entity_1.basic_conveniences);
            if (item.type == 'extra')
                item.conveniences = this.getConveniencesOfType(kondo_conveniences_abstract_entity_1.extra_conveniences);
            if (item.type == 'security')
                item.conveniences = this.getConveniencesOfType(kondo_conveniences_abstract_entity_1.security_conveniences);
            if (item.type == 'convenience')
                item.conveniences = this.getConveniencesOfType(kondo_conveniences_abstract_entity_1.conveniences_conveniences);
            return item;
        });
    }
    getConveniencesOfType(conveniences_of_a_type) {
        const conveniences = [];
        for (let i = 0; i <= conveniences_of_a_type.length; i++) {
            const convenience = conveniences_of_a_type[i];
            if (this[convenience])
                conveniences.push(convenience);
        }
        return conveniences;
    }
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "active", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(KondoStatus),
        defaultValue: true
    }),
    __metadata("design:type", String)
], Kondo.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "highlight", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        unique: true
    }),
    __metadata("design:type", String)
], Kondo.prototype, "slug", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(KondoTypes),
        defaultValue: 'casas',
    }),
    __metadata("design:type", String)
], Kondo.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Kondo.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true
    }),
    __metadata("design:type", String)
], Kondo.prototype, "minutes_from_bh", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "cep", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "address_street_and_numbers", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "neighborhood", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "city", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "lot_avg_price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "condo_rent", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "lots_available", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", String)
], Kondo.prototype, "lots_min_size", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "finance", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "finance_tranches", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "finance_fees", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Kondo.prototype, "entry_value_percentage", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Kondo.prototype, "infra_description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_lobby_24h", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_security_team", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_wall", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_sports_court", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_barbecue_zone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_pool", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_living_space", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_pet_area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_kids_area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_lagoon", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_eletricity", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_water", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_sidewalks", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_internet", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_generates_power", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_grass_area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_woods", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_vegetable_garden", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_nature_trail", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_gourmet_area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_parking_lot", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_heliport", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_gym", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_gardens", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_interactive_lobby", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_home_office", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_lounge_bar", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_party_saloon", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "infra_market_nearby", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "total_area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Boolean)
], Kondo.prototype, "immediate_delivery", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Kondo.prototype, "url", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "phone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Kondo.prototype, "email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Kondo.prototype, "video", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], Kondo.prototype, "details", null);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array),
    __metadata("design:paramtypes", [])
], Kondo.prototype, "conveniences", null);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], Kondo.prototype, "address", null);
Kondo = __decorate([
    sequelize_typescript_1.Table
], Kondo);
exports.Kondo = Kondo;
