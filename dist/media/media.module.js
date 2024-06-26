"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const media_service_1 = require("./media.service");
const media_controller_1 = require("./media.controller");
const media_provider_1 = require("./repository/media.provider");
const media_entity_1 = require("./entities/media.entity");
const sequelize_1 = require("@nestjs/sequelize");
const media_repository_1 = require("./repository/media.repository");
let MediaModule = class MediaModule {
};
MediaModule = __decorate([
    (0, common_1.Module)({
        controllers: [media_controller_1.MediaController],
        providers: [media_service_1.MediaService, ...media_provider_1.mediaProviders, media_repository_1.MediaRepository],
        imports: [
            sequelize_1.SequelizeModule.forFeature([media_entity_1.Media]),
            //SeederModule.forFeature([SeedMedia])
        ]
    })
], MediaModule);
exports.MediaModule = MediaModule;
