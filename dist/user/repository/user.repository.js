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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let UserRepository = class UserRepository {
    constructor(UserRepositoryProvider) {
        this.UserRepositoryProvider = UserRepositoryProvider;
    }
    async find() {
        return await this.UserRepositoryProvider.findAll();
    }
    async findOne() {
        return await this.UserRepositoryProvider.findOne();
    }
    async findAll() {
        return await this.UserRepositoryProvider.findAll();
    }
    /**
     * Find or Create
     *
     * @param findOrCreate
     *      Will try to find by id or slug.
     *      If nothing is found, will create.
     * @returns
     */
    async findOrCreate(findOrCreate) {
        return await this.UserRepositoryProvider.findOrCreate(findOrCreate);
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
    async update(updateUserDto, where) {
        return await this.UserRepositoryProvider.update(updateUserDto, { where });
    }
    async destroy() {
        return await this.UserRepositoryProvider.destroy();
    }
    async create(createUserDto) {
        return await this.UserRepositoryProvider.create(createUserDto);
    }
};
UserRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], UserRepository);
exports.UserRepository = UserRepository;
