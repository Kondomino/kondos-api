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
const common_1 = require("@nestjs/common");
const constants_1 = require("../../core/constants");
let KondoRepository = class KondoRepository {
    constructor(KondoRepositoryProvider) {
        this.KondoRepositoryProvider = KondoRepositoryProvider;
    }
    async find() {
        return await this.KondoRepositoryProvider.findAll();
    }
    async findOne() {
        return await this.KondoRepositoryProvider.findOne();
    }
    async findAll() {
        return await this.KondoRepositoryProvider.findAll();
    }
    async findOrCreate(findOrCreate) {
        return await this.KondoRepositoryProvider.findOrCreate(findOrCreate);
    }
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
//# sourceMappingURL=kondo.repository.js.map