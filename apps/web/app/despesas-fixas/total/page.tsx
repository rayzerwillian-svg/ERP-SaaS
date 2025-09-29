'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { DespesaFixaSchema, DespesaFixaInput } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type Despesa = DespesaFixaInput & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TotalDespesasFixasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const despesasQuery = useQuery({
    queryKey: ['despesas-fixas', 'itens'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Despesa[]>('/despesas-fixas', { token });
    },
    enabled: Boolean(token),
  });

  const totalQuery = useQuery({
    queryKey: ['despesas-fixas', 'total'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<{ total: number }>('/despesas-fixas/total', { token });
    },
    enabled: Boolean(token),
  });

  const createDespesa = useMutation({
    mutationFn: async (payload: DespesaFixaInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Despesa>('/despesas-fixas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas', 'itens'] });
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas', 'total'] });
    },
  });

  const total = totalQuery.data?.total ?? 0;

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Total de Despesas Fixas</h2>
        <p className="text-sm text-gray-600">Consolide o orçamento mensal e acompanhe rateios por categoria.</p>
      </header>

      <div className="rounded-md border bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Total mensal</p>
        <p className="text-3xl font-semibold text-blue-600">{currency.format(total)}</p>
      </div>

      <SchemaForm
        schema={DespesaFixaSchema}
        fields={[
          { name: 'categoria', label: 'Categoria' },
          { name: 'descricao', label: 'Descrição' },
          { name: 'valorMensal', label: 'Valor Mensal', type: 'number' },
          { name: 'diaVencimento', label: 'Dia Vencimento', type: 'number' },
        ]}
        submitLabel={createDespesa.isPending ? 'Salvando...' : 'Adicionar ao total'}
        onSubmit={async (values) => {
          try {
            await createDespesa.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Otimizar rateio',
            onInvoke: async () => 'Sugestão: alocar 40% para administrativo e 60% para operações.',
          },
        ]}
      />

      <ul className="grid gap-3">
        {despesasQuery.data?.map((despesa) => (
          <li key={despesa.id} className="rounded-md border bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{despesa.descricao}</p>
                <p className="text-xs text-gray-500">
                  Categoria: {despesa.categoria} • Vencimento: dia {despesa.diaVencimento}
                </p>
              </div>
              <p className="font-semibold text-blue-700">{currency.format(despesa.valorMensal)}</p>
            </div>
          </li>
        ))}
      </ul>
      {(despesasQuery.isLoading || totalQuery.isLoading) ? (
        <p className="text-sm text-gray-500">Carregando dados de despesas...</p>
      ) : null}
    </section>
  );
}
