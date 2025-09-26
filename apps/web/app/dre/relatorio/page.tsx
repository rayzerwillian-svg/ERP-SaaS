'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { DataTable } from '@erp-saas/ui';
import { ColumnDef } from '@tanstack/react-table';
import { apiFetch } from '../../../lib/api-client';

interface LinhaDRE {
  competencia: string;
  receitas: number;
  despesas: number;
  lucro: number;
}

interface RelatorioResponse {
  linhas: LinhaDRE[];
  totais: { receitas: number; despesas: number; lucro: number };
}

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<LinhaDRE>[] = [
  { accessorKey: 'competencia', header: 'Competência' },
  {
    accessorKey: 'receitas',
    header: 'Receitas',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'despesas',
    header: 'Despesas',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'lucro',
    header: 'Lucro',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
];

export default function RelatorioDREPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const relatorioQuery = useQuery({
    queryKey: ['dre', 'relatorio'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<RelatorioResponse>('/dre/relatorio', { token });
    },
    enabled: Boolean(token),
  });

  const totais = relatorioQuery.data?.totais ?? { receitas: 0, despesas: 0, lucro: 0 };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Relatório DRE</h2>
        <p className="text-sm text-gray-600">Visualize receitas, despesas e lucro consolidado mensal.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard title="Receitas acumuladas" value={totais.receitas} />
        <SummaryCard title="Despesas acumuladas" value={totais.despesas} />
        <SummaryCard title="Lucro acumulado" value={totais.lucro} />
      </div>

      <DataTable columns={columns} data={relatorioQuery.data?.linhas ?? []} />

      <button
        onClick={() => {
          const msg = `Margem média ${totais.receitas ? ((totais.lucro / totais.receitas) * 100).toFixed(2) : '0'}%.
Principais despesas: ${currency.format(Math.abs(totais.despesas))}.`; 
          alert(`IA: ${msg}`);
        }}
        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
      >
        IA: Narrativa DRE
      </button>

      {relatorioQuery.isLoading ? <p className="text-sm text-gray-500">Carregando relatório...</p> : null}
    </section>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-md border bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-blue-700">{currency.format(value)}</p>
    </div>
  );
}
