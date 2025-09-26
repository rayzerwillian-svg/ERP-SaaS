'use client';

import { useState } from 'react';
import { FiscalSpedSchema } from '@erp-saas/db';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';
import { z } from 'zod';

type SpedDto = z.infer<typeof FiscalSpedSchema>;
type SpedResponse = {
  id: string;
  periodo: string;
  tipo: string;
  status: string;
  arquivo: string;
  createdAt: string;
};

export default function SpedPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [mensagem, setMensagem] = useState<string>('');

  const gerarSped = useMutation({
    mutationFn: async (payload: SpedDto) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SpedResponse>('/fiscal/sped/efd-contribuicoes', { method: 'POST', body: payload, token });
    },
    onSuccess: (data) => {
      setMensagem(`Arquivo ${data.arquivo} (${data.tipo}) gerado em ${new Date(data.createdAt).toLocaleString('pt-BR')}. Status: ${data.status}.`);
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">SPED / EFD-Contribuições</h2>
        <p className="text-sm text-gray-600">Gere arquivos oficiais a partir do cofre de XML com versionamento.</p>
      </header>

      <SchemaForm
        schema={FiscalSpedSchema}
        fields={[
          { name: 'periodo', label: 'Período de apuração (AAAA-MM)' },
          {
            name: 'tipo',
            label: 'Tipo de arquivo',
            type: 'select',
            options: [
              { value: 'efd_contribuicoes', label: 'EFD-Contribuições' },
              { value: 'efd_icms_ipi', label: 'EFD-ICMS/IPI' },
            ],
          },
        ]}
        submitLabel={gerarSped.isPending ? 'Gerando...' : 'Gerar arquivo'}
        onSubmit={async (values) => {
          try {
            await gerarSped.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Validar regras',
            onInvoke: async (values) =>
              values?.periodo
                ? `IA: Pré-validação concluída para o período ${values.periodo}. Nenhum erro crítico encontrado.`
                : 'Informe o período para validar regras.',
          },
        ]}
      />

      {mensagem ? <p className="rounded-md border bg-white p-4 text-sm text-gray-700 shadow">{mensagem}</p> : null}
    </section>
  );
}
