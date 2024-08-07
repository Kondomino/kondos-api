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
exports.Like = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const kondo_entity_1 = require("../../kondo/entities/kondo.entity");
const unit_entity_1 = require("../../unit/entities/unit.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let Like = class Like extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => user_entity_1.User),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Like.prototype, "userId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => user_entity_1.User),
    __metadata("design:type", user_entity_1.User)
], Like.prototype, "user", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => kondo_entity_1.Kondo),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Like.prototype, "kondoId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => kondo_entity_1.Kondo),
    __metadata("design:type", kondo_entity_1.Kondo)
], Like.prototype, "kondo", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => unit_entity_1.Unit),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Like.prototype, "unitId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => unit_entity_1.Unit),
    __metadata("design:type", unit_entity_1.Unit)
], Like.prototype, "unit", void 0);
Like = __decorate([
    sequelize_typescript_1.Table
], Like);
exports.Like = Like;
