'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { DespesaFixaSchema, DespesaFixaInput } from '@erp-saas/db';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '../../components/zod-form';
import { apiFetch } from '../../lib/api-client';

type DespesaFixaRow = DespesaFixaInput & { id: string; createdAt: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<DespesaFixaRow>[] = [
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'descricao', header: 'Descrição' },
  {
    accessorKey: 'valorMensal',
    header: 'Valor Mensal',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  { accessorKey: 'diaVencimento', header: 'Dia Vencimento' },
];

export default function DespesasFixasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const despesasQuery = useQuery({
    queryKey: ['despesas-fixas', 'itens'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaFixaRow[]>('/despesas-fixas', { token });
    },
    enabled: Boolean(token),
  });

  const createDespesa = useMutation({
    mutationFn: async (payload: DespesaFixaInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<DespesaFixaRow>('/despesas-fixas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas', 'itens'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Despesas Fixas</h2>
        <p className="text-sm text-gray-600">Cadastre despesas recorrentes para compor o rateio e DRE.</p>
      </header>

      <SchemaForm
        schema={DespesaFixaSchema}
        fields={[
          { name: 'categoria', label: 'Categoria' },
          { name: 'descricao', label: 'Descrição' },
          { name: 'valorMensal', label: 'Valor Mensal', type: 'number' },
          { name: 'diaVencimento', label: 'Dia Vencimento', type: 'number' },
        ]}
        submitLabel={createDespesa.isPending ? 'Salvando...' : 'Adicionar despesa'}
        onSubmit={async (values) => {
          try {
            await createDespesa.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Classificar gasto',
            onInvoke: async (values) =>
              values?.descricao
                ? `Sugestão: classificar "${values.descricao}" como ${values.categoria || 'Administrativo'}.`
                : 'Informe a descrição para sugerir categoria.',
          },
        ]}
      />

      <DataTable columns={columns} data={despesasQuery.data ?? []} />
      {despesasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando despesas...</p> : null}
    </section>
  );
}
