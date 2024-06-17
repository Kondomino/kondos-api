"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaProviders = void 0;
const constants_1 = require("../../core/constants");
const media_entity_1 = require("../entities/media.entity");
exports.mediaProviders = [{
        provide: constants_1.MEDIA_REPOSITORY_PROVIDER,
        useValue: media_entity_1.Media,
    }];
//# sourceMappingURL=media.provider.js.map