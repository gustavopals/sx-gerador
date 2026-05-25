---
title: SX2 — Tabelas
description: Referência completa do dicionário de tabelas (SX2) gerado pelo SXGerador.
---

A tabela **SX2** é o dicionário de tabelas do Protheus. Cada linha representa uma tabela do sistema (`ZGE010`, `SF1010` etc.) com seus metadados.

## Estrutura do registro

| Campo SX2    | Tipo  | Descrição                                                | Origem no SXGerador |
| ------------ | ----- | -------------------------------------------------------- | ------------------- |
| `X2_CHAVE`   | C(6)  | Nome físico da tabela                                    | `prefixo + '010'`   |
| `X2_PATH`    | C(11) | Caminho lógico (em branco para customizadas)             | Vazio               |
| `X2_ARQUIVO` | C(10) | Nome físico (idêntico a `X2_CHAVE`)                      | `prefixo + '010'`   |
| `X2_NOME`    | C(40) | Descrição em PT                                          | `namePt`            |
| `X2_NOMESPA` | C(40) | Descrição em ES                                          | `nameEs`            |
| `X2_NOMEENG` | C(40) | Descrição em EN                                          | `nameEn`            |
| `X2_MODO`    | C(1)  | Modo compartilhado: `C` (Compartilhado), `E` (Exclusivo) | `mode`              |
| `X2_MODOEMP` | C(1)  | Modo por empresa                                         | `modeCompany`       |
| `X2_MODOUN`  | C(1)  | Modo por unidade                                         | `modeUnit`          |
| `X2_MODOFIL` | C(1)  | Modo por filial                                          | `modeBranch`        |
| `X2_TTS`     | C(1)  | TTS habilitado: `S` ou `N`                               | `ttsEnabled`        |
| `X2_UNICO`   | C(20) | Expressão de chave única                                 | `uniqueKey`         |
| `X2_PYME`    | C(1)  | Visível em PYME: `S` ou `N`                              | `pyme`              |
| `X2_MODULO`  | C(15) | **Bitmap** de módulos TOTVS                              | `modules`           |
| `X2_TIPO`    | C(1)  | Tipo (geralmente `V` para visíveis)                      | Auto                |

## Modo Compartilhado

```text
C → Compartilhado entre todas as filiais (padrão para tabelas de cadastro)
E → Exclusivo por filial (cada filial tem dados separados)
```

## Bitmap X2_MODULO

`X2_MODULO` é um **bitmap binário** indicando em quais módulos TOTVS a tabela aparece:

| Posição | Módulo                  |
| ------- | ----------------------- |
| 1       | SIGAFAT — Faturamento   |
| 2       | SIGAEST — Estoque       |
| 3       | SIGACOM — Compras       |
| 4       | SIGAFIN — Financeiro    |
| 5       | SIGACTB — Contabilidade |
| ...     | (38 módulos no total)   |

O SXGerador codifica/decodifica esse bitmap automaticamente — você só marca/desmarca os módulos na UI.

## Geração AdvPL

A migration produz uma chamada equivalente a:

```advpl
aAdd(aSX2, { ;
    "ZGE010", "", "ZGE010", "Equipamentos", "Equipos", "Equipment", ;
    "C", "", "", "", "S", "", "N", "111000000000000", "V" ;
})

CriaSX2(aSX2)
```

## Validações aplicadas pelo SXGerador

- Prefixo obrigatório com 3 caracteres começando em `Z` (`ZGE`, `ZA1` — bloqueia `S*`, `A*` etc.)
- `X2_ARQUIVO` derivado automaticamente como `<prefixo>010`
- Pelo menos um módulo marcado
- `X2_NOME`, `X2_NOMESPA`, `X2_NOMEENG` obrigatórios
