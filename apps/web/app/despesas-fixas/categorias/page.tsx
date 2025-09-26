'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { z } from 'zod';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

const CategoriaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
});

type Categoria = z.infer<typeof CategoriaSchema> & { id: string; createdAt: string };

export default function CategoriasDespesasFixasPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const categoriasQuery = useQuery({
    queryKey: ['despesas-fixas', 'categorias'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Categoria[]>('/despesas-fixas/categorias', { token });
    },
    enabled: Boolean(token),
  });

  const createCategoria = useMutation({
    mutationFn: async (payload: z.infer<typeof CategoriaSchema>) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Categoria>('/despesas-fixas/categorias', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['despesas-fixas', 'categorias'] });
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Categorias de Despesas Fixas</h2>
        <p className="text-sm text-gray-600">Organize centros de custo para relatórios DRE e projeções.</p>
      </header>

      <SchemaForm
        schema={CategoriaSchema}
        fields={[
          { name: 'nome', label: 'Categoria' },
          { name: 'descricao', label: 'Descrição', type: 'textarea' },
        ]}
        submitLabel={createCategoria.isPending ? 'Salvando...' : 'Adicionar categoria'}
        onSubmit={async (values) => {
          try {
            await createCategoria.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Sugerir agrupamento',
            onInvoke: async (values) =>
              values?.nome
                ? `Agrupar "${values.nome}" a Marketing garante visão consolidada das campanhas.`
                : 'Informe o nome da categoria para sugerir um agrupamento.',
          },
        ]}
      />

      <ul className="grid gap-3">
        {categoriasQuery.data?.map((categoria) => (
          <li key={categoria.id} className="rounded-md border bg-white p-4 shadow">
            <h3 className="font-medium">{categoria.nome}</h3>
            {categoria.descricao ? <p className="text-sm text-gray-600">{categoria.descricao}</p> : null}
            <p className="mt-2 text-xs text-gray-400">
              Criada em {new Date(categoria.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </li>
        ))}
      </ul>
      {categoriasQuery.isLoading ? <p className="text-sm text-gray-500">Carregando categorias...</p> : null}
    </section>
  );
}
