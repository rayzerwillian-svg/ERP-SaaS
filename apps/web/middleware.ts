import { withAuth } from 'next-auth/middleware';
import type { Role } from '@erp-saas/db';
import { isRoleAllowed } from '@/lib/rbac';

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      if (!token) {
        return false;
      }

      const role = (token.role as Role) ?? 'viewer';
      const pathname = req.nextUrl.pathname;
      const method = req.method ?? 'GET';

      return isRoleAllowed(role, pathname, method);
    },
  },
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
