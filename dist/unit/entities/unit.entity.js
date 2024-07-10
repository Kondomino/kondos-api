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
exports.Unit = exports.UnitStatus = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const kondo_entity_1 = require("../../kondo/entities/kondo.entity");
const user_entity_1 = require("../../user/entities/user.entity");
exports.UnitStatus = Object.freeze({
    DRAFT: 'draft',
    TEXT_READY: 'text_ready',
    MEDIA_GATHERING: 'media_gathering',
    PUBLISHED: 'published',
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
        defaultValue: 0
    }),
    __metadata("design:type", Number)
], Unit.prototype, "bedroms", void 0);
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
        defaultValue: false
    }),
    __metadata("design:type", Boolean)
], Unit.prototype, "is_roof", void 0);
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
Unit = __decorate([
    sequelize_typescript_1.Table
], Unit);
exports.Unit = Unit;
