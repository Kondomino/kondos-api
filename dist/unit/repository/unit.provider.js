"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitProviders = void 0;
const constants_1 = require("../../core/constants");
const unit_entity_1 = require("../entities/unit.entity");
exports.unitProviders = [{
        provide: constants_1.UNIT_REPOSITORY_PROVIDER,
        useValue: unit_entity_1.Unit,
    }];
