---
title: X3_USADO — O bitmap crítico
description: Como o SXGerador codifica e decodifica o campo X3_USADO sem quebrar o Protheus.
---

`X3_USADO` é o campo mais delicado do dicionário Protheus. Um erro de codificação aqui pode **quebrar o ERP em produção** — campos somem de browses, filtros falham, relatórios voltam vazios.

## O que é

`X3_USADO` é um **bitmap de 120 caracteres** onde cada char representa 8 bits. Cada bit indica se o campo está habilitado em um determinado "uso" do sistema (browse, alteração, contexto X, Y, Z...).

A codificação usa caracteres ASCII estendidos (`þ`, `ý`, `Ø`, etc.) — não é base64, é uma codificação proprietária TOTVS.

## Por que isso é problema?

- Edição manual no SIGACFG é fácil de errar
- Cópia entre ambientes pode corromper o encoding
- Há 960 bits → 1.7 × 10^288 combinações possíveis

## Como o SXGerador resolve

Na UI, você marca/desmarca **flags lógicas** (ex. "Visível em browse", "Editável em alteração"). O `@sxgerador/advpl-builder` codifica para o formato binário correto e a migration sai com o `X3_USADO` exato esperado pelo Protheus.

```typescript
import { decodeX3Usado, encodeX3Usado } from '@sxgerador/advpl-builder';

const encoded = encodeX3Usado({
  visivelBrowse: true,
  editavelAlteracao: true,
  contexto: 'real',
  modulos: ['FAT', 'EST'],
  // ...
});

console.log(encoded); // "þþþþþþþþØý..." (120 chars)

const flags = decodeX3Usado(encoded);
console.log(flags.visivelBrowse); // true
```

## Cobertura de testes

O pacote `@sxgerador/advpl-builder` tem **100% de cobertura** sobre as funções de encode/decode:

- Round-trip: `decode(encode(flags)) === flags`
- Bytes fixos: comparação contra exemplos reais extraídos de SX3 de produção
- Edge cases: bitmaps todos-zero, todos-um, com bits isolados

> Se você está debugando um `X3_USADO` específico, abra um issue no GitHub colando o valor codificado — adicionamos como caso de teste.

## Veja também

- [`X2_MODULO` e `X3_MODULO`](/reference/sx3/#geração-advpl) — bitmaps menores com a mesma estratégia
- [Código fonte do encoder](https://github.com/sxgerador/sxgerador/tree/main/packages/advpl-builder)
