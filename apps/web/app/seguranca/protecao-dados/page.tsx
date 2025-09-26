'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SecuritySettingsSchema } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type SecuritySettingsResponse = z.infer<typeof SecuritySettingsSchema> & {
  updatedAt?: string;
};

const DataSchema = SecuritySettingsSchema.pick({
  encryptionAtRest: true,
  encryptionInTransit: true,
  encryptionInUse: true,
  keyRotationDays: true,
  dataClassificationMatrix: true,
  dataMaskingPolicies: true,
  logRetentionDays: true,
  complianceContact: true,
  backupFrequencyHours: true,
}).extend({
  dataClassificationMatrix: z.string().optional(),
  dataMaskingPolicies: z.string().optional(),
  complianceContact: z.string().optional(),
});

type DataInput = z.infer<typeof DataSchema>;

export default function ProtecaoDadosPage() {
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
    mutationFn: async (payload: DataInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SecuritySettingsResponse>('/seguranca/configuracoes', {
        method: 'PUT',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seguranca', 'configuracoes'] });
    },
  });

  const settings = settingsQuery.data;

  const defaultValues: Partial<DataInput> | undefined = settings
    ? {
        encryptionAtRest: settings.encryptionAtRest,
        encryptionInTransit: settings.encryptionInTransit,
        encryptionInUse: settings.encryptionInUse,
        keyRotationDays: settings.keyRotationDays,
        dataClassificationMatrix: settings.dataClassificationMatrix ?? undefined,
        dataMaskingPolicies: settings.dataMaskingPolicies ?? undefined,
        logRetentionDays: settings.logRetentionDays,
        complianceContact: settings.complianceContact ?? undefined,
        backupFrequencyHours: settings.backupFrequencyHours,
      }
    : undefined;

  const encryptionSummary = settings
    ? `${settings.encryptionAtRest ? 'Criptografia em repouso ativa' : 'Criptografia em repouso inativa'}, rotação a cada ${settings.keyRotationDays} dias.`
    : 'Habilite criptografia para proteger dados sensíveis.';

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Proteção de Dados e Privacidade</h1>
        <p className="text-sm text-gray-600">
          Garanta conformidade com LGPD e GDPR adotando criptografia ponta a ponta, classificação automática e mascaramento.
        </p>
      </header>

      <SchemaForm
        schema={DataSchema}
        fields={[
          {
            name: 'encryptionAtRest',
            label: 'Criptografia em repouso',
            type: 'select',
            options: [
              { label: 'Ativada (AES-256)', value: 'true' },
              { label: 'Desativada', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'encryptionInTransit',
            label: 'Criptografia em trânsito',
            type: 'select',
            options: [
              { label: 'TLS 1.3 habilitado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'encryptionInUse',
            label: 'Confidencial computing (dados em uso)',
            type: 'select',
            options: [
              { label: 'Proteção ativa', value: 'true' },
              { label: 'Inativo', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          { name: 'keyRotationDays', label: 'Rotação de chaves (dias)', type: 'number' },
          {
            name: 'dataClassificationMatrix',
            label: 'Matriz de classificação de dados',
            type: 'textarea',
            placeholder: 'ex: confidencial|sensível|interno|público',
          },
          {
            name: 'dataMaskingPolicies',
            label: 'Políticas de mascaramento',
            type: 'textarea',
            placeholder: 'Campos mascarados em telas (cartão, CPF, etc.)',
          },
          { name: 'logRetentionDays', label: 'Retenção de logs (dias)', type: 'number' },
          {
            name: 'complianceContact',
            label: 'Contato DPO / Segurança',
            placeholder: 'dpo@empresa.com',
          },
          { name: 'backupFrequencyHours', label: 'Frequência de backup (horas)', type: 'number' },
        ]}
        defaultValues={defaultValues}
        submitLabel={updateMutation.isPending ? 'Salvando...' : 'Salvar proteção'}
        onSubmit={async (values) => {
          try {
            await updateMutation.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Avaliar postura LGPD',
            onInvoke: async (values) =>
              `Para LGPD, mantenha backups a cada ${values.backupFrequencyHours}h, rotação de chaves a cada ${values.keyRotationDays} dias e registre o DPO (${values.complianceContact ?? 'não informado'}).`,
          },
        ]}
      />

      <div className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Estado da criptografia</h2>
        <p className="text-sm text-gray-600">{encryptionSummary}</p>
      </div>

      {settingsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando políticas...</p> : null}
    </section>
  );
}
