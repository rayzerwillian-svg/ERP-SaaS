'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger, DataTable } from '@erp-saas/ui';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api-client';

type Monitoring = {
  id: string;
  titulo: string;
  categoria: string;
  modulo: string;
  status: string;
  severidade: string;
  detectedAt: string;
};

type Scenario = {
  id: string;
  titulo: string;
  regulacaoAlvo: string;
  impactoPrevisto: number;
  status: string;
  recomendacoes?: string | null;
};

type ScenarioForm = {
  titulo: string;
  regulacaoAlvo: string;
  impactoPrevisto: number;
  status: string;
  recomendacoes?: string;
};

type Incident = {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  severidade: string;
  detectedAt: string;
};

const monitoringColumns: ColumnDef<Monitoring>[] = [
  { accessorKey: 'titulo', header: 'Monitoramento' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'severidade', header: 'Severidade' },
  { accessorKey: 'detectedAt', header: 'Detectado em' },
];

const scenarioColumns: ColumnDef<Scenario>[] = [
  { accessorKey: 'titulo', header: 'Cenário' },
  { accessorKey: 'regulacaoAlvo', header: 'Regulação' },
  { accessorKey: 'impactoPrevisto', header: 'Impacto (R$)' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'recomendacoes', header: 'Recomendações' },
];

const incidentColumns: ColumnDef<Incident>[] = [
  { accessorKey: 'titulo', header: 'Incidente' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'severidade', header: 'Severidade' },
  { accessorKey: 'detectedAt', header: 'Detectado em' },
];

const TAB_TO_REGULATION: Record<string, string> = {
  fiscal: 'Fiscal Brasileiro',
  lgpd: 'LGPD',
  setorial: 'Setorial',
  kyc: 'KYC/AML',
};

export default function ComplianceConformidadePage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'fiscal' | 'lgpd' | 'setorial' | 'kyc'>('fiscal');

  const monitoramentosQuery = useQuery({
    queryKey: ['compliance', 'monitoramentos'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Monitoring[]>('/compliance/monitoramentos', { token });
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

  const incidentsQuery = useQuery({
    queryKey: ['compliance', 'incidentes'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Incident[]>('/compliance/incidentes', { token });
    },
    enabled: Boolean(token),
  });

  const scenarioForm = useForm<ScenarioForm>({ defaultValues: { status: 'em avaliação', regulacaoAlvo: TAB_TO_REGULATION['fiscal'] } });

  useEffect(() => {
    scenarioForm.reset({
      titulo: '',
      regulacaoAlvo: TAB_TO_REGULATION[tab],
      impactoPrevisto: 0,
      status: 'em avaliação',
      recomendacoes: '',
    });
  }, [tab, scenarioForm]);

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
      scenarioForm.reset({ status: 'em avaliação', regulacaoAlvo: TAB_TO_REGULATION[tab] });
    },
  });

  const filteredMonitoramentos = useMemo(() => {
    const data = monitoramentosQuery.data ?? [];
    const keyword = TAB_TO_REGULATION[tab].toLowerCase();
    return data.filter((item) =>
      [item.categoria, item.modulo].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [monitoramentosQuery.data, tab]);

  const filteredScenarios = useMemo(() => {
    const data = scenariosQuery.data ?? [];
    const keyword = TAB_TO_REGULATION[tab].toLowerCase();
    return data.filter((item) => item.regulacaoAlvo.toLowerCase().includes(keyword));
  }, [scenariosQuery.data, tab]);

  const filteredIncidents = useMemo(() => {
    if (tab !== 'setorial' && tab !== 'fiscal') {
      return (incidentsQuery.data ?? []).filter((incident) =>
        incident.categoria.toLowerCase().includes(TAB_TO_REGULATION[tab].toLowerCase()),
      );
    }
    return (incidentsQuery.data ?? []).filter((incident) =>
      incident.categoria.toLowerCase().includes(tab === 'fiscal' ? 'fiscal' : 'anvisa'),
    );
  }, [incidentsQuery.data, tab]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance - Conformidade Setorial e Fiscal</h1>
        <p className="text-sm text-gray-600">
          Acompanhe obrigações fiscais, LGPD, regulamentações setoriais (ANVISA/ESG) e programas de KYC/AML com cenários assistidos por IA.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="fiscal">Fiscal Brasileiro</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD & Proteção de Dados</TabsTrigger>
          <TabsTrigger value="setorial">Setorial Avançado</TabsTrigger>
          <TabsTrigger value="kyc">KYC / AML</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Monitoramentos relacionados</h2>
              <DataTable columns={monitoringColumns} data={filteredMonitoramentos} />
              {monitoramentosQuery.isLoading ? (
                <p className="mt-2 text-sm text-gray-500">Carregando monitoramentos...</p>
              ) : null}
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Incidentes relevantes</h2>
              <DataTable columns={incidentColumns} data={filteredIncidents} />
              {incidentsQuery.isLoading ? (
                <p className="mt-2 text-sm text-gray-500">Carregando incidentes...</p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Simular novo cenário regulatório</h2>
            <form
              onSubmit={scenarioForm.handleSubmit(async (values) => {
                try {
                  await createScenario.mutateAsync(values);
                } catch (error) {
                  alert((error as Error).message);
                }
              })}
              className="grid gap-4 md:grid-cols-2"
            >
              <label className="text-sm">
                <span className="mb-1 block font-medium">Título</span>
                <input
                  {...scenarioForm.register('titulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Regulação alvo</span>
                <input
                  {...scenarioForm.register('regulacaoAlvo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
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
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">Recomendações</span>
                <textarea
                  {...scenarioForm.register('recomendacoes')}
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                />
              </label>
              <div className="md:col-span-2 flex items-center gap-3">
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
                    alert('IA alerta para atualização de certificados digitais e necessidade de adequação ao layout NF-e 5.0.')
                  }
                  className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                >
                  IA: Gerar recomendações
                </button>
              </div>
            </form>

            <div className="mt-6">
              <DataTable columns={scenarioColumns} data={filteredScenarios} />
              {scenariosQuery.isLoading ? (
                <p className="mt-2 text-sm text-gray-500">Carregando cenários...</p>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
