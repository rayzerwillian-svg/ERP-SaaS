'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SecuritySettingsSchema } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type SecuritySettingsResponse = z.infer<typeof SecuritySettingsSchema> & {
  id?: string;
  updatedAt?: string;
  createdAt?: string;
};

const AccessSchema = SecuritySettingsSchema.pick({
  requireMfa: true,
  allowedFactors: true,
  passwordMinLength: true,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSymbol: true,
  passwordRotationDays: true,
  sessionTimeoutMinutes: true,
  sessionMaxDevices: true,
  ssoEnabled: true,
  ssoProvider: true,
}).extend({
  allowedFactors: z.string().min(1),
});

type AccessInput = z.infer<typeof AccessSchema>;

export default function AutenticacaoAcessoPage() {
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
    mutationFn: async (payload: AccessInput) => {
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

  const defaultValues: Partial<AccessInput> | undefined = settings
    ? {
        requireMfa: settings.requireMfa,
        allowedFactors: settings.allowedFactors,
        passwordMinLength: settings.passwordMinLength,
        passwordRequireUppercase: settings.passwordRequireUppercase,
        passwordRequireNumber: settings.passwordRequireNumber,
        passwordRequireSymbol: settings.passwordRequireSymbol,
        passwordRotationDays: settings.passwordRotationDays,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        sessionMaxDevices: settings.sessionMaxDevices,
        ssoEnabled: settings.ssoEnabled,
        ssoProvider: settings.ssoProvider ?? undefined,
      }
    : undefined;

  const mfaSummary = settings
    ? `MFA: ${settings.requireMfa ? 'obrigatório' : 'opcional'} · Fatores: ${settings.allowedFactors}`
    : 'Defina políticas de MFA para todos os usuários.';

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Autenticação e Acesso Seguro</h1>
        <p className="text-sm text-gray-600">
          Configure MFA obrigatório, políticas de senha robustas e integrações SSO alinhadas ao PCI DSS 4.0.
        </p>
      </header>

      <SchemaForm
        schema={AccessSchema}
        fields={[
          {
            name: 'requireMfa',
            label: 'MFA obrigatório',
            type: 'select',
            options: [
              { label: 'Ativado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'allowedFactors',
            label: 'Fatores permitidos',
            type: 'textarea',
            placeholder: 'totp,sms,email,biometria',
          },
          { name: 'passwordMinLength', label: 'Comprimento mínimo da senha', type: 'number' },
          {
            name: 'passwordRequireUppercase',
            label: 'Exigir letras maiúsculas',
            type: 'select',
            options: [
              { label: 'Sim', value: 'true' },
              { label: 'Não', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'passwordRequireNumber',
            label: 'Exigir números',
            type: 'select',
            options: [
              { label: 'Sim', value: 'true' },
              { label: 'Não', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'passwordRequireSymbol',
            label: 'Exigir símbolos',
            type: 'select',
            options: [
              { label: 'Sim', value: 'true' },
              { label: 'Não', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          { name: 'passwordRotationDays', label: 'Rotação de senha (dias)', type: 'number' },
          { name: 'sessionTimeoutMinutes', label: 'Timeout de sessão (minutos)', type: 'number' },
          { name: 'sessionMaxDevices', label: 'Dispositivos simultâneos', type: 'number' },
          {
            name: 'ssoEnabled',
            label: 'SSO habilitado',
            type: 'select',
            options: [
              { label: 'Ativado', value: 'true' },
              { label: 'Desativado', value: 'false' },
            ],
            setValueAs: (value) => value === 'true',
          },
          {
            name: 'ssoProvider',
            label: 'Provider SSO (Okta/Auth0/SAML)',
            placeholder: 'okta | auth0 | saml',
          },
        ]}
        defaultValues={defaultValues}
        submitLabel={updateMutation.isPending ? 'Salvando...' : 'Salvar políticas'}
        onSubmit={async (values) => {
          try {
            await updateMutation.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Sugerir reforço de segurança',
            onInvoke: async (values) =>
              `Reforce MFA exigindo fatores como ${values.allowedFactors} e reduza o timeout de sessão para ${Math.max(
                values.sessionTimeoutMinutes - 5,
                10,
              )} minutos em ambientes críticos.`,
          },
        ]}
      />

      <div className="rounded-md border bg-white p-4 shadow">
        <h2 className="text-sm font-semibold text-gray-700">Resumo atual</h2>
        <p className="text-sm text-gray-600">{mfaSummary}</p>
        {settings?.updatedAt ? (
          <p className="mt-2 text-xs text-gray-500">Última atualização: {new Date(settings.updatedAt).toLocaleString()}</p>
        ) : null}
      </div>

      {settingsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando configurações...</p> : null}
    </section>
  );
}
