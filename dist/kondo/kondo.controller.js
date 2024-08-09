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
exports.KondoController = void 0;
const common_1 = require("@nestjs/common");
const create_kondo_dto_1 = require("./dto/create-kondo.dto");
const search_kondo_dto_1 = require("./dto/search-kondo.dto");
const update_kondo_dto_1 = require("./dto/update-kondo.dto");
const kondo_service_1 = require("./kondo.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let KondoController = class KondoController {
    constructor(kondoService) {
        this.kondoService = kondoService;
    }
    create(createKondoDto) {
        return this.kondoService.create(createKondoDto);
    }
    findAll(searchKondoDto) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('api received kondo/findAll request', searchKondoDto);
            return this.kondoService.findAll(searchKondoDto);
        });
    }
    // @Public()
    // @Get(':id')
    // findOne(@Param('id') id: string) {
    //   console.log('api received kondo/findOne request');
    //   return this.kondoService.findOne(+id);
    // }
    findBy(searchKondoDto) {
        console.log('received kondo/findBy request', searchKondoDto);
        return this.kondoService.findBy(searchKondoDto);
    }
    update(id, updateKondoDto) {
        return this.kondoService.update(+id, updateKondoDto);
    }
    remove(id) {
        return this.kondoService.deactivateKondo(+id);
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_kondo_dto_1.CreateKondoDto]),
    __metadata("design:returntype", void 0)
], KondoController.prototype, "create", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_kondo_dto_1.SearchKondoDto]),
    __metadata("design:returntype", Promise)
], KondoController.prototype, "findAll", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('/findBy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_kondo_dto_1.SearchKondoDto]),
    __metadata("design:returntype", void 0)
], KondoController.prototype, "findBy", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_kondo_dto_1.UpdateKondoDto]),
    __metadata("design:returntype", void 0)
], KondoController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KondoController.prototype, "remove", null);
KondoController = __decorate([
    (0, common_1.Controller)('kondo'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [kondo_service_1.KondoService])
], KondoController);
exports.KondoController = KondoController;
