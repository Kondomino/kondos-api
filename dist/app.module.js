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
const database_module_1 = require("./core/database/database.module");
const config_1 = require("@nestjs/config");
const sequelize_1 = require("@nestjs/sequelize");
const kondo_module_1 = require("./kondo/kondo.module");
const app_controller_1 = require("./app.controller");
const integrator_module_1 = require("./integrator/integrator.module");
const kondo_provider_1 = require("./kondo/repository/kondo.provider");
const kondo_entity_1 = require("./kondo/entities/kondo.entity");
const media_entity_1 = require("./media/entities/media.entity");
const media_module_1 = require("./media/media.module");
const user_entity_1 = require("./user/entities/user.entity");
const unit_module_1 = require("./unit/unit.module");
const unit_entity_1 = require("./unit/entities/unit.entity");
const like_module_1 = require("./like/like.module");
const like_entity_1 = require("./like/entities/like.entity");
const auth_module_1 = require("./auth/auth.module");
const google_strategy_1 = require("./auth/strategies/google.strategy");
const requireSSL_for_prod_only = process.env.NODE_ENV === 'PRODUCTION' ? { ssl: { require: true, rejectUnauthorized: false } } : {};
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            sequelize_1.SequelizeModule.forRoot({
                dialect: 'postgres',
                dialectOptions: requireSSL_for_prod_only,
                host: process.env.DB_HOST,
                port: 5432,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                models: [user_entity_1.User, kondo_entity_1.Kondo, media_entity_1.Media, unit_entity_1.Unit, like_entity_1.Like],
                autoLoadModels: true,
            }),
            user_module_1.UserModule,
            kondo_module_1.KondoModule,
            integrator_module_1.IntegratorModule,
            media_module_1.MediaModule,
            unit_module_1.UnitModule,
            like_module_1.LikeModule,
            auth_module_1.AuthModule
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
exports.AppModule = AppModule;
