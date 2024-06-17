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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../core/constants");
let UserService = class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(user) {
        return await this.userRepository.create(user);
    }
    async findOneByEmail(email) {
        return await this.userRepository.findOne({ where: { email } });
    }
    async findOne(id) {
        return await this.userRepository.findOne({ where: { id } });
    }
    async findActives() {
        return await this.userRepository.findAll({ where: { active: true } });
    }
    async findAll() {
        return await this.userRepository.findAll({});
    }
    async update(id, user) {
        const userFound = await this.findOne(id);
        if (!userFound)
            throw new common_1.NotFoundException();
        return await userFound.update(Object.assign({}, user));
    }
    async deactivateUser(id) {
        const userFound = await this.findOne(id);
        if (!userFound)
            throw new common_1.NotFoundException();
        return await userFound.update({ active: false });
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map