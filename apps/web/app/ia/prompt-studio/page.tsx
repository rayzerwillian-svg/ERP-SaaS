'use client';

import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { PromptDefinitionInput } from '@erp-saas/db';
import { DataTable } from '@erp-saas/ui';
import { SchemaForm } from '@/components/zod-form';
import { apiFetch } from '@/lib/api-client';

const PromptFormSchema = z.object({
  name: z.string().min(1),
  scope: z.enum(['global', 'modulo', 'role']).default('modulo'),
  entities: z.string().optional(),
  output: z.enum(['text', 'json']).default('json'),
  model: z.string().min(1).default('gpt-4o-mini'),
  mode: z.enum(['text', 'json']).default('json'),
  temperature: z.number().min(0).max(2).default(0.2),
  ragCollections: z.string().optional(),
  tools: z.string().optional(),
  ownerRole: z.string().min(1).default('fiscal'),
  reviewers: z.string().optional(),
  version: z.string().min(1).default('1.0.0'),
  status: z.enum(['draft', 'approved', 'published']).default('draft'),
});

type PromptFormValues = z.infer<typeof PromptFormSchema>;

type PromptRecord = {
  id: string;
  name: string;
  scope: 'global' | 'modulo' | 'role';
  entities: string[];
  output: 'text' | 'json';
  llmPreset: { model: string; mode: 'text' | 'json'; temperature: number };
  ragCollections: string[];
  tools?: string[];
  version: string;
  ownerRole: string;
  reviewers: string[];
  status: 'draft' | 'approved' | 'published';
  updatedAt?: string | Date;
};

const columns: ColumnDef<PromptRecord>[] = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'scope', header: 'Escopo' },
  { accessorKey: 'output', header: 'Output' },
  {
    id: 'model',
    header: 'Modelo',
    cell: ({ row }) => `${row.original.llmPreset.model} (${row.original.llmPreset.mode})`,
  },
  {
    accessorKey: 'ownerRole',
    header: 'Owner',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'colecoes',
    header: 'Coleções RAG',
    cell: ({ row }) => (row.original.ragCollections?.length ? row.original.ragCollections.join(', ') : '—'),
  },
];

export default function PromptStudioPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const promptsQuery = useQuery({
    queryKey: ['ai', 'prompts'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<PromptRecord[]>('/ai/prompt-studio', { token });
    },
    enabled: Boolean(token),
  });

  const createPromptMutation = useMutation({
    mutationFn: async (values: PromptFormValues) => {
      if (!token) throw new Error('Sessão inválida');
      const payload = promptFormToPayload(values);
      return apiFetch<PromptRecord>('/ai/prompt-studio', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'prompts'] });
    },
  });

  const handleAiChecklist = async (values: PromptFormValues) => {
    if (!token) return 'Sessão inválida';
    const prompt = `Revise o prompt "${values.name}" e informe riscos de política e dados sensíveis.`;
    try {
      const result = await apiFetch<{ text?: string }>(
        '/ai/complete',
        {
          method: 'POST',
          token,
          body: {
            model: values.model,
            mode: 'text',
            prompt,
            context: { metadata: { scope: values.scope, ownerRole: values.ownerRole } },
            rag: { collections: split(values.ragCollections) },
          },
        },
      );
      return result.text ?? 'Checklist executado com sucesso.';
    } catch (error) {
      return (error as Error).message;
    }
  };

  const formFields = useMemo(() => {
    return [
      { name: 'name', label: 'Nome' },
      {
        name: 'scope',
        label: 'Escopo',
        type: 'select' as const,
        options: [
          { value: 'global', label: 'Global' },
          { value: 'modulo', label: 'Módulo' },
          { value: 'role', label: 'Role' },
        ],
      },
      { name: 'entities', label: 'Entidades (separadas por vírgula)' },
      {
        name: 'output',
        label: 'Output',
        type: 'select' as const,
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'text', label: 'Texto' },
        ],
      },
      { name: 'model', label: 'Modelo' },
      {
        name: 'mode',
        label: 'Modo do Modelo',
        type: 'select' as const,
        options: [
          { value: 'json', label: 'JSON' },
          { value: 'text', label: 'Texto' },
        ],
      },
      { name: 'temperature', label: 'Temperatura', type: 'number' as const },
      { name: 'ragCollections', label: 'Coleções RAG' },
      { name: 'tools', label: 'Ferramentas (IDs separados por vírgula)' },
      { name: 'ownerRole', label: 'Role responsável' },
      { name: 'reviewers', label: 'Revisores (roles)' },
      { name: 'version', label: 'Versão' },
      {
        name: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { value: 'draft', label: 'Rascunho' },
          { value: 'approved', label: 'Aprovado' },
          { value: 'published', label: 'Publicado' },
        ],
      },
    ];
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Prompt Studio</h2>
        <p className="text-sm text-gray-600">Projete prompts com políticas, coleções RAG e revisão colaborativa.</p>
      </header>

      <div className="rounded-md border bg-white p-4 shadow">
        <SchemaForm
          schema={PromptFormSchema}
          fields={formFields}
          defaultValues={{
            name: '',
            scope: 'modulo',
            entities: '',
            output: 'json',
            model: 'gpt-4o-mini',
            mode: 'json',
            temperature: 0.2,
            ragCollections: '',
            tools: '',
            ownerRole: 'fiscal',
            reviewers: '',
            version: '1.0.0',
            status: 'draft',
          }}
          onSubmit={async (values) => {
            try {
              await createPromptMutation.mutateAsync(values);
            } catch (error) {
              alert((error as Error).message);
            }
          }}
          submitLabel="Criar prompt"
          aiActions={[
            {
              label: 'Checklist de política',
              onInvoke: handleAiChecklist,
            },
          ]}
        />
        {createPromptMutation.isPending ? (
          <p className="mt-2 text-sm text-blue-600">Salvando prompt...</p>
        ) : null}
      </div>

      <DataTable columns={columns} data={promptsQuery.data ?? []} />
      {promptsQuery.isLoading ? <p className="text-sm text-gray-500">Carregando prompts...</p> : null}
    </section>
  );
}

function promptFormToPayload(values: PromptFormValues): PromptDefinitionInput {
  return {
    name: values.name,
    scope: values.scope,
    entities: split(values.entities),
    inputs: {},
    output: values.output,
    llmPreset: {
      model: values.model,
      mode: values.mode,
      temperature: values.temperature,
    },
    ragCollections: split(values.ragCollections),
    tools: split(values.tools),
    policy: undefined,
    version: values.version,
    ownerRole: values.ownerRole,
    reviewers: split(values.reviewers),
    status: values.status,
  };
}

function split(value?: string | null) {
  if (!value) return [] as string[];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}
