import './globals.css';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Sidebar } from '@/components/sidebar';
import { AppProviders } from '@/components/providers';
import { authOptions } from '@/lib/auth';
import { UserToolbar } from '@/components/user-toolbar';

export const metadata: Metadata = {
  title: 'ERP SaaS',
  description: 'ERP SaaS com módulos de Cadastros, Fiscal, IA e Finanças',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">
        <AppProviders session={session}>
          {isAuthenticated ? (
            <div className="grid min-h-screen grid-cols-[260px_1fr]">
              <aside className="border-r bg-white p-4">
                <div className="mb-6">
                  <h1 className="text-lg font-bold text-blue-700">ERP SaaS</h1>
                  <p className="text-xs text-gray-500">Gestão integrada com IA</p>
                </div>
                <Sidebar />
              </aside>
              <main className="flex flex-col gap-6 overflow-y-auto bg-gray-50 p-6">
                <UserToolbar />
                {children}
              </main>
            </div>
          ) : (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">{children}</main>
          )}
        </AppProviders>
      </body>
    </html>
  );
}
