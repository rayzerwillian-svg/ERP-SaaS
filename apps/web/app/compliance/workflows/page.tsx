'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger, DataTable } from '@erp-saas/ui';
import { useSession } from 'next-auth/react';
import { apiFetch } from '../../../lib/api-client';
import { RBAC_RULES } from '../../../lib/rbac';
import { ROLES } from '@erp-saas/db';

type Workflow = {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string | null;
  etapas: { nome: string; responsavelRole: string }[];
  status: string;
  requerMfa: boolean;
  criadoEm: string;
};

type WorkflowForm = {
  nome: string;
  tipo: string;
  descricao?: string;
  etapas: string;
  status: string;
  requerMfa: boolean;
};

type Policy = {
  id: string;
  titulo: string;
  categoria: string;
  versao: string;
  vigenteDesde: string;
  vigenteAte?: string | null;
  urlDocumento?: string | null;
  obrigatoria: boolean;
  status: string;
  criadoEm: string;
};

type PolicyForm = {
  titulo: string;
  categoria: string;
  versao: string;
  vigenteDesde: string;
  vigenteAte?: string;
  urlDocumento?: string;
  obrigatoria: boolean;
  status: string;
};

const workflowColumns: ColumnDef<Workflow>[] = [
  { accessorKey: 'nome', header: 'Workflow' },
  { accessorKey: 'tipo', header: 'Tipo' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'requerMfa', header: 'MFA', cell: ({ row }) => (row.original.requerMfa ? 'Sim' : 'Não') },
  {
    accessorKey: 'etapas',
    header: 'Etapas',
    cell: ({ row }) => row.original.etapas.map((step) => `${step.nome} (${step.responsavelRole})`).join(' → '),
  },
];

const policyColumns: ColumnDef<Policy>[] = [
  { accessorKey: 'titulo', header: 'Política' },
  { accessorKey: 'categoria', header: 'Categoria' },
  { accessorKey: 'versao', header: 'Versão' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'obrigatoria', header: 'Obrigatória', cell: ({ row }) => (row.original.obrigatoria ? 'Sim' : 'Não') },
  { accessorKey: 'vigenteDesde', header: 'Vigente desde' },
];

