'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger, DataTable } from '@erp-saas/ui';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api-client';

type Report = {
  id: string;
  tipo: string;
  periodoInicio: string;
  periodoFim: string;
  formato: string;
  status: string;
  destino: string[];
  arquivoUrl?: string | null;
  geradoEm?: string | null;
  criadoEm: string;
};

type ReportForm = {
  tipo: string;
  periodoInicio: string;
  periodoFim: string;
  formato: string;
  status: string;
  destino: string;
  arquivoUrl?: string;
  geradoEm?: string;
};

type AuditLog = {
  id: string;
  usuario: string;
  acao: string;
  entidade: string;
  detalhes?: Record<string, unknown> | null;
  occurredAt: string;
};

type DashboardMetrics = {
  monitoramentosAtivos: number;
  alertasPendentes: number;
  riscoMedio: number;
  incidentesAbertos: number;
  treinamentosPendentes: number;
};

type Scenario = {
  id: string;
  titulo: string;
  regulacaoAlvo: string;
  descricao?: string | null;
  impactoPrevisto: number;
  recomendacoes?: string | null;
  status: string;
  criadoEm: string;
};

type ScenarioForm = {
  titulo: string;
  regulacaoAlvo: string;
  descricao?: string;
  impactoPrevisto: number;
  recomendacoes?: string;
  status: string;
};

const reportColumns: ColumnDef<Report>[] = [
  { accessorKey: 'tipo', header: 'Tipo' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'periodoInicio', header: 'Início' },
  { accessorKey: 'periodoFim', header: 'Fim' },
  { accessorKey: 'formato', header: 'Formato' },
  { accessorKey: 'destino', header: 'Destinatários', cell: ({ row }) => row.original.destino.join(', ') },
  { accessorKey: 'geradoEm', header: 'Gerado em' },
];

const auditColumns: ColumnDef<AuditLog>[] = [
  { accessorKey: 'usuario', header: 'Usuário' },
  { accessorKey: 'acao', header: 'Ação' },
  { accessorKey: 'entidade', header: 'Entidade' },
  { accessorKey: 'occurredAt', header: 'Data' },
];

const scenarioColumns: ColumnDef<Scenario>[] = [
  { accessorKey: 'titulo', header: 'Cenário' },
  { accessorKey: 'regulacaoAlvo', header: 'Regulação Alvo' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'impactoPrevisto', header: 'Impacto Previsto' },
  { accessorKey: 'recomendacoes', header: 'Recomendações' },
];

