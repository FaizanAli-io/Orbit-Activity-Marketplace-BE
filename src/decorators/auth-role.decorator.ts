import { SetMetadata } from '@nestjs/common';

export const AUTH_ROLE_KEY = 'authRole';
export type AuthRoleType = 'USER' | 'VENDOR';

export const AuthRole = (role: AuthRoleType) =>
  SetMetadata(AUTH_ROLE_KEY, role);
