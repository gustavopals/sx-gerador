# SXGerador

[![CI](https://github.com/gustavopals/sxgerador/actions/workflows/ci.yml/badge.svg)](https://github.com/gustavopals/sxgerador/actions/workflows/ci.yml)
[![Status](https://img.shields.io/badge/status-concep%C3%A7%C3%A3o-blue)](IDEIA.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-22.x-339933)](.nvmrc)

SXGerador é uma plataforma open source e gratuita para a comunidade Protheus criar,
versionar e gerar migrations de dicionário de dados (`SX2`, `SX3`, `SIX`) com uma
experiência moderna.

A ideia é substituir o fluxo manual e sujeito a erro do SIGACFG por uma aplicação web
com modelagem visual, validações de domínio, colaboração e geração de scripts AdvPL
`.PRW` versionáveis.

## Status

O projeto está na Fase 0: fundação do monorepo. O app web Angular + PO-UI já existe
em `apps/web`, a API Express + TypeScript já existe em `apps/api`, e a base local de
PostgreSQL + Prisma está configurada. O documento principal de produto, arquitetura e
roadmap está em [IDEIA.md](IDEIA.md).

## Stack Planejada

- Angular 21 + PO-UI 21 no frontend
- Node.js 22 + Express + Prisma no backend
- PostgreSQL 16+
- pnpm workspaces + Turborepo
- TypeScript strict mode
- Vitest, Playwright, ESLint e Prettier

## Setup Local

Requisitos planejados:

- Node.js 22
- pnpm
- Docker e Docker Compose

Para instalar dependências e subir web + API:

```bash
pnpm install
pnpm db:up
pnpm dev
```

Hoje isso sobe:

- Web em `http://localhost:4200`
- API em `http://localhost:3000`
- Health check em `http://localhost:3000/health`
- PostgreSQL local em `localhost:5432`

Credenciais locais do banco:

```text
database: sxgerador
user: sxgerador
password: sxgerador
```

## Banco Local

O PostgreSQL 16 roda via Docker Compose em `tools/docker/docker-compose.yml`, com dados
persistidos em `tools/docker/data/postgres`.

Comandos:

```bash
pnpm db:up        # sobe apenas o Postgres
pnpm db:up:admin  # sobe Postgres + PgAdmin opcional
pnpm db:down      # para os containers
pnpm db:reset     # apaga os dados locais e recria o Postgres
pnpm db:seed      # insere os dados iniciais via Prisma
```

As migrations Prisma ficam versionadas em `apps/api/prisma/migrations`, e o client da
API é gerado localmente por `prisma generate` antes do build/typecheck.

PgAdmin, quando iniciado, fica em `http://localhost:5050`.

## Qualidade de Código

O repositório já possui a base de qualidade configurada:

- ESLint com regras compartilhadas para TypeScript, Angular e imports.
- Prettier com `printWidth` de 100 caracteres, aspas simples e ordenação de imports.
- Husky + lint-staged para validar arquivos alterados antes do commit.
- Commitlint com Conventional Commits no hook `commit-msg`.

Comandos úteis:

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm commitlint --from HEAD~1 --to HEAD
```

## Roadmap

O roadmap completo está no [IDEIA.md](IDEIA.md), organizado por fases:

- Fase 0: fundação do monorepo
- Fase 1: autenticação e conta de usuário
- Fase 2: projetos
- Fase 3: tabelas `SX2`
- Fase 4: campos `SX3`
- Fase 5: índices `SIX`
- Fase 6: geração de migrations AdvPL
- Fase 7: equipes e colaboração

## Contribuição

Contribuições serão bem-vindas conforme o projeto for aberto para a comunidade.
Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para o fluxo sugerido de trabalho.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
