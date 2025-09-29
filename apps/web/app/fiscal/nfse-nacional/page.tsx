'use client';

import { useState } from 'react';
import { FiscalNfseConfigSchema } from '@erp-saas/db';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';
import { z } from 'zod';

type NfseDto = z.infer<typeof FiscalNfseConfigSchema>;
type NfseResponse = NfseDto & { updatedAt?: string };

export default function NfseNacionalPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [mensagem, setMensagem] = useState<string>('');

  const configQuery = useQuery({
    queryKey: ['fiscal', 'nfse-config'],
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<NfseResponse>('/fiscal/nfse-nacional/config', { token });
    },
    enabled: Boolean(token),
  });

  const salvarConfig = useMutation({
    mutationFn: async (payload: NfseDto) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<NfseResponse>('/fiscal/nfse-nacional/config', { method: 'PUT', body: payload, token });
    },
    onSuccess: (data) => {
      setMensagem(`Configuração ${data.perfil} salva para ${data.municipio}. Última atualização: ${new Date(data.updatedAt ?? Date.now()).toLocaleString('pt-BR')}.`);
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">NFS-e Nacional (pré-2026)</h2>
        <p className="text-sm text-gray-600">Prepare credenciais, perfis e testes para a plataforma nacional.</p>
      </header>

      <SchemaForm
        schema={FiscalNfseConfigSchema}
        defaultValues={configQuery.data as Partial<NfseDto>}
        fields={[
          {
            name: 'ambiente',
            label: 'Ambiente',
            type: 'select',
            options: [
              { value: 'homologacao', label: 'Homologação' },
              { value: 'producao', label: 'Produção' },
            ],
          },
          { name: 'municipio', label: 'Município habilitado' },
          {
            name: 'perfil',
            label: 'Perfil',
            type: 'select',
            options: [
              { value: 'provisorio', label: 'Provisório' },
              { value: 'definitivo', label: 'Definitivo' },
            ],
          },
          {
            name: 'provider',
            label: 'Provider',
            type: 'select',
            options: [
              { value: 'edicom', label: 'EDICOM' },
              { value: 'svrs_direct', label: 'SVRS Direct' },
              { value: 'municipal_legacy', label: 'Municipal Legacy' },
            ],
          },
          { name: 'usuario', label: 'Usuário / Client ID' },
          { name: 'senha', label: 'Senha / Client Secret', type: 'password' },
          { name: 'certificado', label: 'Certificado (path ou thumbprint)' },
        ]}
        submitLabel={salvarConfig.isPending ? 'Salvando...' : 'Salvar configuração'}
        onSubmit={async (values) => {
          try {
            await salvarConfig.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Checklist LGPD',
            onInvoke: async (values) =>
              values?.municipio
                ? `IA: Tokens rotacionados e logs mascarados para ${values.municipio} por 90 dias.`
                : 'Informe o município para gerar checklist LGPD.',
          },
        ]}
      />

      {configQuery.isLoading ? <p className="text-sm text-gray-500">Carregando configuração atual...</p> : null}
      {configQuery.error ? (
        <p className="text-sm text-red-600">{(configQuery.error as Error).message}</p>
      ) : null}
      {mensagem ? <p className="rounded-md border bg-white p-4 text-sm text-gray-700 shadow">{mensagem}</p> : null}
    </section>
  );
}
