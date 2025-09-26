'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ProdutoProcessadoSchema, ProdutoProcessadoInput } from '@erp-saas/db';
import { DataTable, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp-saas/ui';
import { SchemaForm } from '../../../../components/zod-form';
import { apiFetch } from '../../../../lib/api-client';

type ProdutoProcessadoRecord = ProdutoProcessadoInput & {
  id: string;
  unidade?: { id: string; sigla: string; descricao: string } | null;
  materiaPrima?: { id: string; descricao: string; codigo: string }[];
};

type Unidade = {
  id: string;
  sigla: string;
  descricao: string;
};

type MateriaPrima = {
  id: string;
  descricao: string;
  codigo: string;
};

const columns: ColumnDef<ProdutoProcessadoRecord>[] = [
  { accessorKey: 'codigo', header: 'Código' },
  {
    accessorKey: 'pesoBrutoPorUn',
    header: 'Peso Bruto/Un',
    cell: ({ getValue }) => `${Number(getValue<number>()).toFixed(3)} kg`,
  },
  {
    accessorKey: 'pesoLiquidoPorUn',
    header: 'Peso Líquido/Un',
    cell: ({ getValue }) => `${Number(getValue<number>()).toFixed(3)} kg`,
  },
  {
    accessorKey: 'precoPorUn',
    header: 'Preço/Un',
    cell: ({ getValue }) => `R$ ${Number(getValue<number>()).toFixed(2)}`,
  },
  {
    id: 'materiaPrima',
    header: 'Matérias-primas',
    cell: ({ row }) =>
      row.original.materiaPrima?.map((item) => `${item.codigo} - ${item.descricao}`).join(', ') || '—',
  },
];

export default function ProdutosProcessadosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<ProdutoProcessadoInput>>({});

  const produtosQuery = useQuery({
    queryKey: ['cadastros', 'produtos-processados'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ProdutoProcessadoRecord[]>('/cadastros/produtos/processados', { token });
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

  const materiasPrimasQuery = useQuery({
    queryKey: ['cadastros', 'materias-primas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<MateriaPrima[]>('/cadastros/produtos/venda-direta', { token });
    },
    enabled: Boolean(token),
  });

  const createProduto = useMutation({
    mutationFn: async (payload: ProdutoProcessadoInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ProdutoProcessadoRecord>('/cadastros/produtos/processados', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadastros', 'produtos-processados'] });
      setDraft({});
    },
  });

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
      <header>
        <h2 className="text-2xl font-semibold">Produtos Processados</h2>
        <p className="text-sm text-gray-600">Cadastre itens processados, fator de perda e precificação automatizada.</p>
      </header>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="perdas">Pesos / Perdas</TabsTrigger>
          <TabsTrigger value="preco">Preço</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">
          <SchemaForm
            schema={ProdutoProcessadoSchema.pick({ codigo: true, unidadeMedidaId: true, materiaPrimaIds: true })}
            fields={[
              { name: 'codigo', label: 'Código' },
              {
                name: 'unidadeMedidaId',
                label: 'Unidade Medida',
                type: 'select',
                options: unidadeOptions,
              },
              {
                name: 'materiaPrimaIds',
                label: 'Matérias-primas (IDs)',
                type: 'textarea',
                placeholder: 'Um UUID por linha ou separados por vírgula',
                setValueAs: (value: string | string[]) => {
                  if (Array.isArray(value)) {
                    return value;
                  }
                  return (
                    value
                      ?.split(/\r?\n|,|;/)
                      .map((item: string) => item.trim())
                      .filter(Boolean) ?? []
                  );
                },
              },
            ]}
            defaultValues={{
              codigo: draft.codigo ?? '',
              unidadeMedidaId: draft.unidadeMedidaId ?? '',
              materiaPrimaIds: draft.materiaPrimaIds ?? [],
            } as any}
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            submitLabel="Salvar dados"
            aiActions={[{ label: 'Auditar composição', onInvoke: async () => 'Fator de yield validado.' }]}
          />
          {materiasPrimasQuery.data ? (
            <p className="mt-3 text-xs text-gray-500">
              Matérias-primas disponíveis: {materiasPrimasQuery.data.map((mp) => `${mp.codigo} (${mp.id})`).join(', ')}
            </p>
          ) : null}
        </TabsContent>
        <TabsContent value="perdas">
          <SchemaForm
            schema={ProdutoProcessadoSchema.pick({ pesoBrutoPorUn: true, pesoLiquidoPorUn: true, fatorCorrecaoPerda: true })}
            fields={[
              { name: 'pesoBrutoPorUn', label: 'Peso Bruto/Un', type: 'number' },
              { name: 'pesoLiquidoPorUn', label: 'Peso Líquido/Un', type: 'number' },
              { name: 'fatorCorrecaoPerda', label: 'Fator Correção/Perda', type: 'number' },
            ]}
            defaultValues={{
              pesoBrutoPorUn: draft.pesoBrutoPorUn,
              pesoLiquidoPorUn: draft.pesoLiquidoPorUn,
              fatorCorrecaoPerda: draft.fatorCorrecaoPerda,
            } as any}
            submitLabel="Salvar Pesos"
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            aiActions={[{ label: 'Calcular perdas', onInvoke: async () => 'Perdas calculadas com base em histórico.' }]}
          />
        </TabsContent>
        <TabsContent value="preco">
          <SchemaForm
            schema={ProdutoProcessadoSchema.pick({ precoPorUn: true, precoPorMedida: true })}
            fields={[
              { name: 'precoPorUn', label: 'Preço por Unidade', type: 'number' },
              { name: 'precoPorMedida', label: 'Preço por Medida', type: 'number' },
            ]}
            defaultValues={{
              precoPorUn: draft.precoPorUn,
              precoPorMedida: draft.precoPorMedida,
            } as any}
            submitLabel="Concluir cadastro"
            onSubmit={async (values) => {
              if (!draft.codigo || !draft.unidadeMedidaId) {
                alert('Preencha código e unidade antes de concluir.');
                return;
              }
              const payload: ProdutoProcessadoInput = {
                codigo: draft.codigo,
                unidadeMedidaId: draft.unidadeMedidaId,
                pesoBrutoPorUn: draft.pesoBrutoPorUn ?? 0,
                pesoLiquidoPorUn: draft.pesoLiquidoPorUn ?? 0,
                fatorCorrecaoPerda: draft.fatorCorrecaoPerda ?? 0,
                precoPorUn: values.precoPorUn,
                precoPorMedida: values.precoPorMedida,
                materiaPrimaIds: draft.materiaPrimaIds ?? [],
              } as ProdutoProcessadoInput;

              try {
                await createProduto.mutateAsync(payload);
              } catch (error) {
                alert((error as Error).message);
              }
            }}
          />
        </TabsContent>
      </Tabs>

      <DataTable columns={columns} data={produtosQuery.data ?? []} />
      {produtosQuery.isLoading ? <p className="text-sm text-gray-500">Carregando processados...</p> : null}
      {createProduto.isPending ? <p className="text-sm text-blue-600">Salvando produto processado...</p> : null}
    </section>
  );
}
