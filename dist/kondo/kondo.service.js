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
exports.KondoService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../core/constants");
const slugify_service_1 = require("../utils/slugify/slugify.service");
let KondoService = class KondoService {
    constructor(KondoRepository, slugify) {
        this.KondoRepository = KondoRepository;
        this.slugify = slugify;
    }
    create(Kondo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                Kondo.slug = this.slugify.run(Kondo.name);
                return yield this.KondoRepository.findOrCreate({
                    where: { slug: Kondo.slug },
                    defaults: Kondo
                });
            }
            catch (error) {
                console.log('KondoService error: ', error);
            }
        });
    }
    findOneByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.KondoRepository.findOne({ where: { email } });
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.KondoRepository.findOne({ where: { id } });
        });
    }
    findBy(searchKondoDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, slug, email } = searchKondoDto;
            if (name)
                return yield this.KondoRepository.findOne({ where: { name } });
            else if (slug)
                return yield this.KondoRepository.findOne({ where: { slug } });
            else if (email)
                return this.findOneByEmail(email);
        });
    }
    findActives() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.KondoRepository.findAll({ where: { active: true } });
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.KondoRepository.findAll({});
        });
    }
    update(id, Kondo) {
        return __awaiter(this, void 0, void 0, function* () {
            const KondoFound = yield this.findOne(id);
            if (!KondoFound)
                throw new common_1.NotFoundException();
            return yield KondoFound.update(Object.assign({}, Kondo));
        });
    }
    deactivateKondo(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const KondoFound = yield this.findOne(id);
            if (!KondoFound)
                throw new common_1.NotFoundException();
            return yield KondoFound.update({ active: false });
        });
    }
};
KondoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KONDO_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object, slugify_service_1.SlugifyService])
], KondoService);
exports.KondoService = KondoService;
