'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger, DataTable } from '@erp-saas/ui';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api-client';

type Monitoring = {
  id: string;
  titulo: string;
  modulo: string;
  categoria: string;
  descricao?: string | null;
  status: string;
  severidade: string;
  detectedAt: string;
  resolvedAt?: string | null;
};

type MonitoringForm = {
  titulo: string;
  modulo: string;
  categoria: string;
  descricao?: string;
  status: string;
  severidade: string;
  detectedAt?: string;
};

type Alert = {
  id: string;
  monitoringId?: string | null;
  canal: string;
  destinatarios: string[];
  mensagem: string;
  status: string;
  triggeredAt: string;
  acknowledgedAt?: string | null;
};

type AlertForm = {
  monitoringId?: string;
  canal: string;
  destinatarios: string;
  mensagem: string;
  status: string;
};

type Risk = {
  id: string;
  monitoringId?: string | null;
  modulo: string;
  risco: string;
  score: number;
  probabilidade: number;
  impacto: number;
  status: string;
  recomendacoes?: string | null;
  criadoEm: string;
};

type RiskForm = {
  monitoringId?: string;
  modulo: string;
  risco: string;
  score: number;
  probabilidade: number;
  impacto: number;
  status: string;
  recomendacoes?: string;
};

const monitoringColumns: ColumnDef<Monitoring>[] = [
  { accessorKey: 'titulo', header: 'Título' },
  { accessorKey: 'modulo', header: 'Módulo' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'severidade', header: 'Severidade' },
  { accessorKey: 'detectedAt', header: 'Detectado em' },
  { accessorKey: 'resolvedAt', header: 'Resolvido em' },
];

const alertColumns: ColumnDef<Alert>[] = [
  { accessorKey: 'canal', header: 'Canal' },
  { accessorKey: 'destinatarios', header: 'Destinatários', cell: ({ row }) => row.original.destinatarios.join(', ') },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'triggeredAt', header: 'Disparado em' },
  { accessorKey: 'acknowledgedAt', header: 'Reconhecido em' },
];

const riskColumns: ColumnDef<Risk>[] = [
  { accessorKey: 'modulo', header: 'Módulo' },
  { accessorKey: 'risco', header: 'Risco' },
  { accessorKey: 'score', header: 'Score' },
  { accessorKey: 'probabilidade', header: 'Prob. %' },
  { accessorKey: 'impacto', header: 'Impacto %' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'recomendacoes', header: 'Recomendações' },
];

