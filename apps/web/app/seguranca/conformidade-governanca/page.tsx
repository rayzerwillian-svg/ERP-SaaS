'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SecuritySettingsSchema, SecurityTrainingSchema } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type TrainingRecord = z.infer<typeof SecurityTrainingSchema> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

type SettingsResponse = z.infer<typeof SecuritySettingsSchema> & {
  complianceContact?: string | null;
};

const TrainingFormSchema = SecurityTrainingSchema.pick({
  titulo: true,
  publicoAlvo: true,
  descricao: true,
  cargaHoraria: true,
  dueDate: true,
  completionRate: true,
  participantes: true,
  responsavel: true,
  recursos: true,
  status: true,
}).extend({
  descricao: z.string().optional(),
  dueDate: z.string().optional(),
  completionRate: z.number().optional(),
  participantes: z.number().optional(),
  responsavel: z.string().optional(),
  recursos: z.string().optional(),
});

type TrainingFormInput = z.infer<typeof TrainingFormSchema>;

const GovernanceSchema = SecuritySettingsSchema.pick({ complianceContact: true }).extend({
  complianceContact: z.string().optional(),
});

type GovernanceInput = z.infer<typeof GovernanceSchema>;

export default function ConformidadeGovernancaPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const trainingsQuery = useQuery({
    queryKey: ['seguranca', 'treinamentos'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<TrainingRecord[]>('/seguranca/treinamentos', { token });
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['seguranca', 'configuracoes'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SettingsResponse>('/seguranca/configuracoes', { token });
    },
  });

  const createTraining = useMutation({
    mutationFn: async (payload: TrainingFormInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<TrainingRecord>('/seguranca/treinamentos', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'treinamentos'] });
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'logs'] });
    },
  });

  const updateTrainingStatus = useMutation({
    mutationFn: async (training: { id: string; status: string }) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<TrainingRecord>(`/seguranca/treinamentos/${training.id}`, {
        method: 'PATCH',
        body: { status: training.status },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'treinamentos'] });
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'logs'] });
    },
  });

  const updateGovernance = useMutation({
    mutationFn: async (payload: GovernanceInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SettingsResponse>('/seguranca/configuracoes', {
        method: 'PUT',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'configuracoes'] });
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'logs'] });
    },
  });

  const trainings = trainingsQuery.data ?? [];
  const settings = settingsQuery.data;

  const averageCompletion =
    trainings.length > 0
      ? Number(
          (
            trainings.reduce((acc, training) => acc + Number(training.completionRate ?? 0), 0) /
            trainings.length
          ).toFixed(2),
        )
      : 0;

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Conformidade e Governança</h1>
        <p className="text-sm text-gray-600">
          Orquestre treinamentos obrigatórios, mantenha o contato do DPO e acompanhe a maturidade de segurança em toda a
          organização.
        </p>
      </header>

      <SchemaForm
        schema={GovernanceSchema}
        fields={[
          {
            name: 'complianceContact',
            label: 'Contato oficial (DPO/Segurança)',
            placeholder: 'dpo@empresa.com',
          },
        ]}
        defaultValues={{ complianceContact: settings?.complianceContact ?? undefined }}
        submitLabel={updateGovernance.isPending ? 'Salvando...' : 'Atualizar contato'}
        onSubmit={async (values) => {
          try {
            await updateGovernance.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Gerar comunicado',
            onInvoke: async (values) =>
              `Notifique os colaboradores que o ponto focal de segurança é ${values.complianceContact ?? 'não definido'} e que treinamentos anuais são obrigatórios conforme PCI DSS 4.0.`,
          },
        ]}
      />

      <SchemaForm
        schema={TrainingFormSchema}
        fields={[
          { name: 'titulo', label: 'Título do treinamento' },
          { name: 'publicoAlvo', label: 'Público-alvo' },
          { name: 'descricao', label: 'Descrição', type: 'textarea' },
          { name: 'cargaHoraria', label: 'Carga horária (horas)', type: 'number' },
          { name: 'dueDate', label: 'Prazo de conclusão', type: 'date' },
          { name: 'completionRate', label: '% Conclusão atual', type: 'number' },
          { name: 'participantes', label: 'Participantes previstos', type: 'number' },
          { name: 'responsavel', label: 'Responsável' },
          { name: 'recursos', label: 'Recursos/Links', type: 'textarea' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Planejado', value: 'planejado' },
              { label: 'Em andamento', value: 'em_andamento' },
              { label: 'Concluído', value: 'concluido' },
            ],
          },
        ]}
        submitLabel={createTraining.isPending ? 'Agendando...' : 'Agendar treinamento'}
        onSubmit={async (values) => {
          try {
            await createTraining.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Sugerir calendário',
            onInvoke: async (values) =>
              `Agende reciclagem ${values.titulo} a cada 6 meses para ${values.publicoAlvo} e acompanhe conclusão mínima de 95%.`,
          },
        ]}
      />

      <section className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Treinamentos programados</h2>
        {trainings.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum treinamento cadastrado.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {trainings.map((training) => (
              <li key={training.id} className="rounded border border-gray-200 p-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{training.titulo}</p>
                    <p className="text-xs text-gray-500">Público: {training.publicoAlvo}</p>
                  </div>
                  <select
                    className="rounded border border-gray-300 px-2 py-1 text-xs"
                    value={training.status}
                    onChange={(event) =>
                      updateTrainingStatus.mutate({ id: training.id, status: event.target.value })
                    }
                  >
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500 md:grid-cols-4">
                  <span>Carga: {training.cargaHoraria}h</span>
                  <span>Prazo: {training.dueDate ? new Date(training.dueDate).toLocaleDateString() : '—'}</span>
                  <span>Conclusão: {training.completionRate ?? 0}%</span>
                  <span>Participantes: {training.participantes ?? 0}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Indicadores rápidos</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-4">
          <div className="rounded border border-gray-200 p-3 text-center">
            <p className="text-xs uppercase text-gray-500">Treinamentos ativos</p>
            <p className="text-xl font-semibold text-blue-700">{trainings.length}</p>
          </div>
          <div className="rounded border border-gray-200 p-3 text-center">
            <p className="text-xs uppercase text-gray-500">Conclusão média</p>
            <p className="text-xl font-semibold text-blue-700">{averageCompletion}%</p>
          </div>
          <div className="rounded border border-gray-200 p-3 text-center">
            <p className="text-xs uppercase text-gray-500">Contato DPO</p>
            <p className="text-sm font-semibold text-gray-700">{settings?.complianceContact ?? 'Não definido'}</p>
          </div>
        </div>
      </section>

      {trainingsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando treinamentos...</p> : null}
    </section>
  );
}
