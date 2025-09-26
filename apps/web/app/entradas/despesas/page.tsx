'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const DespesaSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number(),
  data: z.string().min(1),
  categoria: z.string().optional(),
});

type DespesaForm = z.infer<typeof DespesaSchema>;
type DespesaRow = DespesaForm & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<DespesaRow>[] = [
  {
    accessorKey: 'data',
    header: 'Data',
    cell: (info) => new Date(info.getValue<string>()).toLocaleDateString('pt-BR'),
  },
  { accessorKey: 'descricao', header: 'Descrição' },
  { accessorKey: 'categoria', header: 'Categoria' },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
];

export default function DespesasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const despesasQuery = useQuery({
    queryKey: ['entradas', 'despesas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaRow[]>('/entradas/despesas', { token });
    },
    enabled: Boolean(token),
  });

  const createDespesa = useMutation({
    mutationFn: async (payload: DespesaForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaRow>('/entradas/despesas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas', 'despesas'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Entradas - Despesas</h2>
        <p className="text-sm text-gray-600">Lance despesas operacionais para alimentar o fluxo de caixa.</p>
      </header>

      <SchemaForm
        schema={DespesaSchema}
        fields={[
          { name: 'descricao', label: 'Descrição' },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'data', label: 'Data', type: 'text', placeholder: '2024-01-15' },
          { name: 'categoria', label: 'Categoria' },
        ]}
        submitLabel={createDespesa.isPending ? 'Registrando...' : 'Registrar despesa'}
        onSubmit={async (values) => {
          try {
            await createDespesa.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[{
          label: 'Reduzir gasto',
          onInvoke: async () => 'Sugestão: renegociar contratos para reduzir despesas em 8%.',
        }]}
      />

      <DataTable columns={columns} data={despesasQuery.data ?? []} />
      {despesasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando despesas...</p> : null}
    </section>
  );
}
