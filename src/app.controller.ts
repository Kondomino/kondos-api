import { Body, Controller, Get, Post, UseGuards, Request, Redirect, Res } from "@nestjs/common";
import { Public } from "./auth/decorators/public.decorator";
import { AuthService } from "./auth/auth.service";
import { LoginDto } from "./auth/dto/login.dto";
import { GoogleOAuthGuard } from "./auth/guards/google-oauth.guard";
import { Response, response } from "express";

@Controller()
export class AppController {
  
  constructor(private readonly authService: AuthService) {}

  @Get('hello')
  @Public()
  hello(): string {
    return 'Hello';
  }

  @Public()
  @Post('auth/login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('auth')
  @UseGuards(GoogleOAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Request() req) {
  }

  @Public()
  @Get('auth/google-redirect')
  @UseGuards(GoogleOAuthGuard)
  @Redirect('', 302)
  async googleAuthRedirect(@Request() req, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.googleLogin(req);

    // response
    //   .status(201)
    //   .set('Content-Type', 'text/plain')
    //   //.cookie('test', 'value1')
    //   //.redirect(`http://localhost:3000/?token=${access_token}`);
    //   .location(`http://localhost:3000/?token=${access_token}`);

    response.cookie('ksession', 'on')
    response.cookie('koken', access_token);

    return { url: `http://localhost:3000/?token=${access_token}` }
  }
}