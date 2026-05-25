# Post de lançamento — TDN (TOTVS Developer Network)

> TDN é a comunidade oficial TOTVS. Tom mais técnico, menos marketing.
> URL: tdn.totvs.com — categorias relevantes: AdvPL, Protheus Framework, Migrations.

---

## Título sugerido

```
[Open Source] SXGerador — Plataforma web pra criar e versionar SX2/SX3/SIX gerando migration AdvPL
```

---

## Corpo do post

```
Pessoal, boa tarde!

Compartilho aqui um projeto open source que venho desenvolvendo e que talvez
seja útil para quem mantém customizações em dicionário Protheus.

## Contexto

Toda vez que precisamos criar tabelas customizadas (prefixo Z*), passamos
pelo mesmo ritual: SIGACFG aberto, lembrar de cada coluna do SX3, marcar
o X3_USADO certo (sem quebrar nada), criar o índice principal, replicar
em outro ambiente... E quando o cliente pede para colocar isso em
versionamento, a gente improvisa.

O SXGerador foi feito para resolver isso.

## O que ele faz

- Interface web para modelar SX2, SX3 e SIX com validação automática:
  - Prefixo deve começar com Z (bloqueia tabelas TOTVS)
  - Nome de campo até 10 chars
  - Exatamente 1 índice com ORDEM=1 por tabela
  - X3_USADO codificado pelo sistema (não tem como errar)
  - X2_MODULO e X3_MODULO codificados também
- Trilíngue (PT/ES/EN) como o Protheus espera
- Gera arquivo .PRW pronto com CriaSX2(), CriaSX3() e CriaSIX()
- Colaboração em equipe (Owner/Admin/Member/Viewer)
- Templates: publique uma tabela como template e a comunidade reaplica
- Diff visual entre versões + histórico completo de alterações

## Stack

- Frontend: Angular 21 + PO-UI 21 (Standalone + Signals)
- Backend: Node 22 + Express 4 + Prisma 6 + PostgreSQL 16
- Monorepo Turborepo + pnpm
- Lógica de geração AdvPL isolada em packages/advpl-builder
  (sem dependência de banco/framework, 100% testado)

## Como começar

Hospedado: https://sxgerador.com.br (grátis durante o beta público)
Docs: https://docs.sxgerador.com.br
Código: https://github.com/sxgerador/sxgerador (MIT)

Para rodar local:
- git clone, pnpm install
- pnpm db:up && pnpm dev
- Acessar http://localhost:4200

## Importante

- Não é produto oficial TOTVS, é projeto da comunidade.
- O SXGerador gera o .PRW; quem compila e executa no Protheus é você, no
  seu ambiente. Não conectamos no AppServer de ninguém.
- Apenas tabelas com prefixo Z* (customizadas) — não permitimos cadastrar
  tabelas S*/A*/T* etc. para evitar conflito com dicionário TOTVS.

## Próximos passos

Estamos em fase de feedback. Se você é dev Protheus e quer experimentar, abre
um issue contando o que faltou, o que confundiu, ou o que poderia melhorar.
Bugs e PRs também são muito bem-vindos.

Abraço,
Gustavo
```

---

## Tags TDN

`AdvPL`, `Protheus`, `Migration`, `Open Source`, `Dicionario de Dados`

## Dicas para o post no TDN

- **Não vincule a marketing.** O TDN é técnico — escreve como se estivesse explicando para um colega sênior.
- **Responda comentários nas primeiras 6h.** O algoritmo do TDN bombea posts com engajamento rápido.
- **Linka issues GitHub** quando alguém perguntar sobre limitação ou roadmap. Mostra que o projeto está vivo.
- **Não prometa SLA.** Diga claramente que é projeto da comunidade.

## Cross-post relacionado

Após 2-3 dias do post principal, considere:

- Post curto sobre **X3_USADO** (deep dive técnico) — atrai outro público
- Post sobre **diff visual entre versões** — útil para times que estão refatorando
