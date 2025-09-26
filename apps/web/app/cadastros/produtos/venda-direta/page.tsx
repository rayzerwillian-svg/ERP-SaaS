'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ProdutoVendaDiretaSchema, ProdutoVendaDiretaInput } from '@erp-saas/db';
import { DataTable, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp-saas/ui';
import { SchemaForm } from '../../../../components/zod-form';
import { apiFetch } from '../../../../lib/api-client';

type ProdutoVendaDiretaRecord = ProdutoVendaDiretaInput & {
  id: string;
  fornecedor?: { id: string; nome: string | null } | null;
  unidade?: { id: string; sigla: string; descricao: string } | null;
};

type Fornecedor = {
  id: string;
  nome: string;
};

type Unidade = {
  id: string;
  sigla: string;
  descricao: string;
};

const columns: ColumnDef<ProdutoVendaDiretaRecord>[] = [
  { accessorKey: 'codigo', header: 'Código' },
  { accessorKey: 'descricao', header: 'Descrição' },
  {
    accessorKey: 'precoPorUn',
    header: 'Preço/Un',
    cell: ({ getValue }) => `R$ ${Number(getValue<number>()).toFixed(2)}`,
  },
  {
    accessorKey: 'precoPorMedida',
    header: 'Preço/Medida',
    cell: ({ getValue }) => `R$ ${Number(getValue<number>()).toFixed(2)}`,
  },
  {
    id: 'fornecedor',
    header: 'Fornecedor',
    cell: ({ row }) => row.original.fornecedor?.nome ?? '—',
  },
  {
    id: 'unidade',
    header: 'Unidade',
    cell: ({ row }) => row.original.unidade?.sigla ?? '—',
  },
];

export default function ProdutosVendaDiretaPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<ProdutoVendaDiretaInput>>({});

  const produtosQuery = useQuery({
    queryKey: ['cadastros', 'produtos-venda'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ProdutoVendaDiretaRecord[]>('/cadastros/produtos/venda-direta', { token });
    },
    enabled: Boolean(token),
  });

  const fornecedoresQuery = useQuery({
    queryKey: ['cadastros', 'fornecedores'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Fornecedor[]>('/cadastros/fornecedores', { token });
    },
    enabled: Boolean(token),
  });

  const unidadesQuery = useQuery({
    queryKey: ['cadastros', 'unidades-medida'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Unidade[]>('/cadastros/unidades', { token });
    },
    enabled: Boolean(token),
  });

  const createProdutoMutation = useMutation({
    mutationFn: async (payload: ProdutoVendaDiretaInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ProdutoVendaDiretaRecord>('/cadastros/produtos/venda-direta', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadastros', 'produtos-venda'] });
      setDraft({});
    },
  });

  const fornecedorOptions = useMemo(
    () =>
      (fornecedoresQuery.data ?? []).map((fornecedor) => ({
        value: fornecedor.id,
        label: fornecedor.nome,
      })),
    [fornecedoresQuery.data],
  );

  const unidadeOptions = useMemo(
    () =>
      (unidadesQuery.data ?? []).map((unidade) => ({
        value: unidade.id,
        label: `${unidade.sigla} — ${unidade.descricao}`,
      })),
    [unidadesQuery.data],
  );

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Produtos - Venda Direta</h2>
          <p className="text-sm text-gray-600">Cadastre SKUs de revenda com apoio de IA para descrição e preço base.</p>
        </div>
      </header>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="preco">Preço</TabsTrigger>
          <TabsTrigger value="fornecedor">Fornecedor</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">
          <SchemaForm
            schema={ProdutoVendaDiretaSchema.pick({ codigo: true, descricao: true, medida: true })}
            fields={[
              { name: 'codigo', label: 'Código' },
              { name: 'descricao', label: 'Descrição', type: 'textarea' },
              { name: 'medida', label: 'Medida', type: 'number' },
            ]}
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            submitLabel="Salvar dados"
            aiActions={[
              {
                label: 'Enhance descrição',
                onInvoke: async () => 'Descrição otimizada com base em dados de mercado.',
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="preco">
          <SchemaForm
            schema={ProdutoVendaDiretaSchema.pick({ precoPorUn: true, precoPorMedida: true })}
            fields={[
              { name: 'precoPorUn', label: 'Preço por Unidade', type: 'number' },
              { name: 'precoPorMedida', label: 'Preço por Medida', type: 'number' },
            ]}
            submitLabel="Salvar preços"
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            aiActions={[
              {
                label: 'Sugerir preço-base',
                onInvoke: async () => 'Preço sugerido calculado com base no CMV e margem alvo.',
              },
            ]}
          />
        </TabsContent>
        <TabsContent value="fornecedor">
          <SchemaForm
            schema={ProdutoVendaDiretaSchema.pick({ fornecedorId: true, unidadeMedidaId: true, qtdPorEmbalagem: true })}
            fields={[
              {
                name: 'fornecedorId',
                label: 'Fornecedor',
                type: 'select',
                options: fornecedorOptions,
                setValueAs: (value: string) => (value ? value : undefined),
              },
              {
                name: 'unidadeMedidaId',
                label: 'Unidade de Medida',
                type: 'select',
                options: unidadeOptions,
              },
              { name: 'qtdPorEmbalagem', label: 'Qtd. por Embalagem', type: 'number' },
            ]}
            submitLabel="Concluir cadastro"
            onSubmit={async (values) => {
              if (!draft.codigo || !draft.descricao || draft.precoPorUn == null || draft.precoPorMedida == null || !values.unidadeMedidaId) {
                alert('Preencha dados, preços e unidade antes de concluir.');
                return;
              }

              const payload: ProdutoVendaDiretaInput = {
                codigo: draft.codigo,
                descricao: draft.descricao,
                medida: draft.medida ?? 0,
                precoPorUn: draft.precoPorUn ?? 0,
                precoPorMedida: draft.precoPorMedida ?? 0,
                fornecedorId: values.fornecedorId,
                unidadeMedidaId: values.unidadeMedidaId,
                qtdPorEmbalagem: values.qtdPorEmbalagem ?? 0,
              };

              try {
                await createProdutoMutation.mutateAsync(payload);
              } catch (error) {
                alert((error as Error).message);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Catálogo</h3>
        <DataTable columns={columns} data={produtosQuery.data ?? []} />
        {produtosQuery.isLoading ? <p className="text-sm text-gray-500">Carregando produtos...</p> : null}
        {createProdutoMutation.isPending ? <p className="text-sm text-blue-600">Salvando produto...</p> : null}
      </div>
    </section>
  );
}