export default function ComplianceRelatoriosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('relatorios');

  const reportsQuery = useQuery({
    queryKey: ['compliance', 'relatorios'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Report[]>('/compliance/relatorios', { token });
    },
    enabled: Boolean(token),
  });

  const auditQuery = useQuery({
    queryKey: ['compliance', 'auditoria'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<AuditLog[]>('/compliance/auditoria/logs', { token });
    },
    enabled: Boolean(token),
  });

  const dashboardQuery = useQuery({
    queryKey: ['compliance', 'dashboard'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DashboardMetrics>('/compliance/dashboard', { token });
    },
    enabled: Boolean(token),
  });

  const scenariosQuery = useQuery({
    queryKey: ['compliance', 'cenarios'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Scenario[]>('/compliance/cenarios', { token });
    },
    enabled: Boolean(token),
  });

  const reportForm = useForm<ReportForm>({
    defaultValues: {
      formato: 'pdf',
      status: 'agendado',
    },
  });

  const scenarioForm = useForm<ScenarioForm>({ defaultValues: { status: 'em avaliação' } });

  const createReport = useMutation({
    mutationFn: (payload: ReportForm) => {
      if (!token) throw new Error('Sessão inválida');
      const { destino, ...rest } = payload;
      return apiFetch<Report>('/compliance/relatorios', {
        method: 'POST',
        body: { ...rest, destino: destino.split(/\n|,/).map((item) => item.trim()).filter(Boolean) },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'relatorios'] });
      reportForm.reset({ formato: 'pdf', status: 'agendado' });
    },
  });

  const createScenario = useMutation({
    mutationFn: (payload: ScenarioForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Scenario>('/compliance/cenarios', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'cenarios'] });
      scenarioForm.reset({ status: 'em avaliação' });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance - Relatórios e Auditorias</h1>
        <p className="text-sm text-gray-600">
          Geração automatizada de relatórios regulatórios, trilhas de auditoria imutáveis e simulações de cenários legislativos.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="relatorios">Relatórios Automatizados</TabsTrigger>
          <TabsTrigger value="auditoria">Audit Trail</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboards de Conformidade</TabsTrigger>
          <TabsTrigger value="simulacoes">Simulações de Cenários</TabsTrigger>
        </TabsList>

        <TabsContent value="relatorios">
          <form
            onSubmit={reportForm.handleSubmit(async (values) => {
              try {
                await createReport.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Tipo de relatório</span>
                <input
                  {...reportForm.register('tipo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="EFD-Reinf, DIRF, LGPD"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Formato</span>
                <input
                  {...reportForm.register('formato', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="pdf, xml, csv"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Período inicial</span>
                <input
                  type="date"
                  {...reportForm.register('periodoInicio', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Período final</span>
                <input
                  type="date"
                  {...reportForm.register('periodoFim', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...reportForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="agendado, processando, entregue"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Destinatários</span>
                <textarea
                  {...reportForm.register('destino', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="E-mails separados por vírgula"
                  rows={2}
                  required
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">URL do arquivo (opcional)</span>
                <input {...reportForm.register('arquivoUrl')} className="w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Data de geração (opcional)</span>
                <input type="datetime-local" {...reportForm.register('geradoEm')} className="w-full rounded-md border px-3 py-2" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createReport.isPending}
              >
                {createReport.isPending ? 'Gerando...' : 'Agendar relatório'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA sugeriu antecipar o envio do relatório EFD-Contribuições devido a risco de multa estadual.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Priorizar entrega
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={reportColumns} data={reportsQuery.data ?? []} />
            {reportsQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando relatórios...</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="auditoria">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <DataTable columns={auditColumns} data={auditQuery.data ?? []} />
            {auditQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando trilha de auditoria...</p>
            ) : null}
            <p className="mt-4 text-xs text-gray-500">
              As entradas são imutáveis e podem ser exportadas para auditorias externas.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ComplianceCard title="Monitoramentos ativos" value={dashboardQuery.data?.monitoramentosAtivos ?? 0} />
            <ComplianceCard title="Alertas pendentes" value={dashboardQuery.data?.alertasPendentes ?? 0} />
            <ComplianceCard title="Risco médio (%)" value={dashboardQuery.data?.riscoMedio ?? 0} suffix="%" />
            <ComplianceCard title="Incidentes abertos" value={dashboardQuery.data?.incidentesAbertos ?? 0} />
            <ComplianceCard title="Treinamentos pendentes" value={dashboardQuery.data?.treinamentosPendentes ?? 0} />
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Combine estes KPIs com BI externo (Power BI, Tableau) para análises preditivas e planos de ação.
          </p>
        </TabsContent>

        <TabsContent value="simulacoes">
          <form
            onSubmit={scenarioForm.handleSubmit(async (values) => {
              try {
                await createScenario.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Título do cenário</span>
                <input
                  {...scenarioForm.register('titulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Impacto da NF-e 5.0"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Regulação alvo</span>
                <input
                  {...scenarioForm.register('regulacaoAlvo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="NF-e, LGPD, eSocial, AML"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Impacto previsto (R$)</span>
                <input
                  type="number"
                  step="0.01"
                  {...scenarioForm.register('impactoPrevisto', { valueAsNumber: true, required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...scenarioForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="em avaliação, aprovado"
                  required
                />
              </label>
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Descrição</span>
              <textarea
                {...scenarioForm.register('descricao')}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Recomendações</span>
              <textarea
                {...scenarioForm.register('recomendacoes')}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createScenario.isPending}
              >
                {createScenario.isPending ? 'Simulando...' : 'Registrar cenário'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA sugeriu reservar orçamento adicional de R$ 85 mil para adequação ao layout NF-e 5.0 em 2025.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Estimar impacto
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={scenarioColumns} data={scenariosQuery.data ?? []} />
            {scenariosQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando cenários...</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ComplianceCard({ title, value, suffix }: { title: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">
        {value.toLocaleString('pt-BR', { minimumFractionDigits: suffix ? 2 : 0, maximumFractionDigits: suffix ? 2 : 0 })}
        {suffix ? <span className="text-base font-medium text-gray-500"> {suffix}</span> : null}
      </p>
    </div>
  );
}
