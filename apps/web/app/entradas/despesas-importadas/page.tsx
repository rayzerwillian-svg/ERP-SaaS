'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const DespesaImportadaSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number(),
  data: z.string().min(1),
  categoria: z.string().optional(),
  origem: z.string().min(1),
});

type DespesaForm = z.infer<typeof DespesaImportadaSchema>;
type DespesaRow = DespesaForm & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<DespesaRow>[] = [
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

export default function DespesasImportadasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const despesasQuery = useQuery({
    queryKey: ['entradas', 'despesas-importadas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaRow[]>('/ingestao/despesas-importadas', { token });
    },
    enabled: Boolean(token),
  });

  const createDespesa = useMutation({
    mutationFn: async (payload: DespesaForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaRow>('/ingestao/despesas-importadas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas', 'despesas-importadas'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Despesas Importadas</h2>
        <p className="text-sm text-gray-600">Integre despesas de cartões corporativos e ERPs legados.</p>
      </header>

      <SchemaForm
        schema={DespesaImportadaSchema}
        fields={[
          { name: 'descricao', label: 'Descrição' },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'data', label: 'Data', type: 'text', placeholder: '2024-01-15' },
          { name: 'categoria', label: 'Categoria' },
          { name: 'origem', label: 'Origem (fonte)' },
        ]}
        submitLabel={createDespesa.isPending ? 'Importando...' : 'Registrar despesa'}
        onSubmit={async (values) => {
          try {
            await createDespesa.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[{
          label: 'Detectar exceção',
          onInvoke: async () => 'IA sinaliza despesas acima do orçamento em 15% para origem Cartão XPTO.',
        }]}
      />

      <DataTable columns={columns} data={despesasQuery.data ?? []} />
      {despesasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando despesas importadas...</p> : null}
    </section>
  );
}
