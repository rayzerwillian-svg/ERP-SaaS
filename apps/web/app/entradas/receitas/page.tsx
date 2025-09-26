'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const ReceitaSchema = z.object({
  descricao: z.string().min(1),
  valor: z.number(),
  data: z.string().min(1),
  categoria: z.string().optional(),
});

type ReceitaForm = z.infer<typeof ReceitaSchema>;
type ReceitaRow = ReceitaForm & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<ReceitaRow>[] = [
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

export default function ReceitasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const receitasQuery = useQuery({
    queryKey: ['entradas', 'receitas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ReceitaRow[]>('/entradas/receitas', { token });
    },
    enabled: Boolean(token),
  });

  const createReceita = useMutation({
    mutationFn: async (payload: ReceitaForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ReceitaRow>('/entradas/receitas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entradas', 'receitas'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Entradas - Receitas</h2>
        <p className="text-sm text-gray-600">Registre recebimentos e acompanhe previsões de fluxo.</p>
      </header>

      <SchemaForm
        schema={ReceitaSchema}
        fields={[
          { name: 'descricao', label: 'Descrição' },
          { name: 'valor', label: 'Valor', type: 'number' },
          { name: 'data', label: 'Data', type: 'text', placeholder: '2024-01-15' },
          { name: 'categoria', label: 'Categoria' },
        ]}
        submitLabel={createReceita.isPending ? 'Registrando...' : 'Registrar receita'}
        onSubmit={async (values) => {
          try {
            await createReceita.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[{
          label: 'Otimizar recebimento',
          onInvoke: async () => 'Sugestão: antecipar recebimentos via PIX reduz o ciclo em D+20.',
        }]}
      />

      <DataTable columns={columns} data={receitasQuery.data ?? []} />
      {receitasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando receitas...</p> : null}
    </section>
  );
}
