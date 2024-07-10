"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseProviders = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const constants_1 = require("../constants");
const database_config_1 = require("./database.config");
const user_entity_1 = require("../../user/entities/user.entity");
const kondo_entity_1 = require("../../kondo/entities/kondo.entity");
const media_entity_1 = require("../../media/entities/media.entity");
const unit_entity_1 = require("../../unit/entities/unit.entity");
const like_entity_1 = require("../../like/entities/like.entity");
exports.databaseProviders = [{
        provide: constants_1.SEQUELIZE,
        useFactory: async () => {
            let config;
            switch (process.env.NODE_ENV) {
                case constants_1.DEVELOPMENT:
                    config = database_config_1.databaseConfig.development;
                    break;
                case constants_1.TEST:
                    config = database_config_1.databaseConfig.test;
                    break;
                case constants_1.PRODUCTION:
                    config = database_config_1.databaseConfig.production;
                    break;
                default:
                    config = database_config_1.databaseConfig.development;
            }
            const sequelize = new sequelize_typescript_1.Sequelize(config);
            sequelize.addModels([user_entity_1.User, kondo_entity_1.Kondo, media_entity_1.Media, unit_entity_1.Unit, like_entity_1.Like]);
            await sequelize.sync();
            return sequelize;
        },
    }];
