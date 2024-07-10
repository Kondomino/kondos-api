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
exports.KondoRepository = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
const sequelize_1 = require("sequelize");
const like_entity_1 = require("../../like/entities/like.entity");
let KondoRepository = class KondoRepository {
    constructor(KondoRepositoryProvider) {
        this.KondoRepositoryProvider = KondoRepositoryProvider;
    }
    async findOne(where) {
        return await this.KondoRepositoryProvider.findOne(where);
    }
    async findAll(searchKondoDto) {
        // eslint-disable-next-line prefer-const
        let { take, order, page, name, slug, active, status, phrase } = searchKondoDto;
        // eslint-disable-next-line prefer-const
        let query = {
            //attributes: ['Kondo.*', 'Like.id'],
            //attributes: ['Kondo.*', sequelize.fn('COUNT', sequelize.col('likes.kondoId'))],
            limit: take,
            where: { active, status },
            include: { model: like_entity_1.Like, as: 'likes' },
            // include: [
            //     { 
            //       model: Like,
            //       as: 'likes', attributes: []
            //     }
            // ]
        };
        if (phrase) {
            const queryPhraseArray = phrase.split(' ');
            query.where = Object.assign(query.where, {
                [sequelize_1.Op.or]: [
                    { name: { [sequelize_1.Op.iLike]: { [sequelize_1.Op.any]: queryPhraseArray.map(item => `%${item}`) } } },
                    { city: { [sequelize_1.Op.iLike]: { [sequelize_1.Op.any]: queryPhraseArray.map(item => `%${item}`) } } },
                    { neighborhood: { [sequelize_1.Op.iLike]: { [sequelize_1.Op.any]: queryPhraseArray.map(item => `%${item}`) } } }
                ]
            });
        }
        if (name) {
            query.where = Object.assign(query.where, { name });
        }
        if (slug) {
            query.where = Object.assign(query.where, { slug });
        }
        if (order) {
            query.order = [['id', searchKondoDto.order]];
        }
        page = page ? page - 1 : 0;
        query.offset = page * searchKondoDto.take;
        return await this.KondoRepositoryProvider.findAll(query);
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
        return await this.KondoRepositoryProvider.findOrCreate(findOrCreate);
    }
    /**
     * Update
     *
     * @param updateKondoDto
     * @param where {
                        where: {
                        lastName: null,
                        },
                    },
     * @returns
     */
    async update(updateKondoDto, where) {
        return await this.KondoRepositoryProvider.update(updateKondoDto, { where });
    }
    async destroy() {
        return await this.KondoRepositoryProvider.destroy();
    }
    async create(createKondoDto) {
        return await this.KondoRepositoryProvider.create(createKondoDto);
    }
};
KondoRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KONDO_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], KondoRepository);
exports.KondoRepository = KondoRepository;
