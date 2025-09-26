# Automação do Monorepo

Este repositório utiliza uma pipeline de CI definida em `.github/workflows/ci.yml` para executar automaticamente as verificações principais a cada push ou pull request direcionado ao branch `main`.

A rotina automatizada executa:

- `pnpm lint` para rodar as regras de estilo do Turbo repo em todos os workspaces.
- `pnpm test` para rodar os testes unitários existentes.
- `pnpm --filter @erp-saas/db prisma:generate` seguido de `pnpm --filter @erp-saas/db prisma:migrate` em um Postgres efêmero para validar o schema Prisma.
- `pnpm build` após a conclusão das etapas anteriores, garantindo que os aplicativos Next.js e NestJS compilam.

As execuções reutilizam caches de dependências PNPM, garantindo feedback rápido e consistente. Em caso de falhas, o GitHub Actions sinaliza diretamente no PR para facilitar a correção antes do merge.
