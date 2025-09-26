import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@erp-saas/db';
import type { Role } from '@erp-saas/db';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { apiFetch } from './api-client';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    nome: string;
    role: Role;
    empresaId: string;
  };
};

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Credenciais',
    credentials: {
      email: { label: 'E-mail', type: 'email', placeholder: 'usuario@empresa.com' },
      password: { label: 'Senha', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        const result = await apiFetch<LoginResponse>('/auth/login', {
          method: 'POST',
          body: {
            email: credentials.email,
            password: credentials.password,
          },
        });

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.nome,
          role: result.user.role,
          empresaId: result.user.empresaId,
          accessToken: result.accessToken,
        } as any;
      } catch (error) {
        console.error('Falha ao autenticar no serviço de API', error);
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 12, // 12h
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? token.role ?? 'viewer';
        token.empresaId = (user as any).empresaId ?? token.empresaId;
        token.accessToken = (user as any).accessToken ?? token.accessToken;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? '';
        session.user.role = (token.role as Role) ?? 'viewer';
        session.user.empresaId = (token.empresaId as string) ?? '';
      }

      (session as any).accessToken = token.accessToken as string | undefined;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
