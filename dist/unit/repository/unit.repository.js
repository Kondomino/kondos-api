"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitRepository = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let UnitRepository = class UnitRepository {
    constructor(UnitRepositoryProvider) {
        this.UnitRepositoryProvider = UnitRepositoryProvider;
    }
    find() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.findAll();
        });
    }
    findOne() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.findOne();
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.findAll();
        });
    }
    /**
     * Find or Create
     *
     * @param findOrCreate
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns
     */
    findOrCreate(findOrCreate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.findOrCreate(findOrCreate);
        });
    }
    /**
     * Update
     *
     * @param updateUnitDto
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns
     */
    update(updateUnitDto, where) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.update(updateUnitDto, { where });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.destroy();
        });
    }
    create(createUnitDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UnitRepositoryProvider.create(createUnitDto);
        });
    }
};
UnitRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.UNIT_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], UnitRepository);
exports.UnitRepository = UnitRepository;
