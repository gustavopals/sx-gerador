---
title: Início rápido
description: Crie sua conta, configure seu primeiro projeto SXGerador e modele uma tabela em poucos minutos.
---

Este guia leva você de zero ao primeiro projeto no SXGerador em ~5 minutos.

## O que você vai precisar

- Um navegador moderno (Chrome, Edge, Firefox)
- Um email válido para confirmação de conta
- (Opcional) Um ambiente Protheus para compilar e testar a migration gerada

> Não tem Protheus à mão? Tudo bem — o SXGerador gera o script `.PRW` mesmo assim, você pode arquivar para usar depois.

## 1. Crie sua conta

1. Acesse [sxgerador.com.br](https://sxgerador.com.br)
2. Clique em **Começar grátis**
3. Preencha nome, email e senha
4. Confirme o email através do link enviado

## 2. Crie seu primeiro projeto

Logado, clique em **Novo projeto** e preencha:

| Campo             | Descrição                         | Exemplo                    |
| ----------------- | --------------------------------- | -------------------------- |
| **Nome**          | Identificação do projeto          | `Cadastro de Equipamentos` |
| **Slug**          | Identificador único, lowercase    | `cad-equipamentos`         |
| **Visibilidade**  | `PRIVATE`, `UNLISTED` ou `PUBLIC` | `PRIVATE`                  |
| **Dono**          | Pessoal ou Equipe                 | `Pessoal`                  |
| **TAMFIL padrão** | Tamanho do código de filial       | `2`                        |
| **Idioma padrão** | Idioma principal dos títulos      | `pt-BR`                    |

## 3. Adicione uma tabela

Dentro do projeto, clique em **Nova tabela** e informe:

- **Prefixo**: 3 letras começando com `Z` (ex. `ZGE`)
- **Nome PT/ES/EN**: descrição trilíngue (ex. `Equipamentos`, `Equipos`, `Equipment`)
- **Modo Compartilhado**: empresa, unidade, filial (geralmente `Compartilhado`)
- **Módulos**: marque os módulos TOTVS aplicáveis (FAT, EST, etc.)

O campo `ZGE_FILIAL` é criado automaticamente como primeiro campo (`C`, tamanho TAMFIL).

## 4. Adicione campos e índices

- Em **Campos**, clique **Novo campo** e defina nome (`ZGE_CODIGO`), tipo (`C`), tamanho, picture, validações etc.
- Em **Índices**, crie ao menos um com **ordem `1`** (índice único principal).

> ✋ **Regra crítica:** cada tabela tem **exatamente um** índice com `ORDEM = 1`. O SXGerador bloqueia o cadastro de um segundo.

## 5. Gere a migration

1. Vá em **Migrations → Gerar**
2. Selecione as tabelas/campos/índices a incluir
3. Clique em **Gerar `.PRW`**
4. Baixe o arquivo e compile no Protheus

## Próximos passos

- 📘 [Primeira migration em 5 min — tutorial detalhado](/first-migration/)
- 📚 [Referência completa do SX3](/reference/sx3/)
- 👥 [Convidando sua equipe](/concepts/projects/)
