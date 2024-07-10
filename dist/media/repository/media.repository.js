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
exports.MediaRepository = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let MediaRepository = class MediaRepository {
    constructor(MediaRepositoryProvider) {
        this.MediaRepositoryProvider = MediaRepositoryProvider;
    }
    async find() {
        return await this.MediaRepositoryProvider.findAll();
    }
    async findOne() {
        return await this.MediaRepositoryProvider.findOne();
    }
    async findAll() {
        return await this.MediaRepositoryProvider.findAll();
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
        return await this.MediaRepositoryProvider.findOrCreate(findOrCreate);
    }
    /**
     * Update
     *
     * @param updateMediaDto
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns
     */
    async update(updateMediaDto, where) {
        return await this.MediaRepositoryProvider.update(updateMediaDto, { where });
    }
    async destroy() {
        return await this.MediaRepositoryProvider.destroy();
    }
    async create(createMediaDto) {
        return await this.MediaRepositoryProvider.create(createMediaDto);
    }
};
MediaRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.MEDIA_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], MediaRepository);
exports.MediaRepository = MediaRepository;
