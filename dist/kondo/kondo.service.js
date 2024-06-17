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
exports.KondoService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../core/constants");
const slugify_service_1 = require("../utils/slugify/slugify.service");
let KondoService = class KondoService {
    constructor(KondoRepository, slugify) {
        this.KondoRepository = KondoRepository;
        this.slugify = slugify;
    }
    async create(Kondo) {
        try {
            Kondo.slug = this.slugify.run(Kondo.name);
            return await this.KondoRepository.findOrCreate({
                where: { slug: Kondo.slug },
                defaults: Kondo
            });
        }
        catch (error) {
            console.log('KondoService error: ', error);
        }
    }
    async findOneByEmail(email) {
        return await this.KondoRepository.findOne({ where: { email } });
    }
    async findOne(id) {
        return await this.KondoRepository.findOne({ where: { id } });
    }
    async findBy(searchKondoDto) {
        const { name, slug, email } = searchKondoDto;
        if (name)
            return await this.KondoRepository.findOne({ where: { name } });
        else if (slug)
            return await this.KondoRepository.findOne({ where: { slug } });
        else if (email)
            return this.findOneByEmail(email);
    }
    async findActives() {
        return await this.KondoRepository.findAll({ where: { active: true } });
    }
    async findAll() {
        return await this.KondoRepository.findAll({});
    }
    async update(id, Kondo) {
        const KondoFound = await this.findOne(id);
        if (!KondoFound)
            throw new common_1.NotFoundException();
        return await KondoFound.update(Object.assign({}, Kondo));
    }
    async deactivateKondo(id) {
        const KondoFound = await this.findOne(id);
        if (!KondoFound)
            throw new common_1.NotFoundException();
        return await KondoFound.update({ active: false });
    }
};
KondoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KONDO_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object, slugify_service_1.SlugifyService])
], KondoService);
exports.KondoService = KondoService;
//# sourceMappingURL=kondo.service.js.map