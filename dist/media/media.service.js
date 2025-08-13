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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../core/constants");
let MediaService = class MediaService {
    constructor(MediaRepository) {
        this.MediaRepository = MediaRepository;
    }
    /*
    async create(Media: CreateMediaDto): Promise<findOrCreateType> {

        try {
            //Media.slug = this.slugify.run(Media.name);

            return await this.MediaRepository.findOrCreate({
                where: { slug: Media.slug },
                defaults: Media
            });
        }
        catch (error) {
            console.log('MediaService error: ', error);
        }
    }
*/
    /*
        async findOneByEmail(email: string): Promise<Media> {
            return await this.MediaRepository.findOne<Media>({ where: { email } });
        }
        
        async findOne(id: number): Promise<Media> {
            return await this.MediaRepository.findOne<Media>({ where: { id } });
        }
        */
    findMediasOfKondo(kondoId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.MediaRepository.findAll({ where: { kondoId } });
        });
    }
    findBy(searchMediaDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filename } = searchMediaDto;
            return yield this.MediaRepository.findOne({ where: { filename } });
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.MediaRepository.findAll({});
        });
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.MEDIA_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], MediaService);
