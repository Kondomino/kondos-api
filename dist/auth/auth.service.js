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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
const jwt_service_1 = require("@nestjs/jwt/dist/jwt.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    validateUser(email, pass) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('[auth.service] validateUser');
            const user = yield this.usersService.findOneByEmail(email);
            if (user && user.password === pass) {
                const { password } = user, result = __rest(user, ["password"]);
                return result;
            }
            return null;
        });
    }
    /**
     * Generates JWT Token
     *
     * @param payload
     * @returns
     */
    generateJwt(payload) {
        return this.jwtService.sign(payload);
    }
    login(loginDto) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('[auth.service] login');
            const { email, password } = loginDto;
            const validated = yield this.validateUser(email, password);
            if (!validated) {
                throw new common_1.UnauthorizedException();
            }
            //const payload = { username: user.username, sub: user.userId };
            return {
                access_token: this.generateJwt({ email }),
            };
        });
    }
    register(createUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name } = createUserDto;
            const names = name.split(" ");
            const userDTO = {
                email: createUserDto.email,
                password: createUserDto.password,
                firstName: names[0],
                lastName: names[1] ? names[1] : '',
            };
            // FIND OR CREATE USER
            const fetch = yield this.usersService.findOrCreate(userDTO);
            // IF FOUND, UPDATE
            return {
                message: 'User information from google',
                access_token: this.generateJwt({ email: fetch[0].email }),
            };
        });
    }
    googleLogin(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return { message: 'No user from google' };
            }
            const userDTO = {
                email: req.user.email,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                picture: req.user.picture
            };
            // FIND OR CREATE USER
            const fetch = yield this.usersService.findOrCreate(userDTO);
            // IF FOUND, UPDATE
            return {
                message: 'User information from google',
                access_token: this.generateJwt({ email: fetch[0].email }),
                user: req.user,
            };
        });
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_service_1.JwtService])
], AuthService);
exports.AuthService = AuthService;
