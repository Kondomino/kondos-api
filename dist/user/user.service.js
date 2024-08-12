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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../core/constants");
let UserService = class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.create(user);
        });
    }
    // async findOneByUsername(username: string): Promise<User | undefined> {
    //     return await this.userRepository.findOne<User>({ where: { username } });
    // }
    findOneByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('searching by email ', email);
            return yield this.userRepository.findOne({ where: { email } });
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('searching for', id);
            return yield this.userRepository.findOne({ where: { id } });
        });
    }
    findActives() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findAll({ where: { active: true } });
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findAll({});
        });
    }
    update(id, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const userFound = yield this.findOne(id);
            if (!userFound)
                throw new common_1.NotFoundException();
            return yield userFound.update(Object.assign({}, user));
        });
    }
    deactivateUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const userFound = yield this.findOne(id);
            if (!userFound)
                throw new common_1.NotFoundException();
            return yield userFound.update({ active: false });
        });
    }
    findOrCreate(userDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.userRepository.findOrCreate({
                where: { email: userDto.email },
                defaults: userDto
            });
        });
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.USER_REPOSITORY_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], UserService);
exports.UserService = UserService;
