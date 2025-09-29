'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { apiFetch } from '../../lib/api-client';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

type DashboardResponse = {
  kpis: {
    receita: number;
    cmv: number;
    margemContribPercentual: number;
    lucro: number;
    markupMedio: number;
    mixDigitalPercentual: number;
    custosFixos: number;
    topCanal: string | null;
  };
  receitaDespesa: { competencia: string; receita: number; despesa: number }[];
  topProdutos: { produto: string; margem: number }[];
  perdasValidade: { produto: string; perda: number }[];
  alerts: string[];
};

function formatCompetencia(key: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) {
    return key;
  }
  const date = new Date(Date.UTC(year, month - 1, 1));
  return `${date.toLocaleString('pt-BR', { month: 'short' })}/${String(year).slice(-2)}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão expirada');
      return apiFetch<DashboardResponse>('/dashboard', { token });
    },
  });

  const serieData = useMemo(
    () =>
      dashboardQuery.data?.receitaDespesa.map((item) => ({
        mes: formatCompetencia(item.competencia),
        receita: item.receita,
        despesa: item.despesa,
      })) ?? [],
    [dashboardQuery.data?.receitaDespesa],
  );

  const topProdutosData = useMemo(
    () =>
      dashboardQuery.data?.topProdutos.map((item) => ({
        produto: item.produto,
        margem: item.margem,
      })) ?? [],
    [dashboardQuery.data?.topProdutos],
  );

  const perdasValidadeData = useMemo(
    () =>
      dashboardQuery.data?.perdasValidade.map((item) => ({
        produto: item.produto,
        perda: item.perda,
      })) ?? [],
    [dashboardQuery.data?.perdasValidade],
  );

  const kpis = dashboardQuery.data?.kpis;
  const iaMessage = dashboardQuery.data?.alerts[0];

  const handleIa = () => {
    if (iaMessage) {
      alert(`IA: ${iaMessage}`);
    } else {
      alert('IA não encontrou alertas críticos no período avaliado.');
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard Financeiro</h2>
          <p className="text-sm text-gray-600">
            Consolide KPIs de receita, custos, margem e acompanhe sinais de IA em tempo real.
          </p>
        </div>
        <button
          onClick={handleIa}
          disabled={dashboardQuery.isLoading}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          IA: Detectar exceções
        </button>
      </header>

      {dashboardQuery.isError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {(dashboardQuery.error as Error).message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Receita" value={kpis ? currency.format(kpis.receita) : '—'} />
        <KpiCard title="CMV" value={kpis ? currency.format(kpis.cmv) : '—'} />
        <KpiCard
          title="Margem Contribuição"
          value={kpis ? percent.format(kpis.margemContribPercentual) : '—'}
        />
        <KpiCard title="Lucro" value={kpis ? currency.format(kpis.lucro) : '—'} />
        <KpiCard title="Markup médio" value={kpis ? `${kpis.markupMedio.toFixed(2)}x` : '—'} />
        <KpiCard title="Mix digital" value={kpis ? percent.format(kpis.mixDigitalPercentual) : '—'} />
        <KpiCard title="Custos Fixos" value={kpis ? currency.format(kpis.custosFixos) : '—'} />
        <KpiCard title="Top canal" value={kpis?.topCanal ?? '—'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Receita vs Despesa (M/M)</h3>
            {dashboardQuery.isLoading ? (
              <span className="text-xs text-gray-400">Carregando...</span>
            ) : null}
          </div>
          {serieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={serieData}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => currency.format(value)} />
                <Line type="monotone" dataKey="receita" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="despesa" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Sem lançamentos de receita ou despesa no período." />
          )}
        </div>

        <div className="rounded-md border bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Top produtos por margem</h3>
            {dashboardQuery.isLoading ? (
              <span className="text-xs text-gray-400">Carregando...</span>
            ) : null}
          </div>
          {topProdutosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProdutosData}>
                <XAxis dataKey="produto" interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => currency.format(value)} />
                <Bar dataKey="margem" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Cadastre análises com margem para ranquear produtos." />
          )}
        </div>

        <div className="rounded-md border bg-white p-4 shadow lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Perdas por validade (FEFO)</h3>
            {dashboardQuery.isLoading ? (
              <span className="text-xs text-gray-400">Carregando...</span>
            ) : null}
          </div>
          {perdasValidadeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={perdasValidadeData}>
                <XAxis dataKey="produto" interval={0} angle={-20} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => currency.format(value)} />
                <Bar dataKey="perda" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="Nenhuma perda registrada com base nos pesos dos processados." />
          )}
        </div>
      </div>

      {dashboardQuery.data?.alerts.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-800">Alertas de IA</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {dashboardQuery.data.alerts.map((alert) => (
              <li key={alert}>{alert}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-4 shadow">
      <p className="text-xs uppercase text-gray-500">{title}</p>
      <p className="mt-1 text-xl font-semibold text-blue-700">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm text-gray-500">{message}</p>;
}
