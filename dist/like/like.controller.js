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
exports.LikeController = void 0;
const common_1 = require("@nestjs/common");
const like_service_1 = require("./like.service");
const create_like_dto_1 = require("./dto/create-like.dto");
const update_like_dto_1 = require("./dto/update-like.dto");
let LikeController = class LikeController {
    constructor(likeService) {
        this.likeService = likeService;
    }
    create(createLikeDto) {
        return this.likeService.create(createLikeDto);
    }
    findAll() {
        return this.likeService.findAll();
    }
    findOne(id) {
        return this.likeService.findOne(+id);
    }
    update(id, updateLikeDto) {
        return this.likeService.update(+id, updateLikeDto);
    }
    remove(id) {
        return this.likeService.remove(+id);
    }
};
__decorate([
    (0, common_1.Post)('/kondo'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_like_dto_1.CreateLikeDto]),
    __metadata("design:returntype", void 0)
], LikeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LikeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LikeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_like_dto_1.UpdateLikeDto]),
    __metadata("design:returntype", void 0)
], LikeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LikeController.prototype, "remove", null);
LikeController = __decorate([
    (0, common_1.Controller)('like'),
    __metadata("design:paramtypes", [like_service_1.LikeService])
], LikeController);
exports.LikeController = LikeController;
