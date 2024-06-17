"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegratorModule = void 0;
const common_1 = require("@nestjs/common");
const integrator_service_1 = require("./integrator.service");
const integrator_controller_1 = require("./integrator.controller");
const kondo_provider_1 = require("../kondo/repository/kondo.provider");
const kondo_repository_1 = require("../kondo/repository/kondo.repository");
const slugify_module_1 = require("../utils/slugify/slugify.module");
let IntegratorModule = class IntegratorModule {
};
IntegratorModule = __decorate([
    (0, common_1.Module)({
        controllers: [integrator_controller_1.IntegratorController],
        providers: [integrator_service_1.IntegratorService, ...kondo_provider_1.kondoProviders, kondo_repository_1.KondoRepository],
        imports: [slugify_module_1.SlugifyModule]
    })
], IntegratorModule);
exports.IntegratorModule = IntegratorModule;
//# sourceMappingURL=integrator.module.js.map