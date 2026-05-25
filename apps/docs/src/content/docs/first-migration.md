---
title: Sua primeira migration em 5 minutos
description: Tutorial passo a passo — do zero a um script .PRW que compila no Protheus.
---

Vamos criar uma tabela `ZGE010` (Equipamentos) com 4 campos e 1 índice, gerar o `.PRW` e revisar o que foi produzido.

## Pré-requisitos

- Conta no SXGerador ([crie aqui](https://sxgerador.com.br/signup))
- (Opcional) Acesso a um Protheus para compilar

## Passo 1 — Crie o projeto

Em **Projetos → Novo projeto**:

- Nome: `Tutorial Equipamentos`
- Slug: `tutorial-equipamentos`
- Visibilidade: `PRIVATE`
- TAMFIL: `2`

## Passo 2 — Cadastre a tabela

Dentro do projeto, **Tabelas → Nova tabela**:

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| Prefixo     | `ZGE`                                 |
| Nome físico | `ZGE010` (preenchido automaticamente) |
| Nome PT     | `Equipamentos`                        |
| Nome ES     | `Equipos`                             |
| Nome EN     | `Equipment`                           |
| Modo        | `Compartilhado` (E)                   |
| Módulos     | `EST`, `MNT`                          |

O sistema cria automaticamente o campo `ZGE_FILIAL` (tipo `C`, tamanho 2, `xFilial('ZGE')` no padrão).

## Passo 3 — Adicione os campos

Em **Campos → Novo campo**, crie:

### `ZGE_CODIGO`

```text
Ordem      02
Tipo       C
Tamanho    10
Picture    @!
Título PT  Codigo
Título ES  Codigo
Título EN  Code
Obrigatório  Sim
```

### `ZGE_DESCRI`

```text
Ordem      03
Tipo       C
Tamanho    40
Título PT  Descricao
Título ES  Descripcion
Título EN  Description
Obrigatório  Sim
```

### `ZGE_DTAQUI`

```text
Ordem      04
Tipo       D
Tamanho    8
Título PT  Data Aquisicao
Título ES  Fecha Adquisicion
Título EN  Acquisition Date
```

### `ZGE_VALOR`

```text
Ordem      05
Tipo       N
Tamanho    14
Decimais   2
Picture    @E 999,999,999,999.99
Título PT  Valor
Título ES  Valor
Título EN  Value
```

## Passo 4 — Crie o índice principal

Em **Índices → Novo índice**:

- **Ordem**: `1` (índice principal único)
- **Chave**: `ZGE_FILIAL+ZGE_CODIGO`
- **Descrição PT**: `Codigo`
- **Mostrar pesquisa**: `Sim`

> 💡 O índice de ordem 1 é o que aparece como padrão nos browses do Protheus. Cada tabela só pode ter **um** com ordem 1.

## Passo 5 — Gere o `.PRW`

Em **Migrations → Gerar**:

1. Selecione tabela, campos e índice
2. Nome da migration: `cria_tabela_equipamentos`
3. Clique em **Gerar**

O sistema produz um arquivo similar a:

```advpl
#INCLUDE "PROTHEUS.CH"

User Function CriaZGE010()
  Local aSX2 := {}
  Local aSX3 := {}
  Local aSIX := {}

  // SX2 — Tabela
  aAdd(aSX2, {"ZGE010", "ZGE", "Equipamentos", "Equipos", "Equipment", ...})

  // SX3 — Campos
  aAdd(aSX3, {"ZGE", "ZGE_FILIAL", "01", "C", 02, 0, "Filial", ...})
  aAdd(aSX3, {"ZGE", "ZGE_CODIGO", "02", "C", 10, 0, "Codigo", ...})
  // ...

  // SIX — Índices
  aAdd(aSIX, {"ZGE010", "1", "ZGE_FILIAL+ZGE_CODIGO", "Codigo", ...})

  CriaSX2(aSX2)
  CriaSX3(aSX3)
  CriaSIX(aSIX)

Return
```

## Passo 6 — Compile no Protheus

1. Abra o arquivo `.PRW` no AppServer
2. Compile (F5)
3. Execute `U_CriaZGE010()` pelo SmartClient

Verifique no SIGACFG que `ZGE010`, seus campos e o índice foram criados corretamente.

## Solução de problemas

| Erro                            | Causa                                       | Solução                                         |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------- |
| `Prefixo já em uso`             | Outra tabela do projeto tem o mesmo prefixo | Use outro prefixo de 3 letras começando com `Z` |
| `Mais de um índice com ordem 1` | Você tem 2+ índices com `ORDEM=1`           | Renumere os secundários (2, 3, ...)             |
| `X3_USADO inválido`             | Bitmap corrompido                           | Reabra o campo e re-marque os módulos           |

## Próximos passos

- [Convide sua equipe](/concepts/projects/)
- [Publique sua tabela como template](/concepts/templates/)
- [Veja o diff entre versões do dicionário](/concepts/diff/)
