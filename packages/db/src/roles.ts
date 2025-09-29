export const ROLES = [
  "admin",
  "gestor",
  "fiscal",
  "financeiro",
  "estoque",
  "rh",
  "atendimento",
  "viewer",
] as const;

export type Role = (typeof ROLES)[number];
