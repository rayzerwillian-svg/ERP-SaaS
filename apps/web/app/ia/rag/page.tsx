'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '@/components/zod-form';
import { apiFetch } from '@/lib/api-client';

const RagFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(['indexing', 'ready']).default('indexing'),
  description: z.string().optional(),
});

type RagFormValues = z.infer<typeof RagFormSchema>;

type RagCollection = {
  id: string;
  name: string;
  slug: string;
  source: string;
  status: 'indexing' | 'ready';
  description?: string | null;
};

const columns: ColumnDef<RagCollection>[] = [
  { accessorKey: 'name', header: 'Coleção' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'source', header: 'Fonte' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (getValue<string>() === 'ready' ? 'Pronto' : 'Indexando'),
  },
];

export default function RagPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const colecoesQuery = useQuery({
    queryKey: ['ai', 'rag', 'collections'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<RagCollection[]>('/ai/rag/collections', { token });
    },
    enabled: Boolean(token),
  });

  const createCollectionMutation = useMutation({
    mutationFn: async (values: RagFormValues) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<RagCollection>('/ai/rag/collections', {
        method: 'POST',
        body: values,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'rag', 'collections'] });
    },
  });

  const formFields = useMemo(
    () => [
      { name: 'name', label: 'Nome da coleção' },
      { name: 'slug', label: 'Slug', placeholder: 'ex: ncm_br' },
      { name: 'source', label: 'Fonte / Dataset' },
      {
        name: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'indexing', label: 'Indexando' },
          { value: 'ready', label: 'Pronto' },
        ],
      },
      { name: 'description', label: 'Descrição', type: 'textarea' as const },
    ],
    [],
  );

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">RAG Collections</h2>
        <p className="text-sm text-gray-600">Gerencie bases vetoriais (Qdrant/PGVector) para consultas contextuais.</p>
      </header>

      <div className="rounded-md border bg-white p-4 shadow">
        <SchemaForm
          schema={RagFormSchema}
          fields={formFields}
          defaultValues={{ name: '', slug: '', source: '', status: 'indexing', description: '' }}
          onSubmit={async (values) => {
            try {
              await createCollectionMutation.mutateAsync({ ...values, slug: slugify(values.slug || values.name) });
            } catch (error) {
              alert((error as Error).message);
            }
          }}
          submitLabel="Criar coleção"
          aiActions={[
            {
              label: 'Priorizar ingestão',
              onInvoke: async () =>
                'IA sugere indexar guias SPED recentes e notas de serviço municipais para melhorar cobertura fiscal.',
            },
          ]}
        />
        {createCollectionMutation.isPending ? (
          <p className="mt-2 text-sm text-blue-600">Registrando coleção...</p>
        ) : null}
      </div>

      <DataTable columns={columns} data={colecoesQuery.data ?? []} />
      {colecoesQuery.isLoading ? <p className="text-sm text-gray-500">Carregando coleções...</p> : null}
    </section>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
