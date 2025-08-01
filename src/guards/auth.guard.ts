import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { AUTH_ROLE_KEY, IS_PUBLIC_KEY, AuthRoleType } from 'src/decorators';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    const auth = await this.prisma.auth.findFirst({
      where: { accessToken: token },
    });

    if (!auth) throw new UnauthorizedException('Invalid or expired token');

    const requiredRole = this.reflector.getAllAndOverride<AuthRoleType>(
      AUTH_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRole && auth.role !== requiredRole) {
      throw new ForbiddenException('You do not have access to this resource');
    }

    request.auth = auth;
    return true;
  }
}
