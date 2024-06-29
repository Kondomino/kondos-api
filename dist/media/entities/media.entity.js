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
exports.Media = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const kondo_entity_1 = require("../../kondo/entities/kondo.entity");
const MediaTypes = Object.freeze({
    Video: 'video',
    Image: 'image',
});
module.exports.MediaTypes = MediaTypes;
let Media = class Media extends sequelize_typescript_1.Model {
};
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: false,
    }),
    __metadata("design:type", String)
], Media.prototype, "filename", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        values: Object.values(MediaTypes),
        defaultValue: 'image',
    }),
    __metadata("design:type", String)
], Media.prototype, "type", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => kondo_entity_1.Kondo),
    sequelize_typescript_1.Column,
    __metadata("design:type", Number)
], Media.prototype, "kondoId", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => kondo_entity_1.Kondo),
    __metadata("design:type", kondo_entity_1.Kondo)
], Media.prototype, "kondo", void 0);
Media = __decorate([
    sequelize_typescript_1.Table
], Media);
exports.Media = Media;
//Media.belongsTo(Kondo);
