"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KondoModule = void 0;
const common_1 = require("@nestjs/common");
const kondo_service_1 = require("./kondo.service");
const kondo_controller_1 = require("./kondo.controller");
const sequelize_1 = require("@nestjs/sequelize");
const Kondo_entity_1 = require("./entities/Kondo.entity");
const kondo_provider_1 = require("./repository/kondo.provider");
const kondo_repository_1 = require("./repository/kondo.repository");
const slugify_module_1 = require("../utils/slugify/slugify.module");
let KondoModule = class KondoModule {
};
KondoModule = __decorate([
    (0, common_1.Module)({
        controllers: [kondo_controller_1.KondoController],
        providers: [kondo_service_1.KondoService, ...kondo_provider_1.kondoProviders, kondo_repository_1.KondoRepository],
        imports: [sequelize_1.SequelizeModule.forFeature([Kondo_entity_1.Kondo]), slugify_module_1.SlugifyModule]
    })
], KondoModule);
exports.KondoModule = KondoModule;
