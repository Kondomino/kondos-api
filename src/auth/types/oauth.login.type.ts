import { User } from '../../user/entities/user.entity';
import { AuthProvider } from './auth-provider.type';

export type OAuthLoginResponse = {
  message: string;
  access_token?: string;
  user?: Partial<User>;
  provider: AuthProvider;
  session_jwt?: string;
  session?: Record<string, unknown>;
};