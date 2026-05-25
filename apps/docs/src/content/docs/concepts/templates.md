---
title: Templates
description: Snapshots reutilizáveis de tabelas para aplicar em qualquer projeto.
---

Um **template** é uma cópia versionada de uma tabela completa — com campos e índices — que pode ser aplicada em qualquer projeto com um clique.

## Quando usar templates

- Cadastros recorrentes (clientes, produtos, fornecedores) que você cria em cada cliente novo
- Esqueletos de tabelas comuns (com `FILIAL`, `CODIGO`, `DESCRI`, `STATUS`, índice principal)
- Pacotes oficiais validados pela comunidade

## Aplicando um template

1. Vá em **Templates** na sidebar
2. Filtre por categoria (Financeiro / Estoque / Vendas / RH / Genéricos)
3. Clique em **Aplicar** no card desejado
4. Escolha o projeto destino e (opcionalmente) um prefixo customizado
5. Confira o preview e aplique

O sistema cria a tabela, seus campos e índices em uma única transação — tudo ou nada.

## Override de prefixo

Se o template tem prefixo `ZGE` mas você quer aplicar como `ZHQ` no seu projeto, informe `ZHQ` no campo **Prefixo (opcional)**. O SXGerador remapeia automaticamente:

- Nome físico: `ZGE010` → `ZHQ010`
- Todos os campos: `ZGE_CODIGO` → `ZHQ_CODIGO`
- Chaves de índice e expressões relacionadas

## Publicando seus próprios templates

Dentro da tabela, clique em **Publicar como template**. Informe nome, descrição e categoria. A tabela vira pública na galeria e outros usuários podem aplicar.

Templates publicados por usuário ficam marcados como **Comunidade**; templates curados pelo time SXGerador ficam como **Oficial**.

## Contador de downloads

Cada vez que alguém aplica seu template, o contador incrementa. É só para visibilidade — não há limite ou cobrança.
