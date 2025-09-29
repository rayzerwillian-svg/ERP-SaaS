import type { Role } from '@erp-saas/db';

export type RouteRule = {
  pattern: RegExp;
  roles: Role[];
  viewerReadOnly?: boolean;
};

export const RBAC_RULES: RouteRule[] = [
  {
    pattern: /^\/$|^\/dashboard/, // home + dashboard
    roles: ['admin', 'gestor', 'financeiro', 'fiscal', 'estoque', 'rh', 'atendimento'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/cadastros\b/,
    roles: ['admin', 'gestor', 'estoque'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/ficha-tecnica\b/,
    roles: ['admin', 'gestor', 'estoque'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/precificacao\b/,
    roles: ['admin', 'gestor', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/simulacoes\b/,
    roles: ['admin', 'gestor', 'financeiro', 'estoque'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/analises\b/,
    roles: ['admin', 'gestor', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/despesas-fixas\b/,
    roles: ['admin', 'gestor', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/folha\b/,
    roles: ['admin', 'gestor', 'rh'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/dre\b/,
    roles: ['admin', 'gestor', 'fiscal', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/entradas\b|^\/ingestao\b/,
    roles: ['admin', 'gestor', 'fiscal', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/fiscal\b/,
    roles: ['admin', 'gestor', 'fiscal'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/ia\b/,
    roles: ['admin', 'gestor', 'atendimento'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/compliance\b/,
    roles: ['admin', 'gestor', 'fiscal', 'financeiro'],
    viewerReadOnly: true,
  },
  {
    pattern: /^\/seguranca\b/,
    roles: ['admin', 'gestor'],
    viewerReadOnly: false,
  },
];

export function matchRouteRule(pathname: string): RouteRule | undefined {
  return RBAC_RULES.find((rule) => rule.pattern.test(pathname));
}

export function isRoleAllowed(
  role: Role,
  pathname: string,
  method: string = 'GET',
): boolean {
  if (role === 'admin') {
    return true;
  }

  const rule = matchRouteRule(pathname);

  if (!rule) {
    // Unmapped routes default to authenticated access (e.g., misc utilities)
    return role !== undefined;
  }

  if (rule.roles.includes(role)) {
    return true;
  }

  if (role === 'viewer' && rule.viewerReadOnly && method === 'GET') {
    return true;
  }

  return false;
}
