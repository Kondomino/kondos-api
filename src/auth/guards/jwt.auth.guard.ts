import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { jwtConstants } from '../constants';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
  
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private jwtService: JwtService, private reflector: Reflector) {
      super();
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      console.log('[jwt.auth.guard] canActivate');
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) {
        return true;
      }

      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);

      if (!token) {
        throw new UnauthorizedException();
      }
      try {
        const payload = await this.jwtService.verifyAsync(
          token,
          {
            secret: jwtConstants.secret
          }
        );
        // 💡 We're assigning the payload to the request object here
        // so that we can access it in our route handlers
        request['user'] = payload;
      } catch {
        throw new UnauthorizedException();
      }
      return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }
  