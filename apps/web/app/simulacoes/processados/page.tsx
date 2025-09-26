'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { SimulacaoSchema, SimulacaoInput } from '@erp-saas/db';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '../../../lib/api-client';
import { SchemaForm } from '../../../components/zod-form';

type SimulacaoRow = SimulacaoInput & { id: string; tipo: 'revenda' | 'processados' };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<SimulacaoRow>[] = [
  { accessorKey: 'codigo', header: 'Código' },
  { accessorKey: 'produto', header: 'Produto' },
  {
    accessorKey: 'precoPraticado',
    header: 'Preço Praticado',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'margemLucroPercentual',
    header: 'Margem %',
    cell: (info) => `${Number(info.getValue<number>() ?? 0).toFixed(2)}%`,
  },
  {
    accessorKey: 'markupMultiplicador',
    header: 'Markup',
    cell: (info) => Number(info.getValue<number>() ?? 0).toFixed(2),
  },
];

export default function SimulacoesProcessadosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const simulacoesQuery = useQuery({
    queryKey: ['simulacoes', 'processados'],
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SimulacaoRow[]>('/simulacoes/processados', { token });
    },
    enabled: Boolean(token),
  });

  const createSimulacao = useMutation({
    mutationFn: async (payload: SimulacaoInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<SimulacaoRow>('/simulacoes/processados', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacoes', 'processados'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Simulações - Processados</h2>
        <p className="text-sm text-gray-600">Projete cenários de produção, perdas e mix para processados.</p>
      </header>

      <SchemaForm
        schema={SimulacaoSchema}
        fields={[
          { name: 'codigo', label: 'Código' },
          { name: 'produto', label: 'Produto' },
          { name: 'precoPraticado', label: 'Preço Praticado', type: 'number' },
          { name: 'previsaoVendas', label: 'Previsão Vendas', type: 'number' },
          { name: 'faturamentoPrevisto', label: 'Faturamento Previsto', type: 'number' },
          { name: 'custosVariaveis', label: 'Custos Variáveis', type: 'number' },
          { name: 'impostos', label: 'Impostos', type: 'number' },
          { name: 'taxaCartao', label: 'Taxa Cartão', type: 'number' },
          { name: 'taxaApp', label: 'Taxa App', type: 'number' },
          { name: 'comissao', label: 'Comissão', type: 'number' },
          { name: 'margemContribReais', label: 'Margem Contrib. R$', type: 'number' },
          { name: 'margemContribPercentual', label: 'Margem Contrib. %', type: 'number' },
          { name: 'rateioDespesasFixas', label: 'Rateio Despesas Fixas', type: 'number' },
          { name: 'margemLucroReais', label: 'Margem Lucro R$', type: 'number' },
          { name: 'margemLucroPercentual', label: 'Margem Lucro %', type: 'number' },
          { name: 'markupMultiplicador', label: 'Markup', type: 'number' },
          { name: 'percentualMix', label: '% Mix', type: 'number' },
        ]}
        submitLabel="Salvar simulação"
        onSubmit={async (values) => {
          try {
            await createSimulacao.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Gerar cenário A/B',
            onInvoke: async (values) => {
              const custosTotais =
                values.custosVariaveis +
                values.impostos +
                values.taxaCartao +
                values.taxaApp +
                values.comissao +
                values.rateioDespesasFixas;
              if (!Number.isFinite(values.faturamentoPrevisto) || values.faturamentoPrevisto <= 0) {
                return 'Informe faturamento previsto para gerar cenário.';
              }
              const margemPerc = ((values.faturamentoPrevisto - custosTotais) / values.faturamentoPrevisto) * 100;
              return `Otimização de perdas para ${values.percentualMix.toFixed(1)}% do mix gera margem ${margemPerc.toFixed(
                1,
              )}% e faturamento ${currency.format(values.faturamentoPrevisto)}.`;
            },
          },
        ]}
      />

      <DataTable columns={columns} data={simulacoesQuery.data ?? []} />
      {simulacoesQuery.isLoading ? (
        <p className="text-sm text-gray-500">Carregando simulações...</p>
      ) : null}
    </section>
  );
}
