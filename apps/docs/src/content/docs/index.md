---
title: SXGerador
description: Plataforma open source para criar, versionar e gerar migrations AdvPL de dicionário de dados Protheus.
template: splash
hero:
  tagline: Crie, versione e gere migrations AdvPL de SX2, SX3 e SIX em uma interface moderna. Sem planilhas, sem SIGACFG, sem perder horas com X3_USADO.
  image:
    file: ../../../public/logo.svg
  actions:
    - text: Início rápido
      link: /getting-started/
      icon: right-arrow
      variant: primary
    - text: GitHub
      link: https://github.com/sxgerador/sxgerador
      icon: external
      variant: minimal
---

import { Card, CardGrid } from '@astrojs/starlight/components';

## Por que SXGerador?

<CardGrid stagger>
  <Card title="SX2/SX3/SIX em um lugar" icon="document">
    Tabelas, campos e índices com validação automática de prefixo, bitmaps de X3_USADO e índice principal único.
  </Card>
  <Card title="Migration AdvPL gerada" icon="seti:typescript">
    Exporte scripts `.PRW` prontos para rodar no Protheus, com `CriaSX3()` e `CriaSIX()`.
  </Card>
  <Card title="Colaboração por equipe" icon="puzzle">
    Convide outros devs, controle papéis (Owner / Admin / Member / Viewer) e versione dicionários em time.
  </Card>
  <Card title="Templates da comunidade" icon="rocket">
    Aplique tabelas reutilizáveis em um clique ou publique as suas para o ecossistema.
  </Card>
</CardGrid>

## Comece em 5 minutos

1. [Crie sua conta gratuita](https://sxgerador.com.br/signup)
2. Siga o [tutorial Primeira migration em 5 min](/first-migration/)
3. Baixe o `.PRW` gerado e compile no Protheus

---

Open source · MIT · Não é um produto oficial TOTVS.
