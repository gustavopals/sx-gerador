# @sxgerador/advpl-builder

Gerador de scripts AdvPL `.PRW` para migrations de dicionário de dados Protheus (`SX2`, `SX3`, `SIX`).

**Sem dependências de banco, framework ou I/O.** Lógica pura e 100% testável de forma isolada.

## Instalação

Este pacote é consumido via workspace pnpm.

```json
{
  "dependencies": {
    "@sxgerador/advpl-builder": "workspace:*"
  }
}
```

## Uso básico (Fase 0 — stub)

```ts
import { buildMigration } from '@sxgerador/advpl-builder';

const code = buildMigration({
  id: 'clwxyz001',
  sequence: 1,
  name: 'Cria tabela ZZZ',
  project: { name: 'Meu Projeto', slug: 'meu-projeto' },
  author: { name: 'Dev', email: 'dev@example.com' },
  items: [],
});

console.log(code);
// #INCLUDE "PROTHEUS.CH"
// ...
// User Function SXG001Migration()
// Return Nil
```

## Estrutura do pacote

```
src/
  build-migration.ts     ← função principal: buildMigration(input): string
  types.ts               ← MigrationInput, MigrationItemInput, BuildResult
  encoders/
    x3-usado.encoder.ts  ← encodeX3Usado / decodeX3Usado (TODO Task F4.2)
    x2-modulo.encoder.ts ← encodeX2Modulo / decodeX2Modulo (TODO Task F4.2)
  builders/
    table.builder.ts     ← blocos SX2 (TODO Task F6.3)
    field.builder.ts     ← blocos SX3 (TODO Task F6.3)
    index.builder.ts     ← blocos SIX (TODO Task F6.3)
  templates/
    header.tpl.ts        ← cabeçalho Protheus.doc (funcional)
    helpers.advpl.ts     ← SXG_HELPERS.PRW como string (stub)
  validators/
    migration.validator.ts ← validações pré-geração (TODO Task F6.2)
```

## Scripts

```bash
pnpm build          # gera dist/ (ESM + CJS + tipos) via tsup
pnpm test           # Vitest (cobertura mínima: 95%)
pnpm test:watch     # modo watch
pnpm test:coverage  # relatório de cobertura
pnpm typecheck      # tsc --noEmit
```

## Regras de domínio Protheus

Ver [IDEIA.md](../../IDEIA.md) seção 14 para a especificação completa.

Resumo das regras críticas:

- Prefixo customizado começa com `Z` (ex: `ZZZ`)
- Nome do campo: `<PREFIXO>_<NOME>`, máx 10 chars
- Campo `<PREFIX>_FILIAL` obrigatório em toda tabela
- Índice de ordem `1` obrigatório (único principal)
- `X3_USADO` (120 chars): bitmap com cobertura 95% de testes
