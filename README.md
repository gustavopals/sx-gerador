# SXGerador

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

O projeto está iniciando a Fase 0: fundação do monorepo. O documento principal de
produto, arquitetura e roadmap está em [IDEIA.md](IDEIA.md).

## Stack Planejada

- Angular 21 + PO-UI 21 no frontend
- Node.js 22 + Express + Prisma no backend
- PostgreSQL 16+
- pnpm workspaces + Turborepo
- TypeScript strict mode
- Vitest, Playwright, ESLint e Prettier

## Setup Local

> A base executável do monorepo será criada nas próximas tasks da Fase 0. Por enquanto,
> este repositório contém a documentação inicial e os arquivos fundacionais.

Requisitos planejados:

- Node.js 22
- pnpm
- Docker e Docker Compose

Quando o monorepo estiver configurado:

```bash
pnpm install
pnpm db:up
pnpm dev
```

Com isso, a expectativa da Fase 0 é subir:

- Web em `http://localhost:4200`
- API em `http://localhost:3000`
- PostgreSQL local via Docker Compose

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
