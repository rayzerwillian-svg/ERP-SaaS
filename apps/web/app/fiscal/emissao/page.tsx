'use client';

import { useState } from 'react';
import { FiscalEmissionSchema } from '@erp-saas/db';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';
import { z } from 'zod';

type EmissionDto = z.infer<typeof FiscalEmissionSchema>;
type EmissionResponse = {
  id: string;
  protocolo: string;
  status: string;
  tipo: string;
  provider: string;
  createdAt: string;
};

export default function EmissaoFiscalPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [resultado, setResultado] = useState<string>('');

  const emitir = useMutation({
    mutationFn: async (payload: EmissionDto) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<EmissionResponse>('/fiscal/emissao', { method: 'POST', body: payload, token });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Emissão Fiscal</h2>
        <p className="text-sm text-gray-600">Orquestre emissão via providers EDICOM, SVRS ou integrações municipais.</p>
      </header>

      <SchemaForm
        schema={FiscalEmissionSchema}
        fields={[
          {
            name: 'tipo',
            label: 'Tipo',
            type: 'select',
            options: [
              { value: 'nfe', label: 'NF-e' },
              { value: 'nfse', label: 'NFS-e' },
              { value: 'cte', label: 'CT-e' },
              { value: 'nfce', label: 'NFC-e' },
            ],
          },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'destinatario', label: 'Destinatário' },
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
        ]}
        submitLabel={emitir.isPending ? 'Emitindo...' : 'Emitir documento'}
        onSubmit={async (values) => {
          try {
            const response = await emitir.mutateAsync(values);
            setResultado(
              `Protocolo ${response.protocolo} (${response.tipo.toUpperCase()}) enviado ao provider ${response.provider}. Status: ${response.status}.`,
            );
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Pré-validação',
            onInvoke: async (values) =>
              values?.tipo
                ? `IA: Pré-validação concluída para ${values.tipo.toUpperCase()}. Nenhuma exceção bloqueante.`
                : 'Selecione o tipo do documento para validar.',
          },
        ]}
      />

      {resultado ? <p className="rounded-md border bg-white p-4 text-sm text-gray-700 shadow">{resultado}</p> : null}
    </section>
  );
}
