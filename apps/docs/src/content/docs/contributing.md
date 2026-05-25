---
title: Contribuindo
description: Como contribuir com código, documentação ou templates para o SXGerador.
---

SXGerador é open source MIT. Contribuições são muito bem-vindas.

## Reportar bug ou pedir feature

Use [GitHub Issues](https://github.com/sxgerador/sxgerador/issues/new/choose). Temos templates para bug, feature e pergunta.

## Contribuir com código

```bash
git clone https://github.com/sxgerador/sxgerador.git
cd sxgerador
pnpm install
pnpm db:up
pnpm dev
```

Veja o [CONTRIBUTING.md](https://github.com/sxgerador/sxgerador/blob/main/CONTRIBUTING.md) na raiz do repo para detalhes de:

- Convenções de código (TypeScript strict, Conventional Commits, Prettier)
- Como rodar testes (`pnpm test`)
- Como criar uma migration Prisma
- Como abrir PR

## Contribuir com templates

Os templates oficiais ficam em `apps/api/prisma/data/official-templates.ts`. Para adicionar um novo:

1. Faça fork do repo
2. Edite o arquivo, adicionando seu template ao array `OFFICIAL_TEMPLATES`
3. Rode `pnpm db:seed` localmente para testar
4. Abra um PR

Templates da comunidade (publicados via UI) já são públicos e não precisam de PR.

## Contribuir com documentação

A documentação vive em `apps/docs/src/content/docs/`. Edite o markdown e abra PR. Os builds preview rodam automaticamente.

## Código de conduta

Esperamos comportamento respeitoso e profissional em todas as interações. Trolling, assédio e discriminação não são tolerados. Veja [CODE_OF_CONDUCT.md](https://github.com/sxgerador/sxgerador/blob/main/CODE_OF_CONDUCT.md).
