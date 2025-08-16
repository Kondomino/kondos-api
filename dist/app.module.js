"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const user_module_1 = require("./user/user.module");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./modules/database/database.module");
const kondo_module_1 = require("./kondo/kondo.module");
const app_controller_1 = require("./app.controller");
const integrator_module_1 = require("./integrator/integrator.module");
const kondo_provider_1 = require("./kondo/repository/kondo.provider");
const media_module_1 = require("./media/media.module");
const unit_module_1 = require("./unit/unit.module");
const like_module_1 = require("./like/like.module");
const auth_module_1 = require("./auth/auth.module");
const google_strategy_1 = require("./auth/strategies/google.strategy");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
// Environment configuration is handled by ConfigModule
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            user_module_1.UserModule,
            kondo_module_1.KondoModule,
            integrator_module_1.IntegratorModule,
            media_module_1.MediaModule,
            unit_module_1.UnitModule,
            like_module_1.LikeModule,
            auth_module_1.AuthModule,
            whatsapp_module_1.WhatsappModule
            //   SeederModule.forRoot({
            //     // Activate this if you want to run the seeders if the table is empty in the database
            //     runOnlyIfTableIsEmpty: true,
            //     logging: true,
            //  }),
            //SequelizeModule.forFeature([User, Kondo])
        ],
        controllers: [app_controller_1.AppController],
        providers: [...kondo_provider_1.kondoProviders, google_strategy_1.GoogleStrategy],
    })
], AppModule);
