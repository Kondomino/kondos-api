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
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let UserRepository = class UserRepository {
    constructor(UserRepositoryProvider) {
        this.UserRepositoryProvider = UserRepositoryProvider;
    }
    find() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.findAll();
        });
    }
    findOne() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.findOne();
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.findAll();
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
            return yield this.UserRepositoryProvider.findOrCreate(findOrCreate);
        });
    }
    /**
     * Update
     *
     * @param updateUserDto
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns
     */
    update(updateUserDto, where) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.update(updateUserDto, { where });
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.destroy();
        });
    }
    create(createUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.UserRepositoryProvider.create(createUserDto);
        });
    }
};
exports.UserRepository = UserRepository;
exports.UserRepository = UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], UserRepository);
