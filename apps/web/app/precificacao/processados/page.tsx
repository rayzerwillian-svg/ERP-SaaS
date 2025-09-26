'use client';

import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { PrecificacaoProcessadoSchema, PrecificacaoProcessadoInput } from '@erp-saas/db';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '../../../lib/api-client';
import { SchemaForm } from '../../../components/zod-form';

type PrecificacaoProcessadoRow = PrecificacaoProcessadoInput & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<PrecificacaoProcessadoRow>[] = [
  { accessorKey: 'cod', header: 'Código' },
  { accessorKey: 'produto', header: 'Produto' },
  {
    accessorKey: 'precoVendaAtual',
    header: 'Preço Atual',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
  {
    accessorKey: 'margemContribPercentual',
    header: 'Margem %',
    cell: (info) => `${Number(info.getValue<number>() ?? 0).toFixed(2)}%`,
  },
  {
    accessorKey: 'despesasVariaveisPercentual',
    header: 'Despesas Var %',
    cell: (info) => `${Number(info.getValue<number>() ?? 0).toFixed(2)}%`,
  },
];

export default function PrecificacaoProcessadosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const precificacaoQuery = useQuery({
    queryKey: ['precificacao', 'processados'],
    queryFn: async () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<PrecificacaoProcessadoRow[]>('/precificacao/processados', { token });
    },
    enabled: Boolean(token),
  });

  const upsert = useMutation({
    mutationFn: async (payload: PrecificacaoProcessadoInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<PrecificacaoProcessadoRow>('/precificacao/processados', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precificacao', 'processados'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Precificação - Processados</h2>
        <p className="text-sm text-gray-600">Inclua MOD, perdas e markups específicos de produção.</p>
      </header>

      <SchemaForm
        schema={PrecificacaoProcessadoSchema}
        fields={[
          { name: 'cod', label: 'Código' },
          { name: 'produto', label: 'Produto' },
          { name: 'precoVendaAtual', label: 'Preço Venda Atual', type: 'number' },
          { name: 'cmv', label: 'CPV', type: 'number' },
          { name: 'mod', label: 'MOD', type: 'number' },
          { name: 'frete', label: 'Frete', type: 'number' },
          { name: 'custoVariavel', label: 'Custo Variável', type: 'number' },
          { name: 'impostosPerc', label: 'Impostos %', type: 'number' },
          { name: 'impostosValor', label: 'Impostos R$', type: 'number' },
          { name: 'taxaCartaoPerc', label: 'Taxa Cartão %', type: 'number' },
          { name: 'taxaCartaoValor', label: 'Taxa Cartão R$', type: 'number' },
          { name: 'taxaAppPerc', label: 'Taxa App %', type: 'number' },
          { name: 'taxaAppValor', label: 'Taxa App R$', type: 'number' },
          { name: 'comissaoPerc', label: 'Comissão %', type: 'number' },
          { name: 'comissaoValor', label: 'Comissão R$', type: 'number' },
          { name: 'margemContribReais', label: 'Margem Contrib. R$', type: 'number' },
          { name: 'margemContribPercentual', label: 'Margem Contrib. %', type: 'number' },
          { name: 'cpvReais', label: 'CPV R$', type: 'number' },
          { name: 'cpvPercentual', label: 'CPV %', type: 'number' },
          { name: 'modReais', label: 'MOD R$', type: 'number' },
          { name: 'modPercentual', label: 'MOD %', type: 'number' },
          { name: 'custosVariaveisReais', label: 'Custos Var. R$', type: 'number' },
          { name: 'custosVariaveisPercentual', label: 'Custos Var. %', type: 'number' },
          { name: 'despesasVariaveisReais', label: 'Despesas Var. R$', type: 'number' },
          { name: 'despesasVariaveisPercentual', label: 'Despesas Var. %', type: 'number' },
        ]}
        submitLabel="Salvar cenário"
        onSubmit={async (values) => {
          try {
            await upsert.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Sugerir preço alvo',
            onInvoke: async (values) => {
              try {
                if (!token) {
                  throw new Error('Sessão inválida para sugerir preço');
                }
                const custoBase =
                  values.cmv +
                  values.modReais +
                  values.custosVariaveisReais +
                  values.despesasVariaveisReais;
                if (!Number.isFinite(custoBase) || custoBase <= 0) {
                  return 'Informe CPV, MOD e custos variáveis para sugerir preço.';
                }
                const margemDesejada = Number(values.margemContribPercentual ?? 0);
                const resposta = await apiFetch<{ precoSugerido: number }>(`/precificacao/processados/sugerir-preco`, {
                  method: 'POST',
                  body: { custo: custoBase, margemDesejada },
                  token,
                });
                return `Preço sugerido: ${currency.format(resposta.precoSugerido)}`;
              } catch (error) {
                return (error as Error).message;
              }
            },
          },
        ]}
      />

      <DataTable columns={columns} data={precificacaoQuery.data ?? []} />
      {precificacaoQuery.isLoading ? (
        <p className="text-sm text-gray-500">Carregando cenários...</p>
      ) : null}
    </section>
  );
}
