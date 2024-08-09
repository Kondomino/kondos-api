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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("./auth/decorators/public.decorator");
const auth_service_1 = require("./auth/auth.service");
const login_dto_1 = require("./auth/dto/login.dto");
const google_oauth_guard_1 = require("./auth/guards/google-oauth.guard");
const create_user_dto_1 = require("./user/dto/create-user.dto");
let AppController = class AppController {
    constructor(authService) {
        this.authService = authService;
    }
    hello() {
        return 'Hello';
    }
    register(createUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.authService.register(createUserDto);
        });
    }
    login(loginDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.authService.login(loginDto);
        });
    }
    logout(loginDto, response) {
        return __awaiter(this, void 0, void 0, function* () {
            response.clearCookie('ksession');
            response.clearCookie('koken');
            return { url: process.env.WEB_URL };
        });
    }
    redirectBackLogin(access_token, response) {
        response.cookie('ksession', 'on');
        response.cookie('koken', access_token);
        console.log(process.env.NODE_ENV);
        console.log(process.env.WEB_URL);
        return { url: `${process.env.WEB_URL}/?token=${access_token}` };
    }
    googleAuth(req) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('received google auth attempt');
        });
    }
    googleAuthRedirect(req, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { access_token } = yield this.authService.googleLogin(req);
            //this.redirectBackLogin(access_token, response);
            response.cookie('ksession', 'on');
            response.cookie('koken', access_token);
            console.log(process.env.NODE_ENV);
            console.log(process.env.WEB_URL);
            return { url: `${process.env.WEB_URL}/?token=${access_token}` };
        });
    }
};
__decorate([
    (0, common_1.Get)('hello'),
    (0, public_decorator_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "hello", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('auth/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('auth/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Redirect)('', 302),
    (0, common_1.Post)('auth/logout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Redirect)('', 302),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "redirectBackLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('auth'),
    (0, common_1.UseGuards)(google_oauth_guard_1.GoogleOAuthGuard)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ,
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "googleAuth", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('auth/google-redirect'),
    (0, common_1.UseGuards)(google_oauth_guard_1.GoogleOAuthGuard),
    (0, common_1.Redirect)('', 302),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "googleAuthRedirect", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AppController);
exports.AppController = AppController;
