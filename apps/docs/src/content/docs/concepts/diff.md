---
title: Diff visual e histórico
description: Veja exatamente o que mudou entre versões do dicionário e quando.
---

O SXGerador mantém um **histórico completo de alterações** do dicionário e oferece **diff visual** entre versões — útil para auditoria, code review interno e diagnóstico de problemas em produção.

## Histórico

Toda criação, alteração e exclusão de tabela/campo/índice gera uma entrada no histórico, contendo:

- Quem fez (usuário)
- Quando (timestamp ISO 8601)
- O que mudou (operação + payload before/after)
- Qual projeto

Acesse em **Projeto → Histórico**.

## Diff entre versões

O diff mostra três tipos de mudança:

- 🟢 **Adições** — novas tabelas/campos/índices
- 🟡 **Alterações** — mudanças em propriedades existentes
- 🔴 **Remoções** — itens deletados

### Diff entre dois pontos no tempo

Em **Projeto → Diff**, escolha duas datas/migrations e o sistema compara o estado do dicionário entre elas.

### Diff entre dois projetos

Útil para comparar ambientes (homologação vs produção) ou para revisar PRs de templates.

## Export do diff

O resultado pode ser exportado como:

- **Markdown** — pronto para colar em PR ou ticket
- **PDF** — para envio em documentação formal

## Auditoria

Internamente, toda ação dispara um registro de `AuditLog` no backend. Os campos do log são:

| Campo         | Descrição                                                     |
| ------------- | ------------------------------------------------------------- |
| `action`      | Verbo (`projects.create`, `tables.update`, `teams.invite`...) |
| `actorUserId` | Quem fez                                                      |
| `resourceId`  | Qual recurso                                                  |
| `metadata`    | JSON com detalhes adicionais                                  |
| `createdAt`   | Quando                                                        |

Logs são append-only — não há delete via UI.
