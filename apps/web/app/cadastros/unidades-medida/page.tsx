'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '../../../lib/api-client';

type Unidade = {
  id: string;
  sigla: string;
  descricao: string;
};

type UnidadeForm = {
  sigla: string;
  descricao: string;
};

const columns: ColumnDef<Unidade>[] = [
  { accessorKey: 'sigla', header: 'Sigla' },
  { accessorKey: 'descricao', header: 'Descrição' },
];

export default function UnidadesMedidaPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<UnidadeForm>();

  const unidadesQuery = useQuery({
    queryKey: ['cadastros', 'unidades-medida'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Unidade[]>('/cadastros/unidades', { token });
    },
    enabled: Boolean(token),
  });

  const createUnidade = useMutation({
    mutationFn: async (payload: UnidadeForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Unidade>('/cadastros/unidades', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadastros', 'unidades-medida'] });
      reset();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createUnidade.mutateAsync(values);
    } catch (error) {
      alert((error as Error).message);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Unidades de Medida</h2>
        <p className="text-sm text-gray-600">Padronize as unidades e garanta consistência nas fichas técnicas.</p>
      </header>
      <form onSubmit={onSubmit} className="flex flex-wrap gap-4 rounded-md border bg-white p-4 shadow">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">Sigla</span>
          <input {...register('sigla', { required: true })} className="w-full rounded-md border px-3 py-2" required />
        </label>
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">Descrição</span>
          <input {...register('descricao', { required: true })} className="w-full rounded-md border px-3 py-2" required />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            disabled={createUnidade.isPending}
          >
            {createUnidade.isPending ? 'Salvando...' : 'Salvar unidade'}
          </button>
          <button
            type="button"
            onClick={() => alert('IA sugeriu converter a unidade para padrão SI.')}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
          >
            IA: Sugerir padronização
          </button>
        </div>
      </form>
      <DataTable columns={columns} data={unidadesQuery.data ?? []} />
      {unidadesQuery.isLoading ? <p className="text-sm text-gray-500">Carregando unidades...</p> : null}
    </section>
  );
}
