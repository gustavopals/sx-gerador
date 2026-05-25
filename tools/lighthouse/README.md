# Auditoria Lighthouse (F11.1)

Script reproduzível que audita as **telas críticas** do `apps/web` e exige **≥ 90** em:

- Performance
- Accessibility
- Best Practices
- SEO

## Pré-requisitos

```bash
pnpm db:up
pnpm db:seed
pnpm --filter api dev   # terminal 1 — porta 3000
```

Node **22** recomendado (mesmo do monorepo).

## Executar

```bash
pnpm lighthouse:audit
```

Opções via ambiente:

| Variável                   | Padrão                                                |
| -------------------------- | ----------------------------------------------------- |
| `LH_MIN_SCORE`             | `90`                                                  |
| `LH_PORT`                  | `4280`                                                |
| `LH_API_URL`               | `http://localhost:3000/api/v1`                        |
| `LH_EMAIL` / `LH_PASSWORD` | usuário do seed (`dev@sxgerador.local` / `dev123456`) |

Reutilizar build existente:

```bash
pnpm lighthouse:audit -- --skip-build
```

## Saída

- `reports/summary.json` — consolidado
- `reports/<page-id>.report.json` — relatório Lighthouse por rota

## Telas auditadas

Definidas em `pages.cjs` (login, signup, dashboard, projetos, tabela, migrations, equipes, templates, perfil).

## Build usado na auditoria

`ng build --configuration=lighthouse` → `environment.lighthouse.ts` (produção otimizada + API local).
