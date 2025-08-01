"use strict";
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
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
dotenv.config();
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        //initializeApp();
        console.log('🔍 Environment Variables Debug:');
        console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
        console.log('DB_HOST:', process.env.DB_HOST || 'undefined (fallback: localhost)');
        console.log('DB_PORT:', process.env.DB_PORT || 'undefined (fallback: 5433)');
        console.log('DB_USER:', process.env.DB_USER || 'undefined (fallback: postgres)');
        console.log('DB_NAME:', process.env.DB_NAME || 'undefined (fallback: kondo)');
        console.log('DB_DIALECT:', process.env.DB_DIALECT || 'undefined (fallback: postgres)');
        const app = yield core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
        app.useGlobalPipes(new common_1.ValidationPipe({ transform: true }));
        app.use(cookieParser());
        app.setGlobalPrefix('api');
        yield app.listen(3003);
    });
}
bootstrap();
