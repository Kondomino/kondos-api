import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthProvider } from '../types/auth-provider.type';

@Injectable()
export class GoogleOAuthGuard extends AuthGuard('google') {
  constructor(private configService: ConfigService) {
    super({
      accessType: 'offline',
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const provider =
      this.configService.get<string>('ACTIVE_AUTH_PROVIDER') ?? 'stytch';
    const activeProvider: AuthProvider =
      provider === 'google' || provider === 'stytch' ? provider : 'stytch';

    if (activeProvider === 'google') {
      return super.canActivate(context) as Promise<boolean>;
    }

    // When Stytch is active, this guard becomes a pass-through to avoid isolated routes.
    return true;
  }
}