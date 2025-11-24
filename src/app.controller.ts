import { Body, Controller, Get, Post, UseGuards, Request, Redirect, Res } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator";
import { AuthService } from "./auth/auth.service";
import { LoginDto } from "./auth/dto/login.dto";
import { GoogleOAuthGuard } from "./auth/guards/google-oauth.guard";
import { Response } from "express";
import { CreateUserDto } from "./user/dto/create-user.dto";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Request() req) {
    console.log('received google auth attempt');
  }

  @Public()
  @Get('auth/google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @Redirect('', 302)
  async googleAuthRedirect(@Request() req, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.googleLogin(req);

    //this.redirectBackLogin(access_token, response);

    response.cookie('ksession', 'on')
    response.cookie('koken', access_token);

    return { url: `${process.env.WEB_URL}/?token=${access_token}` }
  }
}