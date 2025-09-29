'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AnaliseSchema, AnaliseInput } from '@erp-saas/db';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '../../../lib/api-client';
import { SchemaForm } from '../../../components/zod-form';

type AnaliseRow = AnaliseInput & { id: string; tipo: 'revenda' | 'processados' };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<AnaliseRow>[] = [
  { accessorKey: 'produtoId', header: 'Produto' },
  {
    accessorKey: 'precoVenda',
    header: 'Preço Venda',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'custoProduto',
    header: 'Custo Produto',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'margemLucro',
    header: 'Margem R$',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'precoSugerido',
    header: 'Preço Sugerido',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
];

export default function AnalisesProcessadosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const analisesQuery = useQuery({
    queryKey: ['analises', 'processados'],
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<AnaliseRow[]>('/analises/processados', { token });
    },
    enabled: Boolean(token),
  });

  const createAnalise = useMutation({
    mutationFn: async (payload: AnaliseInput) => {
      if (!token) throw new Error('Sessão inválida');
      const custoBase =
        payload.custoProduto +
        payload.despesasVariaveis +
        payload.frete +
        payload.impostos +
        payload.taxaMaquina +
        payload.taxaApp +
        payload.comissao +
        payload.rateioFixas;
      const { precoSugerido } = await apiFetch<{ precoSugerido: number }>(`/precificacao/processados/sugerir-preco`, {
        method: 'POST',
        body: {
          custo: custoBase,
          margemDesejada: payload.lucroDesejadoPercentual,
        },
        token,
      });
      return apiFetch<AnaliseRow>('/analises/processados', {
        method: 'POST',
        body: { ...payload, precoSugerido },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analises', 'processados'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Análises - Processados</h2>
        <p className="text-sm text-gray-600">Compreenda custos de produção, markup e preço sugerido.</p>
      </header>

      <SchemaForm
        schema={AnaliseSchema}
        fields={[
          { name: 'produtoId', label: 'Produto (UUID)' },
          { name: 'precoVenda', label: 'Preço Venda', type: 'number' },
          { name: 'custosVariaveis', label: 'Custos Variáveis', type: 'number' },
          { name: 'custoProduto', label: 'Custo Produto', type: 'number' },
          { name: 'frete', label: 'Frete', type: 'number' },
          { name: 'despesasVariaveis', label: 'Despesas Variáveis', type: 'number' },
          { name: 'impostos', label: 'Impostos', type: 'number' },
          { name: 'taxaMaquina', label: 'Taxa Máquina', type: 'number' },
          { name: 'taxaApp', label: 'Taxa App', type: 'number' },
          { name: 'comissao', label: 'Comissão', type: 'number' },
          { name: 'margemContrib', label: 'Margem Contribuição', type: 'number' },
          { name: 'rateioFixas', label: 'Rateio Fixas', type: 'number' },
          { name: 'margemLucro', label: 'Margem Lucro R$', type: 'number' },
          { name: 'markup', label: 'Markup', type: 'number' },
          { name: 'lucroDesejadoPercentual', label: 'Lucro Desejado %', type: 'number' },
          { name: 'precoSugerido', label: 'Preço Sugerido', type: 'number' },
        ]}
        submitLabel="Salvar análise"
        onSubmit={async (values) => {
          try {
            await createAnalise.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Narrativa executiva',
            onInvoke: async (values) => {
              const markup = Number(values.markup.toFixed(2));
              return `Processado ${values.produtoId} opera com markup ${markup} e lucro ${currency.format(
                values.margemLucro,
              )} após despesas variáveis.`;
            },
          },
        ]}
      />

      <DataTable columns={columns} data={analisesQuery.data ?? []} />
      {analisesQuery.isLoading ? (
        <p className="text-sm text-gray-500">Carregando análises...</p>
      ) : null}
    </section>
  );
}