export default function ComplianceWorkflowsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('workflows');

  const workflowsQuery = useQuery({
    queryKey: ['compliance', 'workflows'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Workflow[]>('/compliance/workflows', { token });
    },
    enabled: Boolean(token),
  });

  const policiesQuery = useQuery({
    queryKey: ['compliance', 'politicas'],
    queryFn: () => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Policy[]>('/compliance/politicas', { token });
    },
    enabled: Boolean(token),
  });

  const workflowForm = useForm<WorkflowForm>({ defaultValues: { requerMfa: false, status: 'ativo' } });
  const policyForm = useForm<PolicyForm>({ defaultValues: { obrigatoria: true, status: 'vigente' } });

  const createWorkflow = useMutation({
    mutationFn: (payload: WorkflowForm) => {
      if (!token) throw new Error('Sessão inválida');
      const etapas = payload.etapas
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [nome, responsavel] = line.split(':').map((part) => part.trim());
          return { nome, responsavelRole: responsavel ?? 'gestor' };
        });
      return apiFetch<Workflow>('/compliance/workflows', {
        method: 'POST',
        body: { ...payload, etapas },
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'workflows'] });
      workflowForm.reset({ requerMfa: false, status: 'ativo' });
    },
  });

  const createPolicy = useMutation({
    mutationFn: (payload: PolicyForm) => {
      if (!token) throw new Error('Sessão inválida');
      return apiFetch<Policy>('/compliance/politicas', {
        method: 'POST',
        body: payload,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', 'politicas'] });
      policyForm.reset({ obrigatoria: true, status: 'vigente' });
    },
  });

  const rbacMatrix = useMemo(
    () =>
      RBAC_RULES.map((rule) => ({
        rota: rule.pattern.toString(),
        roles: rule.roles.join(', '),
        viewer: rule.viewerReadOnly ? 'Sim' : 'Não',
      })),
    [],
  );

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Compliance - Workflows e Controles</h1>
        <p className="text-sm text-gray-600">
          Automatize aprovações sensíveis, gerencie políticas internas e visualize a matriz de acesso em conformidade com LGPD e PCI-DSS.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="workflows">Fluxos de Aprovação</TabsTrigger>
          <TabsTrigger value="controle">Controle de Acesso</TabsTrigger>
          <TabsTrigger value="politicas">Gestão de Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          <form
            onSubmit={workflowForm.handleSubmit(async (values) => {
              try {
                await createWorkflow.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Nome do workflow</span>
                <input
                  {...workflowForm.register('nome', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Aprovação de contrato, Pagamento acima de R$50k"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Tipo</span>
                <input
                  {...workflowForm.register('tipo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="contratos, pagamentos, acesso-dados"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...workflowForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="ativo, suspenso"
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...workflowForm.register('requerMfa')} className="h-4 w-4" />
                <span>Requer MFA para aprovar</span>
              </label>
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Descrição</span>
              <textarea
                {...workflowForm.register('descricao')}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Etapas (uma por linha no formato &quot;Etapa:role&quot;)</span>
              <textarea
                {...workflowForm.register('etapas', { required: true })}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder={'Solicitação:gestor\nValidação fiscal:fiscal\nAprovação final:admin'}
                required
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createWorkflow.isPending}
              >
                {createWorkflow.isPending ? 'Publicando...' : 'Criar workflow'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA recomenda adicionar etapa de verificação de LGPD para fluxos que manipulam dados sensíveis.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Auditar etapas
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={workflowColumns} data={workflowsQuery.data ?? []} />
            {workflowsQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando workflows...</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="controle">
          <div className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold">Matriz de acesso</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 font-medium">Role</th>
                  <th className="py-2 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-b last:border-b-0">
                    <td className="py-2 capitalize">{role}</td>
                    <td className="py-2 text-gray-600">
                      {role === 'admin'
                        ? 'Acesso completo a todos os módulos'
                        : role === 'gestor'
                        ? 'Administra módulos operacionais sem acesso a configurações administrativas'
                        : role === 'fiscal'
                        ? 'Responsável por obrigações fiscais e auditorias'
                        : role === 'financeiro'
                        ? 'Controle de preços, DRE e entradas financeiras'
                        : role === 'estoque'
                        ? 'Gestão de cadastros, fichas técnicas e simulações'
                        : role === 'rh'
                        ? 'Folha de pagamento e encargos trabalhistas'
                        : role === 'atendimento'
                        ? 'Módulos de CX/IA'
                        : 'Acesso somente leitura'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="text-base font-semibold">Rotas protegidas</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 font-medium">Rota</th>
                  <th className="py-2 font-medium">Roles autorizadas</th>
                  <th className="py-2 font-medium">Viewer read-only</th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((row) => (
                  <tr key={row.rota} className="border-b last:border-b-0">
                    <td className="py-2 font-mono text-xs text-gray-700">{row.rota}</td>
                    <td className="py-2 text-gray-600">{row.roles}</td>
                    <td className="py-2 text-gray-600">{row.viewer}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              onClick={() =>
                alert('IA sugere habilitar MFA para aprovadores financeiros e revisar permissões de viewers externos.')
              }
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              IA: Recomendar ajustes de acesso
            </button>
          </div>
        </TabsContent>

        <TabsContent value="politicas">
          <form
            onSubmit={policyForm.handleSubmit(async (values) => {
              try {
                await createPolicy.mutateAsync(values);
              } catch (error) {
                alert((error as Error).message);
              }
            })}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium">Título</span>
                <input
                  {...policyForm.register('titulo', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Categoria</span>
                <input
                  {...policyForm.register('categoria', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="Código de Ética, LGPD, Segurança"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Versão</span>
                <input
                  {...policyForm.register('versao', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="1.0.0"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <input
                  {...policyForm.register('status', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="vigente, revisando"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Vigente desde</span>
                <input
                  type="date"
                  {...policyForm.register('vigenteDesde', { required: true })}
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">Vigente até (opcional)</span>
                <input type="date" {...policyForm.register('vigenteAte')} className="w-full rounded-md border px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium">URL do documento</span>
                <input {...policyForm.register('urlDocumento')} className="w-full rounded-md border px-3 py-2" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...policyForm.register('obrigatoria')} className="h-4 w-4" />
                <span>Política obrigatória</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                disabled={createPolicy.isPending}
              >
                {createPolicy.isPending ? 'Salvando...' : 'Publicar política'}
              </button>
              <button
                type="button"
                onClick={() =>
                  alert('IA sugere revisar políticas de retenção de dados à luz da LGPD e ISO 27001.')
                }
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
              >
                IA: Revisar política
              </button>
            </div>
          </form>

          <div className="mt-6">
            <DataTable columns={policyColumns} data={policiesQuery.data ?? []} />
            {policiesQuery.isLoading ? (
              <p className="mt-2 text-sm text-gray-500">Carregando políticas...</p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
