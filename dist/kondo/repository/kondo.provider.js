"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kondoProviders = void 0;
const constants_1 = require("../../core/constants");
const kondo_entity_1 = require("../entities/kondo.entity");
exports.kondoProviders = [{
        provide: constants_1.KONDO_REPOSITORY_PROVIDER,
        useValue: kondo_entity_1.Kondo,
    }];
