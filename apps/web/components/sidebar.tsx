'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useSession } from 'next-auth/react';
import { isRoleAllowed } from '@/lib/rbac';

type MenuItem = {
  label: string;
  href?: string;
  children?: MenuItem[];
};

const MENU: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Cadastros',
    children: [
      { label: 'Produtos - Venda Direta', href: '/cadastros/produtos/venda-direta' },
      { label: 'Produtos - Processados', href: '/cadastros/produtos/processados' },
      { label: 'Fornecedores', href: '/cadastros/fornecedores' },
      { label: 'Unidades de Medida', href: '/cadastros/unidades-medida' },
    ],
  },
  {
    label: 'Ficha Técnica',
    children: [{ label: 'Fichas', href: '/ficha-tecnica/fichas' }],
  },
  {
    label: 'Precificação',
    children: [
      { label: 'Venda Direta', href: '/precificacao/venda-direta' },
      { label: 'Processados', href: '/precificacao/processados' },
    ],
  },
  {
    label: 'Simulações',
    children: [
      { label: 'Revenda', href: '/simulacoes/revenda' },
      { label: 'Processados', href: '/simulacoes/processados' },
    ],
  },
  {
    label: 'Análises',
    children: [
      { label: 'Revenda', href: '/analises/revenda' },
      { label: 'Processados', href: '/analises/processados' },
    ],
  },
  {
    label: 'Despesas Fixas',
    children: [
      { label: 'Categorias', href: '/despesas-fixas/categorias' },
      { label: 'Lançamentos', href: '/despesas-fixas' },
      { label: 'Total', href: '/despesas-fixas/total' },
    ],
  },
  {
    label: 'Folha de Pagamento',
    children: [
      { label: 'Config. Encargos', href: '/folha/encargos' },
      { label: 'Colaboradores', href: '/folha/colaboradores' },
    ],
  },
  {
    label: 'DRE',
    children: [
      { label: 'Plano DRE', href: '/dre/plano' },
      { label: 'Relatório DRE', href: '/dre/relatorio' },
    ],
  },
  {
    label: 'Entradas',
    children: [
      { label: 'Receitas', href: '/entradas/receitas' },
      { label: 'Despesas', href: '/entradas/despesas' },
      { label: 'Vendas Importadas', href: '/entradas/vendas-importadas' },
      { label: 'Despesas Importadas', href: '/entradas/despesas-importadas' },
    ],
  },
  {
    label: 'Fiscal',
    children: [
      { label: 'Cofre de XML', href: '/fiscal/cofre-xml' },
      { label: 'Emissão', href: '/fiscal/emissao' },
      { label: 'SPED / EFD-Contrib.', href: '/fiscal/sped' },
      { label: 'NFS-e Nacional', href: '/fiscal/nfse-nacional' },
    ],
  },
  {
    label: 'IA',
    children: [
      { label: 'Prompt Studio', href: '/ia/prompt-studio' },
      { label: 'Execuções de IA', href: '/ia/execucoes' },
      { label: 'RAG', href: '/ia/rag' },
      { label: 'Agentes', href: '/ia/agentes' },
    ],
  },
  {
    label: 'Segurança',
    children: [
      { label: 'Autenticação & Acesso', href: '/seguranca/autenticacao-acesso' },
      { label: 'Proteção de Dados', href: '/seguranca/protecao-dados' },
      { label: 'Monitoramento & Detecção', href: '/seguranca/monitoramento-deteccao' },
      { label: 'Conformidade & Governança', href: '/seguranca/conformidade-governanca' },
      { label: 'Segurança Avançada', href: '/seguranca/seguranca-avancada' },
    ],
  },
  {
    label: 'Compliance',
    children: [
      { label: 'Monitoramento & Alertas', href: '/compliance/monitoramento' },
      { label: 'Relatórios & Auditorias', href: '/compliance/relatorios' },
      { label: 'Workflows & Controles', href: '/compliance/workflows' },
      { label: 'Conformidade Setorial', href: '/compliance/conformidade' },
      { label: 'Treinamento & Governança', href: '/compliance/treinamento-governanca' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = data?.user.role ?? 'viewer';

  const filteredMenu = MENU.map((item) => {
    if (item.children && item.children.length > 0) {
      const children = item.children.filter((child) =>
        child.href ? isRoleAllowed(role, child.href, 'GET') : false,
      );
      if (children.length === 0) {
        return undefined;
      }
      return { ...item, children };
    }

    if (item.href && isRoleAllowed(role, item.href, 'GET')) {
      return item;
    }

    return undefined;
  }).filter(Boolean) as MenuItem[];

  return (
    <nav className="space-y-4">
      {filteredMenu.map((item) => (
        <div key={item.label}>
          <p className="text-xs font-semibold uppercase text-gray-500">{item.label}</p>
          <div className="mt-1 flex flex-col gap-1">
            {item.children?.map((child) => (
              <Link
                key={child.label}
                href={child.href ?? '#'}
                className={clsx(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-blue-100',
                  pathname === child.href ? 'bg-blue-200 font-semibold text-blue-800' : 'text-gray-700',
                )}
              >
                {child.label}
              </Link>
            ))}
            {!item.children && item.href ? (
              <Link
                href={item.href}
                className={clsx(
                  'rounded-md px-3 py-2 text-sm transition-colors hover:bg-blue-100',
                  pathname === item.href ? 'bg-blue-200 font-semibold text-blue-800' : 'text-gray-700',
                )}
              >
                {item.label}
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </nav>
  );
}
