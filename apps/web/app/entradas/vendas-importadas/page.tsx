'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const VendaImportadaSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number(),
  data: z.string().min(1),
  categoria: z.string().optional(),
  origem: z.string().min(1),
});

type VendaForm = z.infer<typeof VendaImportadaSchema>;
type VendaRow = VendaForm & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<VendaRow>[] = [
  {
    accessorKey: 'data',
    header: 'Data',
    cell: (info) => new Date(info.getValue<string>()).toLocaleDateString('pt-BR'),
  },
  { accessorKey: 'descricao', header: 'Descrição' },
  { accessorKey: 'origem', header: 'Origem' },
  { accessorKey: 'categoria', header: 'Categoria' },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
];

export default function VendasImportadasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const vendasQuery = useQuery({
    queryKey: ['entradas', 'vendas-importadas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<VendaRow[]>('/ingestao/vendas-importadas', { token });
    },
    enabled: Boolean(token),
  });

  const createVenda = useMutation({
    mutationFn: async (payload: VendaForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<VendaRow>('/ingestao/vendas-importadas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas', 'vendas-importadas'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Vendas Importadas</h2>
        <p className="text-sm text-gray-600">Centralize vendas oriundas de marketplaces e PDVs externos.</p>
      </header>

      <SchemaForm
        schema={VendaImportadaSchema}
        fields={[
          { name: 'descricao', label: 'Descrição' },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'data', label: 'Data', type: 'text', placeholder: '2024-01-15' },
          { name: 'categoria', label: 'Categoria' },
          { name: 'origem', label: 'Origem (sistema)' },
        ]}
        submitLabel={createVenda.isPending ? 'Importando...' : 'Registrar venda'}
        onSubmit={async (values) => {
          try {
            await createVenda.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[{
          label: 'Recomendar canal',
          onInvoke: async () => 'Canal com maior margem: Marketplace A (+12% versus média).',
        }]}
      />

      <DataTable columns={columns} data={vendasQuery.data ?? []} />
      {vendasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando vendas importadas...</p> : null}
    </section>
  );
}
