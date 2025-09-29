'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SecuritySettingsSchema } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type SecuritySettingsResponse = z.infer<typeof SecuritySettingsSchema>;

const AdvancedSchema = SecuritySettingsSchema.pick({
  anomalyDetectionEnabled: true,
  wafEnabled: true,
  vulnerabilityScanSchedule: true,
  zeroTrustEnabled: true,
  apiRateLimitPerMinute: true,
  apiTokenRotationDays: true,
}).extend({
  vulnerabilityScanSchedule: z.string().optional(),
});

type AdvancedInput = z.infer<typeof AdvancedSchema>;

export default function SegurancaAvancadaPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['seguranca', 'configuracoes'],
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SecuritySettingsResponse>('/seguranca/configuracoes', { token });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: AdvancedInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SecuritySettingsResponse>('/seguranca/configuracoes', {
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

  const settings = settingsQuery.data;

  const defaultValues: Partial<AdvancedInput> | undefined = settings
    ? {
        anomalyDetectionEnabled: settings.anomalyDetectionEnabled,
        wafEnabled: settings.wafEnabled,
        vulnerabilityScanSchedule: settings.vulnerabilityScanSchedule ?? undefined,
        zeroTrustEnabled: settings.zeroTrustEnabled,
        apiRateLimitPerMinute: settings.apiRateLimitPerMinute,
        apiTokenRotationDays: settings.apiTokenRotationDays,
      }
    : undefined;

  const anomalyStatus = settings
    ? settings.anomalyDetectionEnabled
      ? 'IA de detecção de anomalias ativa 24/7 com alertas automáticos.'
      : 'Ative a detecção de anomalias para reduzir o tempo médio de resposta.'
    : 'Configure IA para monitorar comportamentos suspeitos.';

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Segurança Avançada (API & Cloud)</h1>
        <p className="text-sm text-gray-600">
          Implemente Zero Trust, limite de APIs e scanners automáticos para manter o ERP protegido em ambientes multi-tenant.
        </p>
      </header>

      <SchemaForm
        schema={AdvancedSchema}
        fields={[
          {
            name: 'anomalyDetectionEnabled',
            label: 'Detecção de anomalias com IA',
            type: 'select',
            options: [
              { label: 'Ativado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'wafEnabled',
            label: 'Web Application Firewall (WAF)',
            type: 'select',
            options: [
              { label: 'Ativado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'vulnerabilityScanSchedule',
            label: 'Agenda de scans (ex: semanal, diário)',
            placeholder: 'semanal',
          },
          {
            name: 'zeroTrustEnabled',
            label: 'Zero Trust habilitado',
            type: 'select',
            options: [
              { label: 'Ativado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          { name: 'apiRateLimitPerMinute', label: 'Rate limit API (req/min)', type: 'number' },
          { name: 'apiTokenRotationDays', label: 'Rotação de tokens API (dias)', type: 'number' },
        ]}
        defaultValues={defaultValues}
        submitLabel={updateMutation.isPending ? 'Aplicando...' : 'Aplicar políticas avançadas'}
        onSubmit={async (values) => {
          try {
            await updateMutation.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Otimizar limite de API',
            onInvoke: async (values) =>
              `Limite APIs em ${values.apiRateLimitPerMinute} req/min com rotação a cada ${values.apiTokenRotationDays} dias e WAF ${values.wafEnabled ? 'ativo' : 'pendente'} para mitigar OWASP API Top 10.`,
          },
        ]}
      />

      <div className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Resumo de postura</h2>
        <p className="text-sm text-gray-600">{anomalyStatus}</p>
        {settings?.vulnerabilityScanSchedule ? (
          <p className="text-xs text-gray-500">
            Próximo scan agendado: {settings.vulnerabilityScanSchedule}
          </p>
        ) : null}
      </div>

      {settingsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando configurações avançadas...</p> : null}
    </section>
  );
}
