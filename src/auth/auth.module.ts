import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt.auth.guard';

import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '9999s' },
    }),
    ],
  providers: [
    {
      provide: APP_GUARD,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      useClass: JwtAuthGuard,
    },
    AuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService]
})
export class AuthModule {}
