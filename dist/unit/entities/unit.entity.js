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
exports.Unit = exports.ConservationStatus = exports.ConditionTypes = exports.UnitTypes = exports.UnitStatus = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const kondo_entity_1 = require("../../kondo/entities/kondo.entity");
const user_entity_1 = require("../../user/entities/user.entity");
exports.UnitStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    PUBLISHED: 'published',
});
exports.UnitTypes = Object.freeze({
    APARTMENT: 'apartment',
    HOUSE: 'house',
    LOT: 'lot',
});
exports.ConditionTypes = Object.freeze({
    NEW: 'new',
    USED: 'used',
    UNDER_CONSTRUCTION: 'under_construction',
});
exports.ConservationStatus = Object.freeze({
    EXCELLENT: 'excellent',
    GOOD: 'good',
    REGULAR: 'regular',
    POOR: 'poor',
});
let Unit = class Unit extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: false,
    }),
    __metadata("design:type", String)
], Unit.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => kondo_entity_1.Kondo),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Unit.prototype, "kondoId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => kondo_entity_1.Kondo),
    __metadata("design:type", kondo_entity_1.Kondo)
], Unit.prototype, "kondo", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Unit.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Unit.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: true
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "active", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(exports.UnitStatus),
        defaultValue: exports.UnitStatus.DRAFT
    }),
    __metadata("design:type", String)
], Unit.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(12, 2)
    }),
    __metadata("design:type", Number)
], Unit.prototype, "price", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2)
    }),
    __metadata("design:type", Number)
], Unit.prototype, "iptu", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "address", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "neighborhood", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "city", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "state", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "zip_code", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "bedrooms", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "baths", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "suites", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "parking_spaces", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "total_rooms", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "living_rooms", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "dining_rooms", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "kitchens", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "service_areas", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "balconies", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "is_roof", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "garden", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "pool", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "barbecue", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "value", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "furnished", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "closet", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(exports.UnitTypes),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Unit.prototype, "unit_type", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.DECIMAL(10, 2)
    }),
    __metadata("design:type", Number)
], Unit.prototype, "area", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "lot_size", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Unit.prototype, "floor", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "building", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Unit.prototype, "construction_year", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(exports.ConditionTypes),
        defaultValue: exports.ConditionTypes.USED
    }),
    __metadata("design:type", String)
], Unit.prototype, "condition", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(exports.ConservationStatus),
        defaultValue: exports.ConservationStatus.GOOD
    }),
    __metadata("design:type", String)
], Unit.prototype, "conservation_status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "air_conditioning", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "heating", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "elevator", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "security_system", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "internet", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "cable_tv", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.TEXT
    }),
    __metadata("design:type", String)
], Unit.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.JSON
    }),
    __metadata("design:type", Array)
], Unit.prototype, "features", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.JSON
    }),
    __metadata("design:type", Array)
], Unit.prototype, "images", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "video_url", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "virtual_tour_url", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "blueprint_url", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
        type: sequelize_typescript_1.DataType.JSON
    }),
    __metadata("design:type", Array)
], Unit.prototype, "documents", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "contact_phone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "contact_email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "listing_id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        allowNull: true,
    }),
    __metadata("design:type", String)
], Unit.prototype, "source_url", void 0);
Unit = __decorate([
    sequelize_typescript_1.Table
], Unit);
exports.Unit = Unit;
