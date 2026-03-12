import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: AuthUser }>();

    const header = request.headers.authorization;
    const token = this.extractBearerToken(header);

    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const authUser = await this.authService.verifyAndResolveUser(token);
    request.user = authUser;

    return true;
  }

  private extractBearerToken(value: string | string[] | undefined): string | null {
    if (!value) {
      return null;
    }

    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) {
      return null;
    }

    const [scheme, token] = raw.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return null;
    }

    return token;
  }
}
