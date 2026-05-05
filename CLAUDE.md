# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O Projeto

**SXGerador** é uma plataforma web open source para desenvolvedores TOTVS Protheus criarem, versionarem e gerarem migrations de dicionário de dados (`SX2`, `SX3`, `SIX`) como scripts AdvPL `.PRW`. Substitui o fluxo manual no SIGACFG por uma interface moderna com colaboração e versionamento.

O projeto está na **Fase 0** (fundação do monorepo). Apps e packages existem mas estão em scaffold inicial.

## Comandos Essenciais

```bash
# Instalação e dev
pnpm install
pnpm db:up          # sobe PostgreSQL via Docker
pnpm dev            # web (4200) + api (3000)

# Banco de dados
pnpm db:up:admin    # sobe Postgres + PgAdmin (http://localhost:5050)
pnpm db:down
pnpm db:reset       # apaga dados e recria
pnpm db:seed        # insere dados iniciais

# Qualidade
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm test

# Testes de um pacote específico
pnpm --filter @sxgerador/advpl-builder test
pnpm --filter @sxgerador/advpl-builder test:watch
pnpm --filter @sxgerador/advpl-builder test:coverage
```

**Credenciais locais do banco:** host `localhost:5432`, database/user/password: `sxgerador`

## Arquitetura do Monorepo

```
apps/
  web/          Angular 21 + PO-UI 21 (Standalone Components, Signals, NgRx Signal Store)
  api/          Node 22 + Express 4 + Prisma 6 (TypeScript, Zod, pino)
packages/
  advpl-builder/   Geração de scripts .PRW — lógica pura, sem dependências externas
  shared-types/    Tipos TypeScript compartilhados entre web e api
tools/
  docker/          docker-compose.yml com PostgreSQL 16 (+ PgAdmin opcional)
```

**Turborepo** orquestra o build: `build` depende de `^build`, garantindo que `packages/*` sejam compilados antes de `apps/*`. Todos os outros apps importam `@sxgerador/shared-types` e `@sxgerador/advpl-builder` via `workspace:*`.

**Multi-tenant lógico:** todas as entidades têm `ownerUserId` ou `ownerTeamId` — não há separação física de banco por tenant.

## Stack por App

| App/Package              | Linguagem         | Framework                | Testes                          |
| ------------------------ | ----------------- | ------------------------ | ------------------------------- |
| `apps/web`               | TypeScript strict | Angular 21, PO-UI 21     | Vitest + Playwright (planejado) |
| `apps/api`               | TypeScript strict | Express 4, Prisma 6, Zod | Vitest (planejado)              |
| `packages/advpl-builder` | TypeScript strict | — (lógica pura)          | **Vitest obrigatório**          |
| `packages/shared-types`  | TypeScript strict | — (tipos apenas)         | —                               |

## Domínio Protheus — Regras Críticas

Este projeto codifica conhecimento específico do ERP TOTVS Protheus. Antes de mexer em qualquer lógica de geração ou validação:

**Nomenclatura:**

- Prefixo de tabela customizada deve começar com `Z` (ex: `ZZZ`, `ZA1`). Tabelas `S*`, `A*` etc. são TOTVS — bloquear cadastro.
- Nome do campo: `<PREFIXO>_<NOME>`, máx 10 chars (ex: `ZZZ_CODIGO`).
- Primeiro campo de toda tabela é sempre `<PREFIX>_FILIAL`, tipo `C`, tamanho conforme `MV_TAMFIL` (default 2).
- Nome físico da tabela: sufixo `010` (ex: `ZZZ010`).

**Bitmaps (lógica crítica — cobrir 100% com testes):**

- `X3_USADO` (120 chars): bitmap codificado onde cada char representa 8 bits. Erros aqui quebram o ERP em produção. Implementar `encodeX3Usado(flags)` e `decodeX3Usado(encoded)` no `advpl-builder` com cobertura total.
- `X2_MODULO` / `X3_MODULO`: bitmap de módulos TOTVS (FAT, EST, COM, FIN, RH…). Mesma estratégia.

**Índices (SIX):**

- Índice de ordem `1` é sempre o índice único principal. Nunca permitir mais de um índice com `ORDEM = 1` por tabela.

**Trilíngue:** todos os campos de título/descrição têm variantes PT/ES/EN (`_SPA`/`_ENG`).

## Prisma (apps/api)

Migrations ficam em `apps/api/prisma/migrations`. O client deve ser gerado antes de build/typecheck:

```bash
pnpm --filter api prisma generate
pnpm --filter api prisma migrate dev --name <descricao>
```

O `apps/api/package.json` já inclui `prisma generate` no `build` e `typecheck`.

## Convenções de Código

- **TypeScript strict** em todos os packages e apps.
- **Conventional Commits** obrigatório (validado pelo Commitlint no hook `commit-msg`). Ex: `feat(api): adiciona endpoint de criação de tabela`.
- **Prettier** com `printWidth: 100`, aspas simples, ordenação de imports via `@ianvs/prettier-plugin-sort-imports`.
- **lint-staged** roda ESLint + Prettier em arquivos staged antes do commit.
- Angular: preferir **Signals** sobre RxJS onde possível; usar novos template controls `@if`, `@for`.
- Backend: validação de payload obrigatória com **Zod**; logs estruturados com **pino**.

## `packages/advpl-builder` — Pacote Principal

Este pacote é o coração do produto. Gera scripts AdvPL `.PRW` a partir dos modelos de domínio. Regras:

- **Sem dependências de banco ou framework** — lógica pura e testável de forma isolada.
- Pode ser publicado como lib npm pública no futuro.
- Testes unitários são **mandatórios** para toda lógica de codificação/decodificação de bitmaps e geração de código AdvPL.
- Build via `tsup` (ESM + CJS dual output).
