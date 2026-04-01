import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;

    if (!role) {
      throw new UnauthorizedException('User context is missing');
    }

    if (role !== 'admin' && role !== 'superAdmin') {
      throw new ForbiddenException('Admin access is required');
    }

    return true;
  }
}
