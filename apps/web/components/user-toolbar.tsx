'use client';

import { signOut, useSession } from 'next-auth/react';

export function UserToolbar() {
  const { data } = useSession();
  const roleLabel = data?.user.role ? data.user.role.toUpperCase() : 'VIEWER';

  return (
    <header className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-800">{data?.user?.name ?? 'Usuário autenticado'}</p>
        <p className="text-xs text-slate-500">{data?.user?.email ?? 'Acesso autenticado'}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
          {roleLabel}
        </span>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-blue-700"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
