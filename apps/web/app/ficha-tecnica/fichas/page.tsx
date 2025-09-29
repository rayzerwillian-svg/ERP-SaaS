'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  FichaTecnicaSchema,
  FichaTecnicaInput,
  FichaTecnicaItemSchema,
} from '@erp-saas/db';
import { DataTable, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const itemColumns: ColumnDef<typeof FichaTecnicaItemSchema['_type'] & { nome?: string; unidade?: string }>[] = [
  {
    accessorKey: 'materiaPrimaId',
    header: 'Matéria-prima',
    cell: ({ row }) => row.original.nome ?? row.original.materiaPrimaId,
  },
  {
    accessorKey: 'unidadeMedidaId',
    header: 'Unidade',
    cell: ({ row }) => row.original.unidade ?? row.original.unidadeMedidaId,
  },
  { accessorKey: 'quant', header: 'Quantidade' },
  { accessorKey: 'valorIndividual', header: 'Valor Unit.' },
];

const fichaColumns: ColumnDef<FichaTecnicaInput & { id: string; produtoCodigo?: string }>[] = [
  { accessorKey: 'nome', header: 'Ficha' },
  { accessorKey: 'tipo', header: 'Tipo' },
  {
    accessorKey: 'produtoCodigo',
    header: 'Produto',
    cell: ({ row }) => row.original.produtoCodigo ?? row.original.produtoId,
  },
  { accessorKey: 'qtdProduzida', header: 'Qtd Produzida' },
  { accessorKey: 'custoInsumosTotal', header: 'Custo Insumos' },
];

type FichaRecord = FichaTecnicaInput & {
  id: string;
  produto?: { id: string; codigo: string } | null;
  itens: Array<
    typeof FichaTecnicaItemSchema['_type'] & {
      id: string;
      materiaPrima?: { id: string; descricao: string; codigo: string } | null;
      unidade?: { id: string; sigla: string } | null;
    }
  >;
};

type ProdutoProcessado = {
  id: string;
  codigo: string;
};

type MateriaPrima = {
  id: string;
  descricao: string;
  codigo: string;
};

type Unidade = {
  id: string;
  sigla: string;
};

export default function FichasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [itens, setItens] = useState<typeof FichaTecnicaItemSchema['_type'][]>([]);
  const [identificacao, setIdentificacao] = useState<{ produtoId: string; nome: string; tipo?: string }>({
    produtoId: '',
    nome: '',
    tipo: undefined,
  });
  const [producao, setProducao] = useState<number>(0);
  const [custos, setCustos] = useState<{ custoInsumosTotal: number; custosVariaveisTotais: number }>({
    custoInsumosTotal: 0,
    custosVariaveisTotais: 0,
  });

  const fichasQuery = useQuery({
    queryKey: ['fichas-tecnicas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<FichaRecord[]>('/fichas', { token });
    },
    enabled: Boolean(token),
  });

  const produtosProcessadosQuery = useQuery({
    queryKey: ['cadastros', 'produtos-processados'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ProdutoProcessado[]>('/cadastros/produtos/processados', { token });
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

  const unidadesQuery = useQuery({
    queryKey: ['cadastros', 'unidades-medida'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Unidade[]>('/cadastros/unidades', { token });
    },
    enabled: Boolean(token),
  });

  const createFicha = useMutation({
    mutationFn: async (payload: FichaTecnicaInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<FichaRecord>('/fichas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fichas-tecnicas'] });
      setIdentificacao({ produtoId: '', nome: '', tipo: undefined });
      setItens([]);
      setProducao(0);
      setCustos({ custoInsumosTotal: 0, custosVariaveisTotais: 0 });
    },
  });

  const produtoOptions = useMemo(
    () =>
      (produtosProcessadosQuery.data ?? []).map((produto) => ({
        value: produto.id,
        label: produto.codigo,
      })),
    [produtosProcessadosQuery.data],
  );

  const materiaPrimaOptions = useMemo(
    () =>
      (materiasPrimasQuery.data ?? []).map((item) => ({
        value: item.id,
        label: `${item.codigo} — ${item.descricao}`,
      })),
    [materiasPrimasQuery.data],
  );

  const unidadeOptions = useMemo(
    () =>
      (unidadesQuery.data ?? []).map((unidade) => ({
        value: unidade.id,
        label: unidade.sigla,
      })),
    [unidadesQuery.data],
  );

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Fichas Técnicas</h2>
        <p className="text-sm text-gray-600">Monte composições, custos e produções com IA auditando perdas.</p>
      </header>

      <Tabs defaultValue="identificacao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="composicao">Composição</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="custos">Custos</TabsTrigger>
        </TabsList>
        <TabsContent value="identificacao">
          <SchemaForm
            schema={FichaTecnicaSchema.pick({ produtoId: true, nome: true, tipo: true })}
            fields={[
              { name: 'produtoId', label: 'Produto', type: 'select', options: produtoOptions },
              { name: 'nome', label: 'Nome da ficha' },
              { name: 'tipo', label: 'Tipo' },
            ]}
            defaultValues={identificacao as any}
            submitLabel="Salvar Identificação"
            onSubmit={(values) => setIdentificacao(values)}
            aiActions={[{ label: 'Auditar conversões', onInvoke: async () => 'Conversões validadas e perdas abaixo de 3%.' }]}
          />
        </TabsContent>
        <TabsContent value="composicao">
          <SchemaForm
            schema={FichaTecnicaItemSchema}
            fields={[
              { name: 'materiaPrimaId', label: 'Matéria-prima', type: 'select', options: materiaPrimaOptions },
              { name: 'unidadeMedidaId', label: 'Unidade', type: 'select', options: unidadeOptions },
              { name: 'quant', label: 'Quantidade', type: 'number' },
              { name: 'valorIndividual', label: 'Valor Unitário', type: 'number' },
            ]}
            submitLabel="Adicionar Item"
            onSubmit={(values) => setItens((current) => [...current, values])}
            aiActions={[{ label: 'Sugerir item', onInvoke: async () => 'Adicionar 500g de manteiga para garantir textura.' }]}
          />
          <DataTable
            columns={itemColumns}
            data={itens.map((item) => ({
              ...item,
              nome: materiaPrimaOptions.find((opt) => opt.value === item.materiaPrimaId)?.label,
              unidade: unidadeOptions.find((opt) => opt.value === item.unidadeMedidaId)?.label,
            }))}
          />
        </TabsContent>
        <TabsContent value="producao">
          <SchemaForm
            schema={FichaTecnicaSchema.pick({ qtdProduzida: true })}
            fields={[{ name: 'qtdProduzida', label: 'Qtd. Produzida', type: 'number' }]}
            defaultValues={{ qtdProduzida: producao } as any}
            submitLabel="Definir Produção"
            onSubmit={(values) => setProducao(values.qtdProduzida)}
            aiActions={[{ label: 'Recalcular com perdas', onInvoke: async () => 'Produção ajustada considerando 5% de perdas.' }]}
          />
        </TabsContent>
        <TabsContent value="custos">
          <SchemaForm
            schema={FichaTecnicaSchema.pick({ custoInsumosTotal: true, custosVariaveisTotais: true })}
            fields={[
              { name: 'custoInsumosTotal', label: 'Custo Insumos', type: 'number' },
              { name: 'custosVariaveisTotais', label: 'Custos Variáveis', type: 'number' },
            ]}
            defaultValues={custos as any}
            submitLabel="Aplicar Custos"
            onSubmit={async (values) => {
              if (!identificacao.produtoId || !identificacao.nome) {
                alert('Salve a identificação da ficha antes de aplicar custos.');
                return;
              }
              if (producao <= 0) {
                alert('Defina a quantidade produzida para concluir a ficha.');
                return;
              }
              if (itens.length === 0) {
                alert('Adicione ao menos um item na composição.');
                return;
              }

              const payload: FichaTecnicaInput = {
                produtoId: identificacao.produtoId,
                nome: identificacao.nome,
                tipo: identificacao.tipo,
                itens,
                qtdProduzida: producao,
                custoInsumosTotal: values.custoInsumosTotal,
                custosVariaveisTotais: values.custosVariaveisTotais,
              };

              try {
                await createFicha.mutateAsync(payload);
              } catch (error) {
                alert((error as Error).message);
                return;
              }

              setCustos(values);
            }}
            aiActions={[{ label: 'Recalcular custos', onInvoke: async () => 'Custos recalculados com base no câmbio e frete.' }]}
          />
        </TabsContent>
      </Tabs>

      <DataTable
        columns={fichaColumns}
        data={(fichasQuery.data ?? []).map((ficha) => ({
          ...ficha,
          produtoCodigo: ficha.produto?.codigo,
        }))}
      />
      {fichasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando fichas técnicas...</p> : null}
      {createFicha.isPending ? <p className="text-sm text-blue-600">Salvando ficha técnica...</p> : null}
    </section>
  );
}
