import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AdminRoleGuard } from './admin-role.guard';

describe('AdminRoleGuard', () => {
  const guard = new AdminRoleGuard();

  const createContext = (role?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    }) as ExecutionContext;

  it('allows admin users', () => {
    expect(guard.canActivate(createContext('admin'))).toBe(true);
    expect(guard.canActivate(createContext('superAdmin'))).toBe(true);
  });

  it('rejects authenticated non-admin users', () => {
    expect(() => guard.canActivate(createContext('user'))).toThrow(ForbiddenException);
  });

  it('rejects requests without a user role', () => {
    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });
});
