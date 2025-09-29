'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger, DataTable } from '@erp-saas/ui';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api-client';

type Training = {
  id: string;
  curso: string;
  categoria: string;
  cargaHoraria: number;
  responsavel: string;
  prazoConclusao: string;
  status: string;
  certificadosUrl?: string | null;
};

type TrainingForm = {
  curso: string;
  categoria: string;
  cargaHoraria: number;
  responsavel: string;
  prazoConclusao: string;
  status: string;
  certificadosUrl?: string;
};

type Incident = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  status: string;
  severidade: string;
  responsavel: string;
  detectedAt: string;
};

type IncidentForm = {
  titulo: string;
  categoria: string;
  descricao: string;
  status: string;
  severidade: string;
  responsavel: string;
  detectedAt?: string;
};

const trainingColumns: ColumnDef<Training>[] = [
  { accessorKey: 'curso', header: 'Curso' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'cargaHoraria', header: 'Carga Horária' },
  { accessorKey: 'responsavel', header: 'Responsável' },
  { accessorKey: 'prazoConclusao', header: 'Prazo' },
  { accessorKey: 'status', header: 'Status' },
];

const incidentColumns: ColumnDef<Incident>[] = [
  { accessorKey: 'titulo', header: 'Incidente' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'severidade', header: 'Severidade' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'responsavel', header: 'Responsável' },
  { accessorKey: 'detectedAt', header: 'Detectado em' },
];

export default function ComplianceTreinamentoPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('treinamentos');

  const trainingsQuery = useQuery({
    queryKey: ['compliance', 'treinamentos'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Training[]>('/compliance/treinamentos', { token });
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

  const trainingForm = useForm<TrainingForm>({ defaultValues: { status: 'pendente', cargaHoraria: 2 } });
  const incidentForm = useForm<IncidentForm>({ defaultValues: { status: 'aberto', severidade: 'média' } });

  const createTraining = useMutation({
    mutationFn: (payload: TrainingForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Training>('/compliance/treinamentos', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'treinamentos'] });
      trainingForm.reset({ status: 'pendente', cargaHoraria: 2 });
    },
  });

  const createIncident = useMutation({
    mutationFn: (payload: IncidentForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Incident>('/compliance/incidentes', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'incidentes'] });
      incidentForm.reset({ status: 'aberto', severidade: 'média' });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance - Treinamento e Governança</h1>
        <p className="text-sm text-gray-600">
          Orquestre treinamentos obrigatórios, acompanhe certificações e registre incidentes de compliance com fluxos de escalonamento.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="treinamentos">Treinamentos obrigatórios</TabsTrigger>
          <TabsTrigger value="incidentes">Gestão de incidentes</TabsTrigger>
        </TabsList>

        <TabsContent value="treinamentos">
          <form
            onSubmit={trainingForm.handleSubmit(async (values) => {
              try {
                await createTraining.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Curso</span>
                <input
                  {...trainingForm.register('curso', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="LGPD para colaboradores"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Categoria</span>
                <input
                  {...trainingForm.register('categoria', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="LGPD, Ética, Anticorrupção"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Carga horária (h)</span>
                <input
                  type="number"
                  step="0.5"
                  {...trainingForm.register('cargaHoraria', { valueAsNumber: true, required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Responsável</span>
                <input
                  {...trainingForm.register('responsavel', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Compliance Officer"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Prazo de conclusão</span>
                <input
                  type="date"
                  {...trainingForm.register('prazoConclusao', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...trainingForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="pendente, em andamento, concluído"
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">URL do certificado (opcional)</span>
                <input {...trainingForm.register('certificadosUrl')} className="w-full rounded-md border px-3 py-2" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createTraining.isPending}
              >
                {createTraining.isPending ? 'Registrando...' : 'Cadastrar treinamento'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA recomenda reforçar treinamentos de anticorrupção para o time de compras neste trimestre.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Sugerir calendário
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={trainingColumns} data={trainingsQuery.data ?? []} />
            {trainingsQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando treinamentos...</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="incidentes">
          <form
            onSubmit={incidentForm.handleSubmit(async (values) => {
              try {
                await createIncident.mutateAsync(values);
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
                  {...incidentForm.register('titulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Categoria</span>
                <input
                  {...incidentForm.register('categoria', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="LGPD, Fiscal, Ética"
                  required
                />
              </label>
              <label className="text-sm md:col-span-2">
                <span className="mb-1 block font-medium">Descrição</span>
                <textarea
                  {...incidentForm.register('descricao', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...incidentForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="aberto, em investigação, resolvido"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Severidade</span>
                <input
                  {...incidentForm.register('severidade', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="baixa, média, alta"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Responsável</span>
                <input
                  {...incidentForm.register('responsavel', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Compliance Officer"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Data de detecção</span>
                <input type="datetime-local" {...incidentForm.register('detectedAt')} className="w-full rounded-md border px-3 py-2" />
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createIncident.isPending}
              >
                {createIncident.isPending ? 'Registrando...' : 'Registrar incidente'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA recomenda abrir incidente de follow-up com o jurídico para avaliar exposição a multas trabalhistas.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Escalonar incidente
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={incidentColumns} data={incidentsQuery.data ?? []} />
            {incidentsQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando incidentes...</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
