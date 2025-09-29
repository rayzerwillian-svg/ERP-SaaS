'use client';

import { useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { ColaboradorSchema, ColaboradorInput } from '@erp-saas/db';
import { DataTable, Tabs, TabsContent, TabsList, TabsTrigger } from '@erp-saas/ui';
import { SchemaForm } from '../../../components/zod-form';
import { apiFetch } from '../../../lib/api-client';

type ColaboradorParcial = Partial<ColaboradorInput>;
type ColaboradorRow = ColaboradorInput & { id: string };

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const columns: ColumnDef<ColaboradorRow>[] = [
  { accessorKey: 'codigo', header: 'Código' },
  { accessorKey: 'nome', header: 'Nome' },
  { accessorKey: 'setor', header: 'Setor' },
  { accessorKey: 'cargo', header: 'Cargo' },
  {
    accessorKey: 'valorHora',
    header: 'Valor Hora',
    cell: (info) => currency.format(info.getValue<number>() ?? 0),
  },
];

export default function ColaboradoresPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ColaboradorParcial>({});

  const colaboradoresQuery = useQuery({
    queryKey: ['folha', 'colaboradores'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ColaboradorRow[]>('/folha/colaboradores', { token });
    },
    enabled: Boolean(token),
  });

  const createColaborador = useMutation({
    mutationFn: async (payload: ColaboradorInput) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<ColaboradorRow>('/folha/colaboradores', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folha', 'colaboradores'] });
    },
  });

  const custoTotal = useMemo(() => {
    if (!draft.salario || draft.cargaHorariaMensal == null) return 0;
    const encargos = ((draft.encSociaisPerc ?? 0) + (draft.encTrabPerc ?? 0)) / 100;
    const beneficios = (draft.valeTransporte ?? 0) + (draft.valeRefeicao ?? 0) + (draft.convenioMedico ?? 0);
    return draft.salario * (1 + encargos) + beneficios;
  }, [draft]);

  const valorHora = useMemo(() => {
    if (!draft.cargaHorariaMensal || draft.cargaHorariaMensal === 0) return 0;
    return Number((custoTotal / draft.cargaHorariaMensal).toFixed(2));
  }, [custoTotal, draft.cargaHorariaMensal]);

  const registrarColaborador = async () => {
    if (!draft.codigo || !draft.nome || !draft.salario || !draft.setor || !draft.cargo || !draft.dataContratacao) {
      alert('Preencha código, nome, salário, setor, cargo e data de contratação.');
      return;
    }

    const colaborador: ColaboradorInput = {
      codigo: draft.codigo,
      nome: draft.nome,
      salario: draft.salario ?? 0,
      setor: draft.setor ?? '',
      cargo: draft.cargo ?? '',
      dataContratacao: draft.dataContratacao ?? '',
      encSociaisPerc: draft.encSociaisPerc ?? 0,
      encTrabPerc: draft.encTrabPerc ?? 0,
      valeTransporte: draft.valeTransporte ?? 0,
      valeRefeicao: draft.valeRefeicao ?? 0,
      convenioMedico: draft.convenioMedico ?? 0,
      cargaHorariaMensal: draft.cargaHorariaMensal ?? 0,
      valorHora,
    };

    try {
      await createColaborador.mutateAsync(colaborador);
      setDraft({});
    } catch (error) {
      alert((error as Error).message);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Colaboradores</h2>
        <p className="text-sm text-gray-600">Registre colaboradores, benefícios e calcule o custo-hora real.</p>
      </header>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="carga">Carga horária</TabsTrigger>
          <TabsTrigger value="custo">Custo/Hora</TabsTrigger>
        </TabsList>
        <TabsContent value="dados">
          <SchemaForm
            schema={ColaboradorSchema.pick({ codigo: true, nome: true, salario: true, setor: true, cargo: true, dataContratacao: true })}
            fields={[
              { name: 'codigo', label: 'Código' },
              { name: 'nome', label: 'Nome' },
              { name: 'salario', label: 'Salário', type: 'number' },
              { name: 'setor', label: 'Setor' },
              { name: 'cargo', label: 'Cargo' },
              { name: 'dataContratacao', label: 'Data de contratação' },
            ]}
            submitLabel="Salvar dados"
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            aiActions={[{ label: 'Calcular custo total', onInvoke: async () => 'Custo total anual projetado em R$ 92.300,00.' }]}
          />
        </TabsContent>
        <TabsContent value="beneficios">
          <SchemaForm
            schema={ColaboradorSchema.pick({ valeTransporte: true, valeRefeicao: true, convenioMedico: true, encSociaisPerc: true, encTrabPerc: true })}
            fields={[
              { name: 'valeTransporte', label: 'Vale Transporte', type: 'number' },
              { name: 'valeRefeicao', label: 'Vale Refeição', type: 'number' },
              { name: 'convenioMedico', label: 'Convênio Médico', type: 'number' },
              { name: 'encSociaisPerc', label: 'Encargos Sociais %', type: 'number' },
              { name: 'encTrabPerc', label: 'Encargos Trabalhistas %', type: 'number' },
            ]}
            submitLabel="Salvar benefícios"
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            aiActions={[{ label: 'Explicar encargos', onInvoke: async () => 'Encargos totais representam 34% do salário bruto.' }]}
          />
        </TabsContent>
        <TabsContent value="carga">
          <SchemaForm
            schema={ColaboradorSchema.pick({ cargaHorariaMensal: true })}
            fields={[{ name: 'cargaHorariaMensal', label: 'Carga Horária Mensal', type: 'number' }]}
            submitLabel="Salvar carga"
            onSubmit={(values) => setDraft((current) => ({ ...current, ...values }))}
            aiActions={[{ label: 'Sugerir ajuste', onInvoke: async () => 'Sugestão: redistribuir horas para balancear equipes.' }]}
          />
        </TabsContent>
        <TabsContent value="custo">
          <div className="space-y-4 rounded-md border bg-white p-4 shadow">
            <p className="text-sm text-gray-600">Custo total estimado:</p>
            <p className="text-2xl font-semibold text-blue-600">{currency.format(custoTotal)}</p>
            <p className="text-sm text-gray-600">Valor hora sugerido:</p>
            <p className="text-2xl font-semibold text-blue-700">{currency.format(valorHora)}</p>
            <button
              onClick={registrarColaborador}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
              disabled={createColaborador.isPending}
            >
              {createColaborador.isPending ? 'Registrando...' : 'Registrar colaborador'}
            </button>
          </div>
        </TabsContent>
      </Tabs>

      <DataTable columns={columns} data={colaboradoresQuery.data ?? []} />
      {colaboradoresQuery.isLoading ? <p className="text-sm text-gray-500">Carregando colaboradores...</p> : null}
    </section>
  );
}
