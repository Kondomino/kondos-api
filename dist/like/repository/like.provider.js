"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeProviders = void 0;
const constants_1 = require("../../core/constants");
const like_entity_1 = require("../entities/like.entity");
exports.likeProviders = [{
        provide: constants_1.LIKE_REPOSITORY_PROVIDER,
        useValue: like_entity_1.Like,
    }];
