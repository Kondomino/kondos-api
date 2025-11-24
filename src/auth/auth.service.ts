import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { LoginDto } from './dto/login.dto';
import { UserDto } from '../user/dto/user.dto';
import { User } from '../user/entities/user.entity';
import { OAuthLoginResponse } from './types/oauth.login.type';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { AuthProvider } from './types/auth-provider.type';
import { stytchClient } from './clients/stytch.client';

@Injectable()
export class AuthService {
  private readonly activeAuthProvider: AuthProvider;

  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const provider =
      this.configService.get<string>('ACTIVE_AUTH_PROVIDER') ?? 'stytch';
    this.activeAuthProvider =
      provider === 'google' || provider === 'stytch' ? provider : 'stytch';
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (user && user.password === pass) {
      const result = { ...user };
      delete result.password;
      return result;
    }
    return null;
  }

  generateJwt(payload: { email: string }) {
    return this.jwtService.sign(payload);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const validated = await this.validateUser(email, password);

    if (!validated) {
      throw new UnauthorizedException();
    }

    return {
      access_token: this.generateJwt({ email }),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<object> {
    const { name } = createUserDto;

    const names = name.split(' ');

    const userDTO: UserDto = {
      email: createUserDto.email,
      password: createUserDto.password,
      firstName: names[0],
      lastName: names[1] ? names[1] : '',
    };

    const fetch = await this.usersService.findOrCreate(userDTO);

    return {
      message: 'User registered successfully',
      access_token: this.generateJwt({ email: fetch[0].email }),
    };
  }

  getActiveAuthProvider(): AuthProvider {
    return this.activeAuthProvider;
  }

  isGoogleProvider(): boolean {
    return this.activeAuthProvider === 'google';
  }

  isStytchProvider(): boolean {
    return this.activeAuthProvider === 'stytch';
  }

  async getOAuthUrl(): Promise<{ url: string }> {
    if (!this.isStytchProvider()) {
      throw new BadRequestException(
        'OAuth URL only available when Stytch is the active provider',
      );
    }

    const redirectUrl =
      this.configService.get<string>('STYTCH_REDIRECT_URL') ??
      `${process.env.API_URL ?? ''}/auth/callback`;

    return stytchClient.oauth.google.start({
      redirect_url: redirectUrl,
    });
  }

  async handleOAuthCallback(
    req: any,
    token?: string,
  ): Promise<OAuthLoginResponse> {
    if (this.isGoogleProvider()) {
      return this.handleGoogleLogin(req);
    }

    if (!token) {
      throw new BadRequestException('Missing token for Stytch authentication');
    }

    return this.handleStytchLogin(token);
  }

  private async handleGoogleLogin(req): Promise<OAuthLoginResponse> {
    if (!req.user) {
      return { message: 'No user from google', provider: 'google' };
    }

    const userDTO: UserDto = {
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      picture: req.user.picture,
    };

    const fetch = await this.usersService.findOrCreate(userDTO);

    return {
      message: 'User information from google',
      access_token: this.generateJwt({ email: fetch[0].email }),
      user: req.user,
      provider: 'google',
    };
  }

  private async handleStytchLogin(token: string): Promise<OAuthLoginResponse> {
    const sessionDuration =
      Number(this.configService.get<string>('STYTCH_SESSION_DURATION_MINUTES')) ||
      60 * 24 * 7;

    const authResponse = await stytchClient.oauth.authenticate({
      token,
      session_duration_minutes: sessionDuration,
    });

    const email =
      authResponse.user?.emails?.find((item) => item.email)?.email ??
      authResponse.user?.email ??
      '';

    if (!email) {
      throw new BadRequestException('Unable to determine user email from Stytch');
    }

    const firstName =
      authResponse.user?.name?.first_name ??
      authResponse.user?.name?.firstName ??
      '';
    const lastName =
      authResponse.user?.name?.last_name ??
      authResponse.user?.name?.lastName ??
      '';

    const userDTO: UserDto = {
      email,
      firstName,
      lastName,
      picture: authResponse.user?.picture_url,
    };

    const fetch = await this.usersService.findOrCreate(userDTO);

    return {
      message: 'User information from stytch',
      access_token: this.generateJwt({ email: fetch[0].email }),
      user: {
        email,
        firstName,
        lastName,
        picture: authResponse.user?.picture_url,
      } as Partial<User>,
      provider: 'stytch',
      session_jwt: authResponse.session_jwt,
      session: authResponse.session,
    };
  }
}