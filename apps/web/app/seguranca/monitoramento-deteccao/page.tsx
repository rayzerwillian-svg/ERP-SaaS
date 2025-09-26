'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SecurityIncidentSchema } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type IncidentRecord = z.infer<typeof SecurityIncidentSchema> & {
  id: string;
  createdAt: string;
  detectedAt: string;
  status: string;
  severidade: string;
};

type AuditLog = {
  id: string;
  actor: string;
  acao: string;
  contexto?: string | null;
  origem?: string | null;
  recordedAt: string;
};

const IncidentFormSchema = SecurityIncidentSchema.pick({
  titulo: true,
  severidade: true,
  status: true,
  descricao: true,
  reportedBy: true,
  detectedAt: true,
  planoAcao: true,
}).extend({
  detectedAt: z.string().optional(),
  descricao: z.string().optional(),
  planoAcao: z.string().optional(),
});

type IncidentFormInput = z.infer<typeof IncidentFormSchema>;

export default function MonitoramentoDeteccaoPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const incidentsQuery = useQuery({
    queryKey: ['seguranca', 'incidentes'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<IncidentRecord[]>('/seguranca/incidentes', { token });
    },
  });

  const logsQuery = useQuery({
    queryKey: ['seguranca', 'logs'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<AuditLog[]>('/seguranca/logs', { token });
    },
  });

  const createIncident = useMutation({
    mutationFn: async (payload: IncidentFormInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<IncidentRecord>('/seguranca/incidentes', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'incidentes'] });
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'logs'] });
    },
  });

  const resolveIncident = useMutation({
    mutationFn: async (incident: { id: string; planoAcao?: string }) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<IncidentRecord>(`/seguranca/incidentes/${incident.id}`, {
        method: 'PATCH',
        body: {
          status: 'resolvido',
          resolvedAt: new Date().toISOString(),
          planoAcao: incident.planoAcao,
        },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'incidentes'] });
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'logs'] });
    },
  });

  const incidents = incidentsQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  const incidentSummary = incidents.reduce<Record<string, number>>((acc, incident) => {
    acc[incident.status] = (acc[incident.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Monitoramento e Detecção</h1>
        <p className="text-sm text-gray-600">
          Centralize incidentes de segurança, auditorias imutáveis e alertas em tempo real com suporte a IA para detectar
          anomalias.
        </p>
      </header>

      <SchemaForm
        schema={IncidentFormSchema}
        fields={[
          { name: 'titulo', label: 'Título do incidente' },
          {
            name: 'severidade',
            label: 'Severidade',
            type: 'select',
            options: [
              { label: 'Baixa', value: 'baixa' },
              { label: 'Média', value: 'media' },
              { label: 'Alta', value: 'alta' },
              { label: 'Crítica', value: 'critica' },
            ],
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Aberto', value: 'aberto' },
              { label: 'Investigando', value: 'investigando' },
              { label: 'Resolvido', value: 'resolvido' },
            ],
          },
          { name: 'descricao', label: 'Descrição', type: 'textarea' },
          { name: 'reportedBy', label: 'Reportado por (usuário/equipe)' },
          { name: 'detectedAt', label: 'Detectado em', type: 'date' },
          { name: 'planoAcao', label: 'Plano de ação inicial', type: 'textarea' },
        ]}
        submitLabel={createIncident.isPending ? 'Registrando...' : 'Registrar incidente'}
        onSubmit={async (values) => {
          try {
            await createIncident.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Gerar resposta inicial',
            onInvoke: async (values) =>
              `Abrir bridge com SOC, classificar como ${values.severidade.toUpperCase()} e iniciar isolamento automático para ${values.titulo}.`,
          },
        ]}
      />

      <section className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Incidentes recentes</h2>
        {incidents.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum incidente registrado até o momento.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Título</th>
                  <th className="px-3 py-2">Severidade</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Detectado</th>
                  <th className="px-3 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-gray-700">{incident.titulo}</td>
                    <td className="px-3 py-2 capitalize text-gray-600">{incident.severidade}</td>
                    <td className="px-3 py-2 capitalize text-gray-600">{incident.status}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {new Date(incident.detectedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {incident.status !== 'resolvido' ? (
                        <button
                          className="rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          onClick={() =>
                            resolveIncident.mutate({ id: incident.id, planoAcao: incident.planoAcao ?? undefined })
                          }
                          disabled={resolveIncident.isPending}
                        >
                          Marcar como resolvido
                        </button>
                      ) : (
                        <span className="text-xs text-green-600">Resolvido</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Logs de auditoria</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum log registrado.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {logs.slice(0, 20).map((log) => (
              <li key={log.id} className="rounded border border-gray-200 p-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{new Date(log.recordedAt).toLocaleString()}</span>
                  <span>{log.actor}</span>
                </div>
                <p className="font-medium text-gray-700">{log.acao}</p>
                {log.contexto ? <p className="text-xs text-gray-500">{log.contexto}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {Object.keys(incidentSummary).length > 0 ? (
        <section className="rounded-md border bg-white p-4 shadow">
          <h2 className="text-sm font-semibold text-gray-700">Status geral</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-4">
            {Object.entries(incidentSummary).map(([status, total]) => (
              <div key={status} className="rounded border border-gray-200 p-2 text-center">
                <p className="text-xs uppercase text-gray-500">{status}</p>
                <p className="text-xl font-semibold text-blue-700">{total}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {incidentsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando incidentes...</p> : null}
    </section>
  );
}
