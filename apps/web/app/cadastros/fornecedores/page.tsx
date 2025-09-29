'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { DataTable } from '@erp-saas/ui';
import { apiFetch } from '../../../lib/api-client';

type Fornecedor = {
  id: string;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  telefone?: string | null;
};

type FornecedorForm = {
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
};

const columns: ColumnDef<Fornecedor>[] = [
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'cnpj', header: 'CNPJ' },
  { accessorKey: 'email', header: 'E-mail' },
  { accessorKey: 'telefone', header: 'Telefone' },
];

export default function FornecedoresPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FornecedorForm>();

  const fornecedoresQuery = useQuery({
    queryKey: ['cadastros', 'fornecedores'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Fornecedor[]>('/cadastros/fornecedores', { token });
    },
    enabled: Boolean(token),
  });

  const createFornecedor = useMutation({
    mutationFn: async (payload: FornecedorForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Fornecedor>('/cadastros/fornecedores', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadastros', 'fornecedores'] });
      reset();
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createFornecedor.mutateAsync(values);
    } catch (error) {
      alert((error as Error).message);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Fornecedores</h2>
        <p className="text-sm text-gray-600">Cadastre fornecedores e mantenha dados de contato centralizados.</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-md border bg-white p-4 shadow">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Nome</span>
            <input {...register('nome', { required: true })} className="w-full rounded-md border px-3 py-2" required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">CNPJ</span>
            <input {...register('cnpj')} className="w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">E-mail</span>
            <input type="email" {...register('email')} className="w-full rounded-md border px-3 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Telefone</span>
            <input {...register('telefone')} className="w-full rounded-md border px-3 py-2" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            disabled={createFornecedor.isPending}
          >
            {createFornecedor.isPending ? 'Salvando...' : 'Salvar fornecedor'}
          </button>
          <button
            type="button"
            onClick={() => alert('IA sugeriu negociar prazo com fornecedor com melhor SLA.')}
            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
          >
            IA: Sugerir negociação
          </button>
        </div>
      </form>

      <DataTable columns={columns} data={fornecedoresQuery.data ?? []} />
      {fornecedoresQuery.isLoading ? <p className="text-sm text-gray-500">Carregando fornecedores...</p> : null}
    </section>
  );
}
