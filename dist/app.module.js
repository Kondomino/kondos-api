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
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, config_1.ConfigModule.forRoot({ isGlobal: true }),
            sequelize_1.SequelizeModule.forRoot({
                dialect: 'postgres',
                //dialectOptions: { ssl: { require: false, rejectUnauthorized: false } },
                host: process.env.DB_HOST,
                port: 5432,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                models: [user_entity_1.User, kondo_entity_1.Kondo, media_entity_1.Media],
                autoLoadModels: true,
            }),
            user_module_1.UserModule,
            kondo_module_1.KondoModule,
            integrator_module_1.IntegratorModule,
            media_module_1.MediaModule,
            /*
            SeederModule.forRoot({
              // Activate this if you want to run the seeders if the table is empty in the database
              runOnlyIfTableIsEmpty: true,
           }),*/
            //SequelizeModule.forFeature([User, Kondo])
        ],
        controllers: [app_controller_1.AppController],
        providers: [...kondo_provider_1.kondoProviders],
    })
], AppModule);
exports.AppModule = AppModule;
