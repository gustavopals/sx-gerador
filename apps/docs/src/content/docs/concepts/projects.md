---
title: Projetos e equipes
description: Como organizar dicionários por projeto e colaborar em equipe.
---

Um **projeto** no SXGerador é um agrupamento de tabelas, campos e índices que pertencem a um mesmo dicionário. Cada projeto tem um dono — uma pessoa ou uma equipe.

## Projetos pessoais

Quando você cria um projeto sem associar a uma equipe, ele é **pessoal** (`ownerUserId` populado). Só você acessa, edita e gera migrations.

## Projetos de equipe

Para colaborar, crie uma **equipe** em **Equipes → Nova equipe**, escolha um nome e slug único. Depois crie ou transfira projetos para ela.

### Convidando membros

Dentro do projeto da equipe, clique em **Convidar**. O convite é enviado por email com um link que expira em **7 dias**. O convidado aceita logado e entra na equipe com o papel escolhido.

### Papéis

| Papel  | Pode editar dicionário | Pode convidar | Pode mudar config | Pode deletar equipe |
| ------ | ---------------------- | ------------- | ----------------- | ------------------- |
| OWNER  | ✅                     | ✅            | ✅                | ✅                  |
| ADMIN  | ✅                     | ✅            | ✅                | ❌                  |
| MEMBER | ✅                     | ❌            | ❌                | ❌                  |
| VIEWER | ❌                     | ❌            | ❌                | ❌                  |

## Visibilidade

| Visibilidade       | Quem vê         | Onde aparece               |
| ------------------ | --------------- | -------------------------- |
| `PRIVATE` (padrão) | Só dono/equipe  | Em nenhum lugar público    |
| `UNLISTED`         | Quem tem o link | Acessível, mas não listado |
| `PUBLIC`           | Todos           | Listado na vitrine pública |

> Mesmo em projetos públicos, **só donos/equipe podem editar**. Visitantes têm acesso somente-leitura.

## Transferência de ownership

Em **Equipe → membros → ações → Transferir ownership**, o OWNER atual passa o papel para outro membro. O OWNER anterior vira ADMIN automaticamente.

A equipe sempre tem **pelo menos um OWNER**. Tentar remover o último OWNER falha com erro.

## Multi-tenant lógico

O SXGerador é multi-tenant lógico: todas as entidades carregam `ownerUserId` **ou** `ownerTeamId` (nunca ambos). Não há separação física por banco — a isolação se dá pela camada de permissões.
