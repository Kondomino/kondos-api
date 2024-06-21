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
const slugify_service_1 = require("../utils/slugify/slugify.service");
const kondo_repository_1 = require("./repository/kondo.repository");
//import { KONDO_REPOSITORY_PROVIDER } from '../core/constants';
let KondoService = class KondoService {
    constructor(slugify, KondoRepository) {
        this.slugify = slugify;
        this.KondoRepository = KondoRepository;
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
                return yield this.KondoRepository.findOne({ where: { email } });
        });
    }
    findActives(searchKondoDto) {
        return __awaiter(this, void 0, void 0, function* () {
            searchKondoDto.active = true;
            return yield this.KondoRepository.findAll(searchKondoDto);
        });
    }
    findAll(searchKondoDto) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('find all service');
            return yield this.KondoRepository.findAll(searchKondoDto);
            //return await this.KondoRepository.findAll<Kondo>({});
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
    __metadata("design:paramtypes", [slugify_service_1.SlugifyService,
        kondo_repository_1.KondoRepository])
], KondoService);
exports.KondoService = KondoService;
