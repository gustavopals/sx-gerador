# SXGerador Web

Aplicação frontend do SXGerador, criada com Angular 21, standalone components,
SCSS e PO-UI 21.

## Comandos

Execute a partir da raiz do monorepo:

```bash
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web lint
pnpm --filter web typecheck
```

Ou use o script global:

```bash
pnpm dev
```

O servidor local sobe em `http://localhost:4200`.

## Ambiente

As variáveis de ambiente ficam em:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

O valor principal usado neste scaffold é `apiUrl`, apontando para a API em
`http://localhost:3000/api/v1` durante o desenvolvimento.
