import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@erp-saas/db';

export type AuthenticatedUser = {
  id: string;
  email: string;
  nome: string;
  role: Role;
  empresaId: string;
};

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser | undefined;
  },
);
