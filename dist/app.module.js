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
const sequelize_1 = require("@nestjs/sequelize");
const config_2 = require("./database/config");
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
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const real_estate_agency_entity_1 = require("./whatsapp/entities/real-estate-agency.entity");
const conversation_entity_1 = require("./whatsapp/entities/conversation.entity");
const message_entity_1 = require("./whatsapp/entities/message.entity");
// Environment configuration is handled by ConfigModule
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            sequelize_1.SequelizeModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const nodeEnv = configService.get('NODE_ENV');
                    const isProduction = nodeEnv === 'PRODUCTION';
                    console.log(`🌍 Environment: ${nodeEnv}`);
                    console.log(`🔗 Production mode: ${isProduction}`);
                    console.log(`📦 Database config imported:`, !!config_2.databaseConfig);
                    console.log(`📦 Database config keys:`, Object.keys(config_2.databaseConfig || {}));
                    // Get the appropriate database configuration
                    const environment = (nodeEnv || 'development').toLowerCase();
                    const config = config_2.databaseConfig[environment];
                    console.log(`🏠 Environment: ${environment}`);
                    console.log(`🔧 Available configs:`, Object.keys(config_2.databaseConfig));
                    if (!config) {
                        throw new Error(`Database configuration not found for environment: ${environment}`);
                    }
                    console.log(`🔧 Database config:`, {
                        host: config.host,
                        port: config.port,
                        database: config.database,
                        dialect: config.dialect,
                        hasUrl: !!config.url
                    });
                    // Ensure dialect is explicitly set for Sequelize v4+
                    const sequelizeConfig = Object.assign(Object.assign({}, config), { dialect: config.dialect || 'postgres', models: [user_entity_1.User, kondo_entity_1.Kondo, media_entity_1.Media, unit_entity_1.Unit, like_entity_1.Like, real_estate_agency_entity_1.RealEstateAgency, conversation_entity_1.Conversation, message_entity_1.Message], autoLoadModels: true, logging: (msg) => console.log('🐘 DB Query:', msg), logQueryParameters: true, synchronize: false });
                    return sequelizeConfig;
                },
            }),
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
