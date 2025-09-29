'use client';

import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '@/lib/api-client';

type ExecutionRecord = {
  id: string;
  prompt: { id: string; name: string; scope: string } | null;
  model: string;
  mode: 'text' | 'json';
  provider: string;
  usage: { inputTokens: number; outputTokens: number; cost: number };
  latencyMs: number;
  createdAt: string | Date;
  createdByRole?: string | null;
};

const columns: ColumnDef<ExecutionRecord>[] = [
  { accessorKey: 'id', header: 'Execução' },
  {
    id: 'prompt',
    header: 'Prompt',
    cell: ({ row }) => row.original.prompt?.name ?? 'Ad-hoc',
  },
  {
    id: 'modelo',
    header: 'Modelo',
    cell: ({ row }) => `${row.original.model} (${row.original.mode})`,
  },
  {
    id: 'custo',
    header: 'Custo (USD)',
    cell: ({ row }) => row.original.usage?.cost?.toFixed(4) ?? '0.0000',
  },
  { accessorKey: 'latencyMs', header: 'Latência (ms)' },
  {
    id: 'tokens',
    header: 'Tokens (entrada/saída)',
    cell: ({ row }) => `${row.original.usage?.inputTokens ?? 0} / ${row.original.usage?.outputTokens ?? 0}`,
  },
  {
    id: 'role',
    header: 'Criado por',
    cell: ({ row }) => row.original.createdByRole ?? '—',
  },
];

export default function ExecucoesIAPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const execucoesQuery = useQuery({
    queryKey: ['ai', 'execucoes'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ExecutionRecord[]>('/ai/execucoes', { token });
    },
    enabled: Boolean(token),
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Execuções de IA</h2>
        <p className="text-sm text-gray-600">Monitore runs, custo/token, latência e feedback dos usuários.</p>
      </header>

      <DataTable columns={columns} data={execucoesQuery.data ?? []} />
      {execucoesQuery.isLoading ? <p className="text-sm text-gray-500">Carregando execuções...</p> : null}
    </section>
  );
}
