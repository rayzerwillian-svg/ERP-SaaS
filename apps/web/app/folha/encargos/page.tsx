'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { EncargosSchema, EncargosInput } from '@erp-saas/db';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

export default function EncargosPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();

  const encargosQuery = useQuery({
    queryKey: ['folha', 'encargos'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<EncargosInput>('/folha/encargos', { token });
    },
    enabled: Boolean(token),
  });

  const updateEncargos = useMutation({
    mutationFn: async (payload: EncargosInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<EncargosInput>('/folha/encargos', {
        method: 'PUT',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folha', 'encargos'] });
    },
  });

  const encargos = encargosQuery.data;

  const totalPerc = encargos
    ? Object.values(encargos).reduce((acc, value) => acc + Number(value || 0), 0)
    : 0;

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Configuração de Encargos</h2>
        <p className="text-sm text-gray-600">Defina percentuais trabalhistas e sociais para cálculo de custo total.</p>
      </header>

      <SchemaForm
        schema={EncargosSchema}
        fields={[
          { name: 'trabFerias30Perc', label: 'Férias 1/3 %', type: 'number' },
          { name: 'trab13Perc', label: '13º %', type: 'number' },
          { name: 'trab13FeriasPerc', label: '13º sobre férias %', type: 'number' },
          { name: 'socInssPerc', label: 'INSS %', type: 'number' },
          { name: 'socSatPerc', label: 'SAT %', type: 'number' },
          { name: 'socSalEducPerc', label: 'Salário Educação %', type: 'number' },
          { name: 'socIncraSestSebraeSenatPerc', label: 'INCRA/SEST/SENAT %', type: 'number' },
          { name: 'socFgtsPerc', label: 'FGTS %', type: 'number' },
          { name: 'socFgtsRescisaoPerc', label: 'FGTS Rescisão %', type: 'number' },
        ]}
        defaultValues={encargos ?? undefined}
        submitLabel={updateEncargos.isPending ? 'Salvando...' : 'Salvar encargos'}
        onSubmit={async (values) => {
          try {
            await updateEncargos.mutateAsync(values);
          } catch (error) {
            alert((error as Error).message);
          }
        }}
        aiActions={[
          {
            label: 'Explicar encargos',
            onInvoke: async () =>
              `Encargos totais projetados em ${totalPerc.toFixed(2)}% do salário bruto.`,
          },
        ]}
      />

      {encargos ? (
        <div className="rounded-md border bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Carga total de encargos</p>
          <p className="text-2xl font-semibold text-blue-700">{totalPerc.toFixed(2)}%</p>
        </div>
      ) : null}
      {encargosQuery.isLoading ? <p className="text-sm text-gray-500">Carregando encargos...</p> : null}
    </section>
  );
}
