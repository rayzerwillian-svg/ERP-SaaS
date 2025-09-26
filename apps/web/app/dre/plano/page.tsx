'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const PlanoSchema = z.object({
  codigo: z.string().min(1),
  nome: z.string().min(1),
  tipo: z.string().min(1),
  categoria: z.string().optional(),
  subcategoria: z.string().optional(),
});

type PlanoForm = z.infer<typeof PlanoSchema>;
type PlanoRow = PlanoForm & { id: string };

const columns: ColumnDef<PlanoRow>[] = [
  { accessorKey: 'codigo', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'tipo', header: 'Tipo' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'subcategoria', header: 'Subcategoria' },
];

export default function PlanoDREPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const planoQuery = useQuery({
    queryKey: ['dre', 'plano'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<PlanoRow[]>('/dre/plano', { token });
    },
    enabled: Boolean(token),
  });

  const createPlano = useMutation({
    mutationFn: async (payload: PlanoForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<PlanoRow>('/dre/plano', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dre', 'plano'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Plano DRE</h2>
        <p className="text-sm text-gray-600">Estruture contas de resultado por tipo, categoria e subcategoria.</p>
      </header>

      <SchemaForm
        schema={PlanoSchema}
        fields={[
          { name: 'codigo', label: 'Código' },
          { name: 'nome', label: 'Nome' },
          {
            name: 'tipo',
            label: 'Tipo',
            type: 'select',
            options: [
              { label: 'Receita', value: 'receita' },
              { label: 'Custo', value: 'custo' },
              { label: 'Despesa', value: 'despesa' },
            ],
          },
          { name: 'categoria', label: 'Categoria' },
          { name: 'subcategoria', label: 'Subcategoria' },
        ]}
        submitLabel={createPlano.isPending ? 'Salvando...' : 'Adicionar conta'}
        onSubmit={async (values) => {
          try {
            await createPlano.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[{
          label: 'Sugerir estrutura',
          onInvoke: async (values) =>
            values?.tipo
              ? `Separar ${values.tipo} em contas operacionais e não-operacionais facilita a análise.`
              : 'Selecione um tipo para receber sugestões de estrutura.',
        }]}
      />

      <DataTable columns={columns} data={planoQuery.data ?? []} />
      {planoQuery.isLoading ? <p className="text-sm text-gray-500">Carregando plano...</p> : null}
    </section>
  );
}
