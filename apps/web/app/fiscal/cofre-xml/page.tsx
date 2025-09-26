'use client';

import { DataTable } from '@erp-saas/ui';
import { FiscalXmlSchema } from '@erp-saas/db';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type XmlDto = z.infer<typeof FiscalXmlSchema> & {
  id: string;
  chave: string;
  manifestado: boolean;
  createdAt: string;
  updatedAt: string;
  eventos: { id: string; tipo: string; createdAt: string }[];
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

const columns: ColumnDef<XmlDto>[] = [
  { accessorKey: 'cnpj', header: 'CNPJ' },
  { accessorKey: 'modelo', header: 'Modelo' },
  { accessorKey: 'numero', header: 'Número' },
  {
    accessorKey: 'data',
    header: 'Data',
    cell: (info) => dateFormatter.format(new Date(info.getValue<string>())),
  },
  {
    accessorKey: 'manifestado',
    header: 'Manifestado',
    cell: (info) => (info.getValue<boolean>() ? 'Sim' : 'Não'),
  },
  {
    id: 'eventos',
    header: 'Eventos',
    cell: ({ row }) => `${row.original.eventos.length}`,
  },
];

export default function CofreXmlPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const xmlQuery = useQuery({
    queryKey: ['fiscal', 'xml'],
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<XmlDto[]>('/fiscal/xml', { token });
    },
    enabled: Boolean(token),
  });

  const addXml = useMutation({
    mutationFn: async (payload: z.infer<typeof FiscalXmlSchema>) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<XmlDto>('/fiscal/xml', { method: 'POST', body: payload, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal', 'xml'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Cofre de XML</h2>
        <p className="text-sm text-gray-600">Armazene DF-e em bucket WORM com trilha de auditoria e manifestos.</p>
      </header>

      <div className="rounded-md border bg-white p-4 shadow">
        <SchemaForm
          schema={FiscalXmlSchema}
          fields={[
            { name: 'cnpj', label: 'CNPJ' },
            {
              name: 'modelo',
              label: 'Modelo',
              type: 'select',
              options: [
                { value: 'NFe', label: 'NF-e' },
                { value: 'NFSe', label: 'NFS-e' },
                { value: 'NFCe', label: 'NFC-e' },
                { value: 'CTe', label: 'CT-e' },
              ],
            },
            { name: 'serie', label: 'Série' },
            { name: 'numero', label: 'Número' },
            { name: 'data', label: 'Data', type: 'date' },
            { name: 'storageUrl', label: 'URL de armazenamento' },
          ]}
          submitLabel={addXml.isPending ? 'Salvando...' : 'Guardar XML'}
          onSubmit={async (values) => {
            try {
              await addXml.mutateAsync(values);
            } catch (error) {
              alert((error as Error).message);
            }
          }}
          aiActions={[
            {
              label: 'Verificar manifestos',
              onInvoke: async (values) =>
                values?.numero
                  ? `IA: Manifesto pendente para a nota ${values.numero}. Eventos recomendados: Fiscal.XmlRecebido.`
                  : 'Informe o número da nota para analisar manifestos.',
            },
          ]}
        />
      </div>

      <DataTable columns={columns} data={xmlQuery.data ?? []} />
      {xmlQuery.isLoading ? <p className="text-sm text-gray-500">Carregando XMLs...</p> : null}
      {xmlQuery.error ? (
        <p className="text-sm text-red-600">{(xmlQuery.error as Error).message}</p>
      ) : null}
    </section>
  );
}
