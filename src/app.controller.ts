import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Redirect,
  Res,
  Query,
} from '@nestjs/common';
import { URLSearchParams } from 'url';
import { Public } from "./auth/decorators/public.decorator";
import { AuthService } from "./auth/auth.service";
import { LoginDto } from "./auth/dto/login.dto";
import { GoogleOAuthGuard } from "./auth/guards/google-oauth.guard";
import { Response } from "express";
import { CreateUserDto } from "./user/dto/create-user.dto";
import { OAuthLoginResponse } from './auth/types/oauth.login.type';

@Controller()
export class AppController {
  
  constructor(private readonly authService: AuthService) {}

  @Get('hello')
  @Public()
  hello(): string {
    return 'Hello';
  }

  @Public()
  @Post('auth/register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  @Public()
  @Post('auth/login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Public()
  @Redirect('', 302)
  @Post('auth/logout')
  async logout(@Body() loginDto: LoginDto, response: Response) {
    response.clearCookie('ksession');
    response.clearCookie('koken');
    
    return { url: process.env.WEB_URL }
  }

  @Public()
  @Redirect('', 302)
  redirectBackLogin(access_token: string, response: Response) {
    response.cookie('ksession', 'on')
    response.cookie('koken', access_token);

    return { url: `${process.env.WEB_URL}/?token=${access_token}` }
  }

  @Public()
  @Get('auth')
  @UseGuards(GoogleOAuthGuard)
  async oauthEntry() {
    if (this.authService.isGoogleProvider()) {
      // WARNING: This route triggers Google OAuth when ACTIVE_AUTH_PROVIDER is set to "google".
      console.log('received google auth attempt');
      return { message: 'Google OAuth flow started' };
    }

    return this.authService.getOAuthUrl();
  }

  @Public()
  @Get('auth/callback')
  @UseGuards(GoogleOAuthGuard)
  @Redirect('', 302)
  async oauthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
    @Query('token') token?: string,
  ) {
    return this.handleOAuthResponse(req, response, token);
  }

  @Public()
  @Get('auth/google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @Redirect('', 302)
  async legacyGoogleAuthRedirect(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
    @Query('token') token?: string,
  ) {
    // WARNING: Legacy endpoint kept for backwards compatibility with Google OAuth callback configuration.
    return this.handleOAuthResponse(req, response, token);
  }

  private async handleOAuthResponse(
    req,
    response: Response,
    token?: string,
  ): Promise<{ url: string }> {
    const result = await this.authService.handleOAuthCallback(req, token);

    if (result.access_token) {
      response.cookie('ksession', 'on');
      response.cookie('koken', result.access_token);
    }

    return { url: this.buildRedirectUrl(result) };
  }

  private buildRedirectUrl(result: OAuthLoginResponse): string {
    const baseUrl = process.env.WEB_URL ?? '';
    if (!result.access_token && !result.session_jwt) {
      return baseUrl;
    }

    const params = new URLSearchParams();

    if (result.access_token) {
      params.append('token', result.access_token);
    }

    if (result.session_jwt) {
      params.append('session_jwt', result.session_jwt);
    }

    const query = params.toString();

    return query ? `${baseUrl}/?${query}` : baseUrl;
  }
}