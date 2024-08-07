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
exports.LikeRepository = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let LikeRepository = class LikeRepository {
    constructor(LikeRepositoryProvider) {
        this.LikeRepositoryProvider = LikeRepositoryProvider;
    }
    find() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.findAll();
        });
    }
    findOne() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.findOne();
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.findAll();
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
            return yield this.LikeRepositoryProvider.findOrCreate(findOrCreate);
        });
    }
    /**
     * Update
     *
     * @param updateLikeDto
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns
     */
    update(updateLikeDto, where) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.update(updateLikeDto, { where });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.destroy();
        });
    }
    create(createLikeDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.LikeRepositoryProvider.create(createLikeDto);
        });
    }
};
LikeRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.LIKE_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], LikeRepository);
exports.LikeRepository = LikeRepository;