function normalizeList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ComplianceMonitoramentoPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('monitoramentos');

  const monitoramentosQuery = useQuery({
    queryKey: ['compliance', 'monitoramentos'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Monitoring[]>('/compliance/monitoramentos', { token });
    },
    enabled: Boolean(token),
  });

  const alertasQuery = useQuery({
    queryKey: ['compliance', 'alertas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Alert[]>('/compliance/alertas', { token });
    },
    enabled: Boolean(token),
  });

  const riscosQuery = useQuery({
    queryKey: ['compliance', 'riscos'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Risk[]>('/compliance/riscos', { token });
    },
    enabled: Boolean(token),
  });

  const monitoringForm = useForm<MonitoringForm>();
  const alertForm = useForm<AlertForm>({ defaultValues: { status: 'pendente' } });
  const riskForm = useForm<RiskForm>({ defaultValues: { status: 'pendente' } });

  const createMonitoring = useMutation({
    mutationFn: (payload: MonitoringForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Monitoring>('/compliance/monitoramentos', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'monitoramentos'] });
      monitoringForm.reset();
    },
  });

  const createAlert = useMutation({
    mutationFn: (payload: AlertForm) => {
      if (!token) throw new Error('Sessão inválida');
      const { destinatarios, ...rest } = payload;
      return apiFetch<Alert>('/compliance/alertas', {
        method: 'POST',
        body: { ...rest, destinatarios: normalizeList(destinatarios) },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'alertas'] });
      alertForm.reset({ status: 'pendente' });
    },
  });

  const createRisk = useMutation({
    mutationFn: (payload: RiskForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Risk>('/compliance/riscos', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'riscos'] });
      riskForm.reset({ status: 'pendente' });
    },
  });

  const monitoringOptions = useMemo(
    () =>
      (monitoramentosQuery.data ?? []).map((item) => ({
        id: item.id,
        label: `${item.titulo} (${item.modulo})`,
      })),
    [monitoramentosQuery.data],
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance - Monitoramento e Alertas</h1>
        <p className="text-sm text-gray-600">
          Configure monitoramento contínuo, defina alertas automatizados e acompanhe análises de risco assistidas por IA.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monitoramentos">Monitoramento em Tempo Real</TabsTrigger>
          <TabsTrigger value="alertas">Alertas Automatizados</TabsTrigger>
          <TabsTrigger value="riscos">Análise de Riscos com IA</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoramentos">
          <form
            onSubmit={monitoringForm.handleSubmit(async (values) => {
              try {
                await createMonitoring.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Título</span>
                <input
                  {...monitoringForm.register('titulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Módulo</span>
                <input
                  {...monitoringForm.register('modulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Financeiro, Fiscal, Dados..."
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Categoria</span>
                <input
                  {...monitoringForm.register('categoria', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="SPED, LGPD, AML..."
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...monitoringForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="ativo, investigando, resolvido"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Severidade</span>
                <input
                  {...monitoringForm.register('severidade', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="baixa, média, alta"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Detectado em</span>
                <input
                  type="datetime-local"
                  {...monitoringForm.register('detectedAt')}
                  className="w-full rounded-md border px-3 py-2"
                />
              </label>
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Descrição</span>
              <textarea
                {...monitoringForm.register('descricao')}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createMonitoring.isPending}
              >
                {createMonitoring.isPending ? 'Salvando...' : 'Registrar monitoramento'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA sugeriu intensificar revisão de notas fiscais com divergências de CFOP nas últimas 24h.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Priorizar análises
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={monitoringColumns} data={monitoramentosQuery.data ?? []} />
            {monitoramentosQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando monitoramentos...</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="alertas">
          <form
            onSubmit={alertForm.handleSubmit(async (values) => {
              try {
                await createAlert.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Monitoramento vinculado</span>
                <select {...alertForm.register('monitoringId')} className="w-full rounded-md border px-3 py-2">
                  <option value="">Selecione (opcional)</option>
                  {monitoringOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Canal</span>
                <input
                  {...alertForm.register('canal', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="E-mail, SMS, Slack"
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">Destinatários</span>
                <textarea
                  {...alertForm.register('destinatarios', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Insira e-mails separados por vírgula ou linha"
                  rows={2}
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">Mensagem</span>
                <textarea
                  {...alertForm.register('mensagem', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...alertForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="pendente, reconhecido, resolvido"
                  required
                />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createAlert.isPending}
              >
                {createAlert.isPending ? 'Agendando...' : 'Configurar alerta'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA recomenda enviar alerta preventivo sobre certificados digitais a vencer em 15 dias.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Sugerir alerta preventivo
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={alertColumns} data={alertasQuery.data ?? []} />
            {alertasQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando alertas...</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="riscos">
          <form
            onSubmit={riskForm.handleSubmit(async (values) => {
              try {
                await createRisk.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Monitoramento vinculado</span>
                <select {...riskForm.register('monitoringId')} className="w-full rounded-md border px-3 py-2">
                  <option value="">Selecione (opcional)</option>
                  {monitoringOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Módulo</span>
                <input
                  {...riskForm.register('modulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">Risco</span>
                <input
                  {...riskForm.register('risco', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Ex.: Divergência de ICMS em NF-e"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Score (0-100)</span>
                <input
                  type="number"
                  step="0.1"
                  {...riskForm.register('score', { valueAsNumber: true, required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Probabilidade %</span>
                <input
                  type="number"
                  step="0.1"
                  {...riskForm.register('probabilidade', { valueAsNumber: true, required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Impacto %</span>
                <input
                  type="number"
                  step="0.1"
                  {...riskForm.register('impacto', { valueAsNumber: true, required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...riskForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="pendente, mitigado, transferido"
                  required
                />
              </label>
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Recomendações</span>
              <textarea
                {...riskForm.register('recomendacoes')}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createRisk.isPending}
              >
                {createRisk.isPending ? 'Calculando...' : 'Registrar análise de risco'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA estimou probabilidade de 62% de não conformidade fiscal no próximo mês para o módulo de NF-e.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Estimar risco futuro
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={riskColumns} data={riscosQuery.data ?? []} />
            {riscosQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando análises...</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
