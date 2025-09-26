import type { Role } from '@erp-saas/db';
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: Role;
      empresaId: string;
    };
    accessToken?: string;
  }

  interface User {
    role: Role;
    empresaId: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role;
    empresaId?: string;
    accessToken?: string;
  }
}
