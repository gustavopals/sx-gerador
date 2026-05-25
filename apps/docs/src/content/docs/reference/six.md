---
title: SIX — Índices
description: Referência completa do dicionário de índices (SIX) gerado pelo SXGerador.
---

A tabela **SIX** define os índices das tabelas do dicionário. Cada tabela tem 1+ índices.

## Estrutura do registro

| Campo SIX   | Tipo  | Descrição                                    |
| ----------- | ----- | -------------------------------------------- |
| `INDICE`    | C(6)  | Nome da tabela (`ZGE010`)                    |
| `ORDEM`     | C(2)  | Ordem do índice (`1` = principal único)      |
| `CHAVE`     | C(60) | Expressão da chave (`ZGE_FILIAL+ZGE_CODIGO`) |
| `DESCRICAO` | C(40) | Descrição em PT                              |
| `DESCSPA`   | C(40) | Descrição em ES                              |
| `DESCENG`   | C(40) | Descrição em EN                              |
| `PROPRI`    | C(1)  | Origem: `S` (Sistema), `U` (Usuário)         |
| `F3`        | C(30) | Consulta padrão associada                    |
| `NICKNAME`  | C(10) | Apelido                                      |
| `SHOWPESQ`  | C(1)  | Mostra na busca: `S` / `N`                   |

## Regra crítica: ORDEM = 1

> **Cada tabela tem exatamente um índice com `ORDEM = 1`** — esse é o índice **único principal** e define a chave de unicidade da tabela. O SXGerador impede o cadastro de um segundo índice com ordem 1.

Os demais índices recebem ordem `2`, `3`, etc.

## Construindo a CHAVE

A chave é uma expressão AdvPL que concatena campos com `+`:

```text
ZGE_FILIAL+ZGE_CODIGO
ZGE_FILIAL+DTOS(ZGE_DTAQUI)+ZGE_CODIGO
ZGE_FILIAL+ZGE_TIPO+ZGE_STATUS
```

Para tipos não-string, use funções de conversão:

- Data → `DTOS(campo)`
- Numérico → `STR(campo, tamanho, decimais)`

## Validações aplicadas pelo SXGerador

- Exatamente 1 índice com `ORDEM = 1` por tabela (bloqueia o segundo)
- Todos os campos referenciados na chave devem existir na tabela
- Campos da chave devem pertencer ao prefixo da tabela
- `INDICE` derivado automaticamente do nome físico da tabela

## Geração AdvPL

```advpl
aAdd(aSIX, { ;
    "ZGE010", "1", "ZGE_FILIAL+ZGE_CODIGO", ;
    "Codigo", "Codigo", "Code", ;
    "U", "", "", "S" ;
})

aAdd(aSIX, { ;
    "ZGE010", "2", "ZGE_FILIAL+ZGE_TIPO+ZGE_CODIGO", ;
    "Tipo + Codigo", "Tipo + Codigo", "Type + Code", ;
    "U", "", "", "S" ;
})

CriaSIX(aSIX)
```

## Índices virtuais

Quando `isVirtual = true`, o índice é marcado como virtual no Protheus — útil para campos calculados em tempo de execução. Use `virtualCustomizable` se o usuário final pode reordenar.
