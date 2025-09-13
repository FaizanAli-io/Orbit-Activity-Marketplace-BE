import { SetMetadata } from '@nestjs/common';

export const AUTH_ROLE_KEY = 'auth-role';
export type AuthRoleType = 'USER' | 'VENDOR' | 'SUPERUSER';

export const AuthRole = (role: AuthRoleType) =>
  SetMetadata(AUTH_ROLE_KEY, role);
