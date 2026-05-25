---
title: SX3 — Campos
description: Referência completa do dicionário de campos (SX3) gerado pelo SXGerador.
---

O **SX3** é o dicionário de campos do Protheus. É o dicionário maior em volume — uma tabela com 30 campos tem 30 registros aqui.

## Estrutura do registro

Os campos abaixo são os mais comuns; a tabela completa do Protheus tem ~70 colunas.

### Identificação

| Campo SX3    | Tipo  | Descrição                           |
| ------------ | ----- | ----------------------------------- |
| `X3_ARQUIVO` | C(10) | Nome físico da tabela (`ZGE010`)    |
| `X3_CAMPO`   | C(10) | Nome do campo (`ZGE_CODIGO`)        |
| `X3_ORDEM`   | C(2)  | Ordem de exibição (`01`, `02`, ...) |

### Tipo e formato

| Campo SX3    | Tipo  | Valores                                                     |
| ------------ | ----- | ----------------------------------------------------------- |
| `X3_TIPO`    | C(1)  | `C` (Char), `N` (Num), `D` (Date), `L` (Lógico), `M` (Memo) |
| `X3_TAMANHO` | N     | Tamanho                                                     |
| `X3_DECIMAL` | N     | Decimais (só para tipo N)                                   |
| `X3_PICTURE` | C(30) | Máscara de exibição (`@!`, `@E 999,999.99`, ...)            |

### Títulos e descrições (trilíngue)

| Campo SX3    | Origem    |
| ------------ | --------- |
| `X3_TITULO`  | `titlePt` |
| `X3_TITSPA`  | `titleEs` |
| `X3_TITENG`  | `titleEn` |
| `X3_DESCRIC` | `descPt`  |
| `X3_DESCSPA` | `descEs`  |
| `X3_DESCENG` | `descEn`  |

### Comportamento

| Campo SX3    | Descrição                   | Valores comuns                           |
| ------------ | --------------------------- | ---------------------------------------- |
| `X3_OBRIGAT` | Campo obrigatório           | `S` / `N`                                |
| `X3_BROWSE`  | Aparece em browses          | `S` / `N`                                |
| `X3_VISUAL`  | Modo visual                 | `A` (Alterar), `V` (Visualizar)          |
| `X3_CONTEXT` | Contexto                    | `R` (Real), `V` (Virtual)                |
| `X3_VALID`   | Validação AdvPL             | Expressão (`Vazio() .Or. ExistCpo(...)`) |
| `X3_RELACAO` | Valor default               | Expressão (`xFilial('ZGE')`)             |
| `X3_WHEN`    | Quando habilitar            | Expressão lógica                         |
| `X3_F3`      | Consulta padrão (SXB)       | Nome da consulta                         |
| `X3_USADO`   | **Bitmap** de campos ativos | 120 chars codificados                    |
| `X3_MODULO`  | **Bitmap** de módulos       | Idem `X2_MODULO`                         |

## ⚠️ X3_USADO — O bitmap crítico

O `X3_USADO` é um **bitmap codificado** de 120 caracteres, onde cada char representa 8 bits (estilo base-X codificado). Cada bit indica se o campo está habilitado em um determinado "uso" do sistema.

> **Erros em `X3_USADO` quebram o ERP em produção.** O SXGerador codifica e decodifica esse bitmap automaticamente, com 100% de cobertura de testes.

Ver detalhes em [X3_USADO (bitmap)](/reference/x3-usado/).

## Convenções de nomenclatura

- Nome: `<PREFIXO>_<NOME>` em UPPERCASE
- Máximo 10 caracteres totais (incluindo prefixo e underscore)
- Primeiro campo de toda tabela é **sempre** `<PREFIX>_FILIAL`, tipo `C`, tamanho conforme `MV_TAMFIL` (default 2)

## Picture (X3_PICTURE) — exemplos

| Picture             | Significado                 |
| ------------------- | --------------------------- |
| `@!`                | Tudo maiúsculo              |
| `@R 99/99/9999`     | Máscara de data             |
| `@E 999,999,999.99` | Formato monetário (Europeu) |
| `@D`                | Data formatada              |
| `999,999.99`        | Numérico                    |

## Geração AdvPL

```advpl
aAdd(aSX3, { ;
    "ZGE010", "ZGE_CODIGO", "02", "C", 10, 0, "Codigo", "Codigo", "Code", ;
    "Codigo do equipamento", "Codigo del equipo", "Equipment code", ;
    "@!", "", "", "", "", "", "S", "A", "R", "U", "N", "S", ;
    /* X3_USADO  */ "þþþþþþþþþþþ...", ;
    /* X3_MODULO */ "111000000000000" ;
})

CriaSX3(aSX3)
```
