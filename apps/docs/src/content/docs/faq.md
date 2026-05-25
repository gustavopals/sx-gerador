---
title: FAQ
description: Perguntas frequentes sobre o SXGerador.
---

## Geral

### O SXGerador substitui o SIGACFG?

Para **criação e versionamento** de dicionário customizado (`Z*`), sim. Para administração de dicionários TOTVS (`S*`, `A*` etc.), você continua usando o SIGACFG do seu ambiente. O SXGerador bloqueia o cadastro de prefixos que não comecem com `Z`.

### É um produto oficial TOTVS?

Não. SXGerador é um projeto **open source da comunidade**, independente da TOTVS. Não há vínculo, parceria ou endorsement oficial.

### Meus dados ficam onde?

Você roda o SXGerador na infraestrutura da equipe central (sxgerador.com.br) ou self-hosted no seu próprio ambiente. O código é MIT — você pode fazer fork e hospedar internamente sem custo.

### Custa quanto?

O SaaS oficial é gratuito durante o V1. Self-hosted sempre será gratuito.

## Técnico

### Posso importar dicionários existentes?

Sim. Em **Fase 8** do roadmap, suportamos import de JSON/CSV exportado de SX2/SX3/SIX. O parser detecta o formato e mostra preview de diff antes de aplicar.

### Onde fica o código que gera o `.PRW`?

No pacote [`packages/advpl-builder`](https://github.com/sxgerador/sxgerador/tree/main/packages/advpl-builder) — lógica pura, sem dependências de banco/framework, 100% testada.

### Como funciona o `X3_USADO`?

Ver a página dedicada: [X3_USADO — O bitmap crítico](/reference/x3-usado/).

### Posso publicar templates de tabelas?

Sim. Dentro de qualquer tabela, clique em **Publicar como template** e ela vira disponível na galeria pública. Outros usuários podem aplicar com um clique no projeto deles, escolhendo um novo prefixo se necessário.

### O SXGerador grava em algum ambiente Protheus?

Não diretamente. Ele **gera o script `.PRW`** que você compila e executa no seu ambiente Protheus. Não há conexão com seu AppServer.

## Colaboração

### Quantas pessoas cabem em uma equipe?

Sem limite no plano gratuito. Convide via email; o convidado aceita por link com token de 7 dias.

### Como funcionam os papéis?

| Papel      | O que pode fazer                                                        |
| ---------- | ----------------------------------------------------------------------- |
| **OWNER**  | Tudo, incluindo deletar a equipe e transferir ownership                 |
| **ADMIN**  | Tudo exceto deletar a equipe e remover OWNERs                           |
| **MEMBER** | Edita conteúdo (tabelas/campos/índices); não convida nem remove ninguém |
| **VIEWER** | Apenas leitura                                                          |

### Posso ter projetos privados?

Sim — visibilidade `PRIVATE` (padrão), `UNLISTED` (acessível por link), ou `PUBLIC` (listado na vitrine).

## Suporte

### Como reporto um bug?

[Abra um issue no GitHub](https://github.com/sxgerador/sxgerador/issues/new/choose). É o canal principal de feedback.

### Posso contribuir?

Sim, com prazer! Veja [Contribuindo](/contributing/).

### Tem Discord/Telegram?

Em construção — entraremos em contato com os primeiros usuários. Por enquanto, o canal mais ativo é o GitHub Issues.
