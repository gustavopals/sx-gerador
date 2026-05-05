# SXGerador

> **Plataforma open & free para a comunidade Protheus criar, versionar e gerar migrations de dicionário de dados (SX2, SX3, SIX) com uma experiência moderna.**

---

**Documento:** IDEIA.md — Concepção, Arquitetura e Roadmap
**Versão:** 1.0
**Status:** Concepção
**Última atualização:** 2026-05-05

---

## Sumário

1. [Sumário Executivo](#1-sumário-executivo)
2. [Visão e Missão](#2-visão-e-missão)
3. [Problema](#3-problema)
4. [Solução](#4-solução)
5. [Público-alvo](#5-público-alvo)
6. [Princípios do Produto](#6-princípios-do-produto)
7. [Diferenciais](#7-diferenciais)
8. [Stack Tecnológica](#8-stack-tecnológica)
9. [Arquitetura](#9-arquitetura)
10. [Domínio: Dicionário de Dados Protheus](#10-domínio-dicionário-de-dados-protheus)
11. [Modelo de Dados (Prisma)](#11-modelo-de-dados-prisma)
12. [Funcionalidades Detalhadas](#12-funcionalidades-detalhadas)
13. [API Backend](#13-api-backend)
14. [Geração de Migration AdvPL](#14-geração-de-migration-advpl)
15. [UX e Design](#15-ux-e-design)
16. [Segurança e LGPD](#16-segurança-e-lgpd)
17. [Observabilidade](#17-observabilidade)
18. [Performance](#18-performance)
19. [Internacionalização e Acessibilidade](#19-internacionalização-e-acessibilidade)
20. [Testes](#20-testes)
21. [Deploy e Infraestrutura](#21-deploy-e-infraestrutura)
22. [Estrutura do Monorepo](#22-estrutura-do-monorepo)
23. [Convenções de Código](#23-convenções-de-código)
24. [Roadmap de Desenvolvimento](#24-roadmap-de-desenvolvimento)
25. [KPIs e Métricas de Sucesso](#25-kpis-e-métricas-de-sucesso)
26. [Visão de Futuro (V2+)](#26-visão-de-futuro-v2)
27. [Glossário](#27-glossário)

---

## 1. Sumário Executivo

**SXGerador** é uma aplicação web SaaS, gratuita e aberta à comunidade, que permite a desenvolvedores e consultores TOTVS Protheus modelarem visualmente o dicionário de dados (tabelas — SX2, campos — SX3, índices — SIX) e gerarem **scripts de migration AdvPL** (`.PRW`) prontos para serem executados em qualquer ambiente Protheus.

A aplicação substitui o tedioso fluxo de cadastro manual no SIGACFG por uma interface moderna em Angular + PO-UI, com versionamento, colaboração em equipe, templates reutilizáveis e exportação de migrations versionadas estilo "Laravel migrations" — porém para o universo Protheus.

**Por que isso importa:** SIGACFG é uma das interfaces mais sofridas do ecossistema TOTVS. Cadastrar uma tabela com 30 campos pode levar horas, é propenso a erro humano, não é versionável e não permite trabalho colaborativo. SXGerador resolve essas três dores de uma vez.

**Modelo:** 100% gratuito para a comunidade, código aberto, sem features pagas, sem ads.

---

## 2. Visão e Missão

### Visão
Tornar-se a ferramenta padrão da comunidade Protheus para modelagem e versionamento de dicionário de dados, equivalente ao que o **Flyway/Liquibase** representam para bancos relacionais ou o **Laravel Migrations** representa para o ecossistema PHP.

### Missão
Devolver tempo aos desenvolvedores Protheus, eliminando trabalho repetitivo, reduzindo erros de cadastro e habilitando práticas modernas de engenharia de software (versionamento, code review, CI/CD) num ecossistema historicamente carente delas.

### Valores
- **Comunidade primeiro**: o produto é da comunidade, para a comunidade.
- **Zero fricção**: signup em segundos, primeiro `.PRW` gerado em minutos.
- **Open by default**: roadmap público, código aberto, decisões transparentes.
- **Qualidade técnica**: aplicação bonita, performática, acessível, bem testada.

---

## 3. Problema

### 3.1 As dores reais do desenvolvedor Protheus

| Dor | Impacto |
|---|---|
| SIGACFG é lento, com UX dos anos 2000 | Cadastrar 1 tabela com 20 campos = ~1h de trabalho manual |
| Cadastro manual está sujeito a erros (campo errado, tipo errado, esqueceu o `X3_USADO`) | Bugs em produção, retrabalho |
| Não há versionamento nativo | Impossível auditar "quem mudou o quê e quando" |
| Difícil replicar entre ambientes (DEV → HOMOLOG → PROD) | Inconsistências de dicionário entre ambientes |
| Não há colaboração: dois devs não conseguem trabalhar no mesmo dicionário | Bloqueio em times grandes |
| Não há templates ou reuso | Sempre se começa do zero |
| Bitmaps codificados (`X3_USADO`, `X2_MODULO`) são confusos | Erros silenciosos que só aparecem em runtime |
| Não há diff entre dicionários | Impossível comparar dicionário de cliente A com cliente B |

### 3.2 Soluções existentes e suas limitações

- **SIGACFG (TOTVS Configurador)** — interface oficial. Funcional mas arcaica, sem versionamento, sem colaboração.
- **Scripts AdvPL manuais (`U_CriaTabela()`)** — versionáveis no Git, mas sem UI; o dev precisa decorar a assinatura das funções e digitar 30+ campos no editor.
- **Patches `.ptm` exportados** — bons para deploy, mas opacos: você não consegue editar, só aplicar.
- **Manipulação SQL direta nas SX** — perigoso, sem validação, fácil corromper dicionário.
- **Ferramentas pagas/proprietárias de algumas consultorias** — caras, fechadas, geralmente legadas.

**Conclusão:** existe um espaço claro para uma ferramenta web moderna, gratuita e colaborativa.

---

## 4. Solução

SXGerador entrega:

1. **Interface moderna** (Angular 21 + PO-UI 21) para cadastrar tabelas, campos e índices Protheus, com validações em tempo real e UX otimizada para entrada rápida de dados.
2. **Geração automática de migrations AdvPL** (`.PRW`) versionadas, com numeração sequencial estilo `001_cria_tabela_zzz.prw`.
3. **Projetos e equipes**: cada usuário pode ter múltiplos dicionários (projetos) e colaborar com outros membros.
4. **Templates**: pacotes pré-prontos (ex: "tabela financeira padrão", "tabela de cadastro com X campos básicos") reutilizáveis pela comunidade.
5. **Importação de dicionário existente**: parse de SX3/SX2/SIX exportados, permitindo trazer um dicionário legado pra dentro da plataforma.
6. **Versionamento de migrations**: cada conjunto de mudanças vira uma migration imutável, auditável.
7. **Diff entre versões**: visualizar exatamente o que mudou entre dois pontos no tempo.
8. **Export multiplataforma**: gerar `.PRW`, JSON, CSV ou patch `.ptm`.

---

## 5. Público-alvo

### Persona 1 — Dev Protheus Júnior/Pleno (primário)
- 22-35 anos, trabalha em consultoria ou empresa que usa Protheus
- Sofre com SIGACFG diariamente
- Quer ferramentas modernas para automatizar trabalho repetitivo
- Já usa Git, conhece conceitos de migration

### Persona 2 — Consultor TOTVS Independente (primário)
- Atende múltiplos clientes
- Precisa replicar customizações entre ambientes diferentes
- Valor principal: padronização e reuso de templates

### Persona 3 — Tech Lead / Arquiteto Protheus (secundário)
- Define padrões para equipes
- Quer auditoria e governança do dicionário
- Valor principal: visibilidade e versionamento

### Persona 4 — Estudante / Iniciante em Protheus (terciário)
- Aprendendo o ecossistema TOTVS
- Valor principal: barreira de entrada baixa (vs SIGACFG complexo)

---

## 6. Princípios do Produto

1. **100% gratuito**, sempre. Sem tier pago, sem features escondidas.
2. **Sem login obrigatório para o gerador básico** (modo "playground" cria `.PRW` sem cadastro).
3. **Privacidade primeiro**: o conteúdo dos dicionários é privado por padrão. Compartilhamento é opt-in.
4. **Não armazena credenciais Protheus**. A ferramenta nunca se conecta a um Protheus do usuário; gera scripts que o usuário aplica manualmente.
5. **Sem lock-in**: tudo pode ser exportado em JSON aberto a qualquer momento.
6. **Performático**: cadastrar 100 campos não pode travar.
7. **Acessível**: WCAG 2.1 nível AA.
8. **Trilíngue** (PT/EN/ES) — refletindo a realidade do Protheus que suporta 3 idiomas em todos os campos.

---

## 7. Diferenciais

| Critério | SIGACFG | Scripts manuais | **SXGerador** |
|---|---|---|---|
| UX moderna | ❌ | ❌ | ✅ |
| Validação em tempo real | Parcial | ❌ | ✅ |
| Versionamento Git-friendly | ❌ | ✅ | ✅ |
| Colaboração em equipe | ❌ | Parcial (via Git) | ✅ |
| Templates reutilizáveis | ❌ | Manual | ✅ |
| Diff entre versões | ❌ | Via Git | ✅ (visual) |
| Multi-ambiente | ❌ | Manual | ✅ |
| Bitmaps amigáveis (X3_USADO) | ❌ | ❌ | ✅ (UI com checkboxes) |
| Trilíngue PT/EN/ES integrado | Sim | Manual | ✅ |
| Custo | Licença TOTVS | Tempo do dev | **Grátis** |

---

## 8. Stack Tecnológica

### 8.1 Frontend
- **Angular 21** (Standalone Components, Signals, novos `@if/@for`)
- **PO-UI 21** (TOTVS — biblioteca oficial; alinhamento visual com o ecossistema TOTVS é estratégico)
- **TypeScript 5.6+** (strict mode)
- **RxJS** (apenas onde necessário; preferência por Signals)
- **NgRx Signal Store** (estado global tipado e reativo)
- **Vite** (via Angular CLI nativo a partir do 18+)

### 8.2 Backend
- **Node.js 22 LTS**
- **Express 4** (rotas REST)
- **Prisma 6** (ORM + migrations PostgreSQL)
- **Zod** (validação de payloads)
- **TypeScript 5.6+**
- **bcrypt** (hash de senhas)
- **jsonwebtoken** (JWT + refresh tokens)
- **helmet, cors, express-rate-limit** (segurança)
- **pino** (logs estruturados)

### 8.3 Banco de Dados
- **PostgreSQL 16+**
- Schema versionado via Prisma migrations
- Backups diários (recomendado em produção)

### 8.4 Infraestrutura e Tooling
- **Turborepo** (monorepo + cache de builds)
- **pnpm 9** (gerenciador de pacotes — workspaces)
- **Docker / Docker Compose** (dev local + deploy)
- **GitHub Actions** (CI/CD)
- **ESLint + Prettier** (lint e formatação)
- **Husky + lint-staged** (git hooks)
- **Commitlint + Conventional Commits**

### 8.5 Ferramentas de Apoio
- **Vitest** (testes unitários — mais rápido que Jest)
- **Playwright** (testes E2E)
- **Storybook** (componentes UI isolados — opcional V1)
- **Sentry** (erro tracking em produção — opcional V1)

---

## 9. Arquitetura

### 9.1 Diagrama lógico de alto nível

```
┌────────────────────────────────────────────────────────────────────┐
│                          USUÁRIO (browser)                         │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                    apps/web — Angular 21 + PO-UI                   │
│   • Páginas (projetos, tabelas, campos, índices, equipes)          │
│   • Signal Stores (estado)                                         │
│   • HttpInterceptors (JWT, erros, loading)                         │
└────────────────────────────────┬───────────────────────────────────┘
                                 │ REST /api/v1/*
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│              apps/api — Node 22 + Express + Prisma                 │
│   • Auth middleware                                                │
│   • Controllers / Services / Repositories                          │
│   • Validação Zod                                                  │
│   • Geração AdvPL (chama @sxgerador/advpl-builder)                 │
└──────────┬─────────────────────────────────────────┬───────────────┘
           │                                         │
           ▼                                         ▼
┌──────────────────────┐                  ┌──────────────────────┐
│  PostgreSQL 16       │                  │  packages/*          │
│  (Prisma)            │                  │  (lógica reutilizável)│
└──────────────────────┘                  └──────────────────────┘
```

### 9.2 Decisões arquiteturais (ADRs resumidos)

| # | Decisão | Por quê |
|---|---|---|
| ADR-001 | Monorepo com Turborepo + pnpm | Compartilhamento de tipos e lógica entre web e api; build cache |
| ADR-002 | REST em vez de GraphQL | Simplicidade, melhor cache HTTP, suficiente para o domínio |
| ADR-003 | PostgreSQL em vez de MySQL | JSONB nativo (útil para campos flexíveis), melhor full-text search |
| ADR-004 | Prisma em vez de TypeORM/Drizzle | Schema declarativo, melhor DX, migrations robustas |
| ADR-005 | JWT + Refresh Token (não session cookies) | Apps SaaS modernos; permite mobile/CLI futuro |
| ADR-006 | Geração AdvPL em pacote isolado (`@sxgerador/advpl-builder`) | Testável isoladamente; pode virar lib npm pública |
| ADR-007 | Signal Store em vez de NgRx clássico | Menos boilerplate; alinhado ao Angular moderno |
| ADR-008 | PO-UI em vez de Material/PrimeNG | Look & feel TOTVS = familiaridade do público-alvo |
| ADR-009 | Validações duplas (frontend + backend) com Zod compartilhado | Defesa em profundidade; UX rápida + segurança |
| ADR-010 | Multi-tenant lógico (não físico) | Simplicidade; um único banco com `userId`/`teamId` em todas as tabelas |

---

## 10. Domínio: Dicionário de Dados Protheus

Esta seção documenta o conhecimento de domínio embutido na aplicação. Toda decisão de modelagem deriva daqui.

### 10.1 SX2 — Dicionário de Tabelas

A SX2 contém uma linha por tabela do dicionário. Campos relevantes para o SXGerador:

| Campo | Tipo | Tam | Descrição | Obs |
|---|---|---|---|---|
| `X2_CHAVE` | C | 3 | Prefixo da tabela (ex: `ZZZ`, `SA1`) | Chave primária lógica |
| `X2_PATH` | C | 40 | Path físico (deprecated em SQL) | Geralmente vazio |
| `X2_ARQUIVO` | C | 8 | Nome físico (ex: `ZZZ010`) | Sufixo `010` é padrão multi-empresa |
| `X2_NOME` | C | 30 | Nome da tabela em português | Ex: "Cadastro de Contratos" |
| `X2_NOMESPA` | C | 30 | Nome em espanhol | |
| `X2_NOMEENG` | C | 30 | Nome em inglês | |
| `X2_ROTINA` | C | 40 | Função AdvPL principal que abre a tabela | Ex: `MATA010` |
| `X2_MODO` | C | 1 | Modo de compartilhamento padrão | `C`=Compartilhado / `E`=Exclusivo |
| `X2_MODOUN` | C | 1 | Modo unidade de negócio | |
| `X2_MODOEMP` | C | 1 | Modo empresa | |
| `X2_TTS` | C | 1 | Suporta transação | `S`/`N` |
| `X2_UNICO` | C | 250 | Chave única (índice único da tabela) | Ex: `ZZZ_FILIAL+ZZZ_CODIGO` |
| `X2_PYME` | C | 1 | Disponível no Protheus PYME | `S`/`N` |
| `X2_MODULO` | N | — | Bitmap de módulos onde aparece | Bitwise sobre módulos TOTVS |
| `X2_DISPLAY` | C | 254 | Expressão de display | Pouco usado em customização |
| `X2_SYSOBJ` | C | 100 | Objeto sistema (avançado) | Geralmente vazio |
| `X2_USROBJ` | C | 100 | Objeto usuário (avançado) | Geralmente vazio |
| `X2_POSLGT` | C | 1 | Posiciona Logix | `S`/`N` |
| `X2_CLOB` | C | 1 | Tabela contém CLOB | `S`/`N` |
| `X2_AUTREC` | C | 1 | Auto incremento | `S`/`N` |
| `X2_TAMFIL` | N | — | Tamanho do código de filial | Geralmente 2 ou 4 |
| `X2_TAMUN` | N | — | Tamanho do código de UN | |
| `X2_TAMEMP` | N | — | Tamanho do código de empresa | |
| `X2_DELET` | N | — | Controle de delete | |

### 10.2 SX3 — Dicionário de Campos

A SX3 é o coração do dicionário. Cada linha = um campo de uma tabela. Campos relevantes:

| Campo | Tipo | Tam | Descrição | UI sugerida |
|---|---|---|---|---|
| `X3_ARQUIVO` | C | 3 | Prefixo da tabela | Select da SX2 |
| `X3_ORDEM` | C | 2 | Ordem do campo (`01`, `02`...) | Auto-incremento |
| `X3_CAMPO` | C | 10 | Nome do campo (ex: `ZZZ_CODIGO`) | Input com regex |
| `X3_TIPO` | C | 1 | Tipo: `C`/`N`/`D`/`M`/`L` | Select |
| `X3_TAMANHO` | N | — | Tamanho | Number input |
| `X3_DECIMAL` | N | — | Decimais (só se `N`) | Number input |
| `X3_TITULO` | C | 12 | Título PT | Input |
| `X3_TITSPA` | C | 12 | Título ES | Input |
| `X3_TITENG` | C | 12 | Título EN | Input |
| `X3_DESCRIC` | C | 25 | Descrição PT | Input |
| `X3_DESCSPA` | C | 25 | Descrição ES | Input |
| `X3_DESCENG` | C | 25 | Descrição EN | Input |
| `X3_PICTURE` | C | 45 | Picture (máscara) | Input com sugestões (`@!`, `@E 999,999.99`...) |
| `X3_VALID` | C | 160 | Expressão de validação | Code editor |
| `X3_USADO` | C | 120 | **Bitmap codificado** de "campo está ativo" | UI de checkboxes que codifica/decodifica |
| `X3_RELACAO` | C | 160 | Inicializador padrão (relacionamento) | Code editor |
| `X3_F3` | C | 6 | Consulta padrão (ex: `SA1`) | Select da SXB |
| `X3_NIVEL` | N | — | Nível mínimo de acesso | Number 0-9 |
| `X3_RESERV` | C | 16 | Reservado | Geralmente vazio |
| `X3_CHECK` | C | 1 | Tem check | `S`/`N` |
| `X3_TRIGGER` | C | 1 | Tem trigger (SX7) | `S`/`N` |
| `X3_PROPRI` | C | 1 | Proprietário: `U`=usuário, `S`=sistema | Select |
| `X3_BROWSE` | C | 1 | Aparece no browse | `S`/`N` |
| `X3_VISUAL` | C | 1 | `V`=View, `A`=Alter, `R`=ReadOnly | Select |
| `X3_CONTEXT` | C | 1 | `R`=Real, `V`=Virtual | Select |
| `X3_OBRIGAT` | C | 8 | Obrigatório (expressão) | Input |
| `X3_VLDUSER` | C | 160 | Validação do usuário | Code editor |
| `X3_CBOX` | C | 128 | Combobox PT (formato `1=Sim;2=Não`) | UI de pares chave/valor |
| `X3_CBOXSPA` | C | 128 | Combobox ES | UI de pares |
| `X3_CBOXENG` | C | 128 | Combobox EN | UI de pares |
| `X3_PICTVAR` | C | 50 | Picture variável | Input |
| `X3_WHEN` | C | 100 | Condição "When" | Code editor |
| `X3_INIBRW` | C | 100 | Inicialização para browse | Code editor |
| `X3_GRPSXG` | C | 3 | Grupo SXG (campos compartilhados) | Select da SXG |
| `X3_FOLDER` | C | 1 | Pasta (folder/tab da tela) | Char |
| `X3_PYME` | C | 1 | Visível no PYME | `S`/`N` |
| `X3_CONDSQL` | C | 250 | Condição SQL | Code editor |
| `X3_CHKSQL` | C | 250 | Check SQL | Code editor |
| `X3_IDXSRV` | C | 1 | Índice no servidor | `S`/`N` |
| `X3_ORTOGRA` | C | 1 | Ortografia | `S`/`N` |
| `X3_IDXFLD` | C | 1 | Campo de índice | `S`/`N` |
| `X3_TELA` | C | 15 | Tela | Input |
| `X3_PICBRV` | C | 50 | Picture do browse | Input |
| `X3_AGRUP` | C | 3 | Agrupamento | Input |
| `X3_POSLGT` | C | 1 | Posiciona Logix | `S`/`N` |
| `X3_MODAL` | C | 1 | Modal | `S`/`N` |

#### Bitmap `X3_USADO` (atenção redobrada)

`X3_USADO` é um campo de 120 caracteres onde cada bit indica se o campo é "usado" em determinada situação/módulo. A codificação é tradicional:

- Cada caractere representa 8 bits (bytes ASCII estendidos)
- Caracteres como `þ`, `²`, `°` aparecem como resultado da codificação
- A app **deve fornecer UI amigável** (checkboxes "Usado", "Visível em browse", etc.) e calcular a string codificada nos bastidores

Implementação: criar utilitário `encodeX3Usado(flags: UsadoFlags): string` e seu inverso `decodeX3Usado(encoded: string): UsadoFlags`. Cobertura por testes unitários é **mandatória** — qualquer bug aqui quebra o ERP do usuário em produção.

#### Bitmap `X2_MODULO` e `X3_MODULO`

Indica em quais módulos TOTVS o campo/tabela aparece (FAT, EST, COM, FIN, RH, etc.). Também é bitwise. Mesma estratégia: UI de checkboxes + utilitário de codificação.

### 10.3 SIX — Dicionário de Índices

A SIX define os índices de cada tabela:

| Campo | Tipo | Tam | Descrição |
|---|---|---|---|
| `INDICE` | C | 3 | Prefixo da tabela |
| `ORDEM` | C | 1 | Ordem do índice (`1`, `2`, `3`...) |
| `CHAVE` | C | 160 | Chave (ex: `ZZZ_FILIAL+ZZZ_CODIGO`) |
| `DESCRICAO` | C | 70 | Descrição PT |
| `DESCSPA` | C | 70 | Descrição ES |
| `DESCENG` | C | 70 | Descrição EN |
| `PROPRI` | C | 1 | `U`=usuário, `S`=sistema |
| `F3` | C | 160 | Expressão F3 |
| `NICKNAME` | C | 10 | Apelido |
| `SHOWPESQ` | C | 1 | Aparece em pesquisa F3 |
| `IX_VIRTUAL` | C | 1 | Índice virtual |
| `IX_VIRCUST` | C | 1 | Virtual customizável |

**Regra de negócio crítica:** o índice de ordem `1` é sempre o índice único principal. O SXGerador deve validar isso e nunca permitir mais de um índice com ordem `1`.

### 10.4 Convenções de nomenclatura Protheus

A app deve **enforçar** essas convenções no momento do cadastro:

- **Prefixo de tabela customizada**: `Z*` (ex: `ZA1`, `Z01`, `ZZZ`). Tabelas começando com `S`, `A`, `B`, etc., são padrão TOTVS — bloquear cadastro como customizada e exibir aviso.
- **Nome do campo**: deve começar com o prefixo da tabela seguido de `_` (ex: `ZZZ_CODIGO`, não `CODIGO_ZZZ`).
- **Tamanho máximo do nome do campo**: 10 caracteres incluindo prefixo e underscore (`ZZZ_NOMETXT` = 10 chars).
- **Filial é sempre o primeiro campo**: `<PREFIX>_FILIAL`, tipo `C`, tamanho conforme parâmetro `MV_TAMFIL` (default 2 ou 4).
- **Sufixo da tabela física**: `010` para padrão multi-empresa (ex: `ZZZ010`).


---

## 11. Modelo de Dados (Prisma)

### 11.1 Diagrama ER (mermaid)

```mermaid
erDiagram
    User ||--o{ TeamMember : "membership"
    User ||--o{ Project : "owns (personal)"
    User ||--o{ AuditLog : "performs"
    Team ||--o{ TeamMember : "has"
    Team ||--o{ Project : "owns (team)"
    TeamMember }o--|| User : "user"
    Project ||--o{ Table : "contains"
    Project ||--o{ Migration : "has versions"
    Project ||--o{ ProjectInvite : "invites"
    Table ||--o{ Field : "has"
    Table ||--o{ Index : "has"
    Migration ||--o{ MigrationItem : "contains changes"
```

### 11.2 Schema Prisma (completo)

> Salvar em `apps/api/prisma/schema.prisma`. Comentários `///` viram JSDoc nos tipos gerados.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// AUTENTICAÇÃO E USUÁRIOS
// ============================================================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  emailVerified Boolean  @default(false)
  locale        String   @default("pt-BR") // pt-BR | en-US | es-ES
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  // Relacionamentos
  ownedProjects   Project[]      @relation("ProjectOwner")
  teamMemberships TeamMember[]
  refreshTokens   RefreshToken[]
  auditLogs       AuditLog[]
  invitesSent     ProjectInvite[] @relation("InviteSender")

  @@index([email])
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  userAgent  String?
  ipAddress  String?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
}

model EmailVerificationToken {
  id         String   @id @default(cuid())
  userId     String   @unique
  tokenHash  String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
}

model PasswordResetToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())

  @@index([userId])
}

// ============================================================================
// EQUIPES
// ============================================================================

model Team {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  avatarUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members  TeamMember[]
  projects Project[]    @relation("TeamOwner")
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

model TeamMember {
  id       String   @id @default(cuid())
  teamId   String
  userId   String
  role     TeamRole @default(MEMBER)
  joinedAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

// ============================================================================
// PROJETOS (DICIONÁRIOS)
// ============================================================================

enum ProjectVisibility {
  PRIVATE   // só dono e membros do team
  UNLISTED  // acessível por link direto
  PUBLIC    // listado na vitrine pública (templates da comunidade)
}

model Project {
  id          String            @id @default(cuid())
  name        String
  slug        String
  description String?
  visibility  ProjectVisibility @default(PRIVATE)

  // Owner: ou um usuário (projeto pessoal) ou um team
  ownerUserId String?
  ownerTeamId String?

  // Configurações Protheus default deste projeto
  defaultTamFil Int    @default(2) // tamanho do FILIAL
  defaultLang   String @default("pt-BR")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // soft delete

  ownerUser  User?           @relation("ProjectOwner", fields: [ownerUserId], references: [id])
  ownerTeam  Team?           @relation("TeamOwner", fields: [ownerTeamId], references: [id])
  tables     Table[]
  migrations Migration[]
  invites    ProjectInvite[]

  @@unique([ownerUserId, slug])
  @@unique([ownerTeamId, slug])
  @@index([visibility])
}

enum ProjectInviteStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

model ProjectInvite {
  id        String              @id @default(cuid())
  projectId String
  email     String
  invitedBy String
  role      TeamRole            @default(MEMBER)
  token     String              @unique
  status    ProjectInviteStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime            @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  sender  User    @relation("InviteSender", fields: [invitedBy], references: [id])

  @@index([email])
  @@index([projectId])
}

// ============================================================================
// DICIONÁRIO: TABELAS (SX2)
// ============================================================================

enum SharingMode {
  C // Compartilhado
  E // Exclusivo
}

enum YesNo {
  S // Sim
  N // Não
}

model Table {
  id          String   @id @default(cuid())
  projectId   String

  // SX2 fields
  prefix      String   // X2_CHAVE (3 chars, ex "ZZZ")
  fileName    String   // X2_ARQUIVO (8 chars, ex "ZZZ010")
  namePt      String   // X2_NOME
  nameEs      String?  // X2_NOMESPA
  nameEn      String?  // X2_NOMEENG
  routine     String?  // X2_ROTINA

  modeCompany SharingMode @default(C)  // X2_MODO
  modeUnit    SharingMode @default(C)  // X2_MODOUN
  modeBranch  SharingMode @default(C)  // X2_MODOEMP

  ttsEnabled  YesNo    @default(S)     // X2_TTS
  uniqueKey   String?  @db.VarChar(250)// X2_UNICO
  pyme        YesNo    @default(N)     // X2_PYME

  modules     Int      @default(0)     // X2_MODULO (bitmap)

  hasClob     YesNo    @default(N)     // X2_CLOB
  autoIncRec  YesNo    @default(N)     // X2_AUTREC

  tamFil      Int      @default(2)     // X2_TAMFIL
  tamUn       Int      @default(2)     // X2_TAMUN
  tamEmp      Int      @default(2)     // X2_TAMEMP

  // Metadata adicional
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fields  Field[]
  indexes Index[]

  @@unique([projectId, prefix])
  @@index([projectId])
}

// ============================================================================
// DICIONÁRIO: CAMPOS (SX3)
// ============================================================================

enum FieldType {
  C // Caractere
  N // Numérico
  D // Data
  M // Memo
  L // Lógico
}

enum VisualMode {
  V // View
  A // Alter
  R // ReadOnly
}

enum ContextMode {
  R // Real
  V // Virtual
}

enum OwnerType {
  U // User
  S // System
}

model Field {
  id        String   @id @default(cuid())
  tableId   String

  // Identificação
  name      String   // X3_CAMPO (ex "ZZZ_CODIGO")
  order     String   // X3_ORDEM (ex "01")

  // Tipo e tamanho
  type      FieldType  // X3_TIPO
  size      Int        // X3_TAMANHO
  decimals  Int        @default(0) // X3_DECIMAL

  // Trilíngue — títulos
  titlePt   String   // X3_TITULO
  titleEs   String?  // X3_TITSPA
  titleEn   String?  // X3_TITENG

  // Trilíngue — descrições
  descPt    String   // X3_DESCRIC
  descEs    String?  // X3_DESCSPA
  descEn    String?  // X3_DESCENG

  // Comportamento
  picture       String?  // X3_PICTURE
  pictureVar    String?  // X3_PICTVAR
  pictureBrowse String?  // X3_PICBRV
  validation    String?  // X3_VALID
  userValidation String? // X3_VLDUSER
  defaultRel    String?  // X3_RELACAO
  whenExpr      String?  // X3_WHEN
  initBrowse    String?  // X3_INIBRW

  // Combobox (campos do tipo enum)
  comboPt       String?  // X3_CBOX
  comboEs       String?  // X3_CBOXSPA
  comboEn       String?  // X3_CBOXENG

  // Consulta padrão
  searchKey     String?  // X3_F3 (referencia uma SXB)

  // Flags de comportamento
  visualMode    VisualMode  @default(A)  // X3_VISUAL
  contextMode   ContextMode @default(R)  // X3_CONTEXT
  owner         OwnerType   @default(U)  // X3_PROPRI
  required      String?     // X3_OBRIGAT
  showBrowse    YesNo       @default(S)  // X3_BROWSE
  hasCheck      YesNo       @default(N)  // X3_CHECK
  hasTrigger    YesNo       @default(N)  // X3_TRIGGER
  level         Int         @default(0)  // X3_NIVEL
  pyme          YesNo       @default(N)  // X3_PYME
  serverIndex   YesNo       @default(N)  // X3_IDXSRV
  fieldIndex    YesNo       @default(N)  // X3_IDXFLD
  spelling      YesNo       @default(N)  // X3_ORTOGRA
  modal         YesNo       @default(N)  // X3_MODAL
  positionLogix YesNo       @default(N)  // X3_POSLGT

  // Bitmaps amigáveis (frontend converte de/para X3_USADO)
  usadoFlags    Json     @default("{}") // ex: { browse: true, alter: true, ... }
  modulesFlags  Json     @default("{}") // bitmap por módulo TOTVS

  // SQL
  sqlCondition  String?  // X3_CONDSQL
  sqlCheck      String?  // X3_CHKSQL

  // Outros
  groupSxg      String?  // X3_GRPSXG
  folder        String?  // X3_FOLDER
  screen        String?  // X3_TELA
  grouping      String?  // X3_AGRUP
  reserved      String?  // X3_RESERV

  // Metadata
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  table Table @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@unique([tableId, name])
  @@unique([tableId, order])
  @@index([tableId])
}

// ============================================================================
// DICIONÁRIO: ÍNDICES (SIX)
// ============================================================================

model Index {
  id      String @id @default(cuid())
  tableId String

  order      String  // SIX.ORDEM (1, 2, 3...)
  key        String  // SIX.CHAVE (ex "ZZZ_FILIAL+ZZZ_CODIGO")
  descPt     String  // SIX.DESCRICAO
  descEs     String? // SIX.DESCSPA
  descEn     String? // SIX.DESCENG
  owner      OwnerType @default(U) // SIX.PROPRI
  searchExpr String? // SIX.F3
  nickname   String? // SIX.NICKNAME
  showSearch YesNo   @default(S) // SIX.SHOWPESQ
  isVirtual  YesNo   @default(N) // SIX.IX_VIRTUAL
  virtualCustomizable YesNo @default(N) // SIX.IX_VIRCUST

  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  table Table @relation(fields: [tableId], references: [id], onDelete: Cascade)

  @@unique([tableId, order])
  @@index([tableId])
}

// ============================================================================
// VERSIONAMENTO: MIGRATIONS
// ============================================================================

enum MigrationOperation {
  CREATE_TABLE
  ALTER_TABLE
  DROP_TABLE
  CREATE_FIELD
  ALTER_FIELD
  DROP_FIELD
  CREATE_INDEX
  ALTER_INDEX
  DROP_INDEX
}

enum MigrationStatus {
  DRAFT      // ainda em edição
  GENERATED  // .PRW gerado, imutável a partir daqui
}

model Migration {
  id          String          @id @default(cuid())
  projectId   String
  sequence    Int             // numeração sequencial: 1, 2, 3...
  name        String          // descrição amigável (ex: "Cria tabela ZZZ")
  status      MigrationStatus @default(DRAFT)
  advplCode   String?         @db.Text // código gerado (preenchido ao "GENERATED")
  generatedAt DateTime?
  createdBy   String          // userId
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  project Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items   MigrationItem[]

  @@unique([projectId, sequence])
  @@index([projectId])
}

model MigrationItem {
  id          String             @id @default(cuid())
  migrationId String
  operation   MigrationOperation
  // Snapshot do estado antes/depois (JSON com a estrutura completa)
  beforeState Json?
  afterState  Json?
  // Referência ao objeto afetado (mantida mesmo se o objeto for removido)
  targetType  String  // "TABLE" | "FIELD" | "INDEX"
  targetId    String?
  targetName  String  // nome legível para auditoria
  createdAt   DateTime @default(now())

  migration Migration @relation(fields: [migrationId], references: [id], onDelete: Cascade)

  @@index([migrationId])
}

// ============================================================================
// AUDITORIA
// ============================================================================

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String   // "user.login", "project.create", "field.update", etc.
  entityType String?
  entityId   String?
  metadata   Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ============================================================================
// TEMPLATES DA COMUNIDADE
// ============================================================================

model Template {
  id          String   @id @default(cuid())
  authorId    String?  // null = template oficial
  name        String
  description String?
  category    String   // "Financeiro", "Estoque", "Cadastros básicos"...
  // O conteúdo é um snapshot completo de uma tabela (com campos e índices)
  content     Json
  downloads   Int      @default(0)
  isOfficial  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([isOfficial])
}
```

### 11.3 Considerações sobre o schema

- **Soft delete** em `Project`, `Table`, `Field`, `Index` — permite "lixeira" e restauração; nunca perdemos histórico do usuário.
- **Bitmap codificado fica no frontend/backend, não no banco**. No banco salvamos `usadoFlags` como JSON estruturado (ex: `{ "browse": true, "alter": false }`); a codificação para a string Protheus acontece **no momento da geração da migration**.
- **Trilíngue como colunas separadas** (não JSON) — facilita queries, validações e índices.
- **`Migration.advplCode` é texto imutável** após status `GENERATED`. Funciona como "fonte da verdade" para auditoria.
- **`MigrationItem` armazena snapshots completos** — possibilita "diff visual" e rollback futuro.

---

## 12. Funcionalidades Detalhadas

### F1 — Autenticação e Conta
- Cadastro com email + senha (bcrypt, 12 rounds)
- Verificação de email (token expira em 24h)
- Login com JWT (15min) + Refresh Token (30 dias, rotativo)
- Recuperação de senha
- Logout (revoga refresh token)
- Edição de perfil (nome, avatar, idioma preferido)
- Exclusão de conta (LGPD — direito ao esquecimento)
- (V2) OAuth Google + GitHub

### F2 — Projetos
- Criar projeto pessoal (owner = user)
- Criar projeto de equipe (owner = team)
- Listar meus projetos (pessoais + dos meus times)
- Editar metadados (nome, descrição, visibilidade, defaults)
- Soft-delete + restauração (até 30 dias)
- Duplicar projeto (clonar dicionário)
- Configurações: tamanho default de FILIAL, idioma default

### F3 — Tabelas (SX2)
- CRUD completo
- Validação: prefixo deve começar com `Z` (warning amarelo se não)
- Validação: prefixo único dentro do projeto
- Geração automática do `X2_ARQUIVO` (`<PREFIX>010`) com opção de override
- Edição inline dos modos de compartilhamento
- Visualização agrupada por módulo
- Importação de SX2 existente via upload de JSON/CSV

### F4 — Campos (SX3)
- CRUD completo com formulário em 3 abas:
  - **Aba 1 — Básico**: nome, tipo, tamanho, decimais, títulos trilíngues
  - **Aba 2 — Comportamento**: picture, validações, default, when, browse
  - **Aba 3 — Avançado**: combobox, F3, SQL, bitmaps, flags
- Auto-incremento da `X3_ORDEM` ao criar
- Editor de combobox: UI de pares chave/valor (ex: `1=Sim`, `2=Não`) trilíngue
- Editor visual de `X3_USADO` (checkboxes) com preview da string codificada
- Drag-and-drop para reordenar campos
- Bulk operations: marcar vários como obrigatórios, browse, etc.
- Atalhos de teclado para velocidade
- Code editor (Monaco) embutido para campos de expressão (`X3_VALID`, `X3_RELACAO`...)

### F5 — Índices (SIX)
- CRUD completo
- Builder visual de chave: arrastar campos da tabela para compor (`ZZZ_FILIAL + ZZZ_CODIGO`)
- Validação: índice de ordem `1` é único e obrigatório por tabela
- Validação: chave referencia apenas campos existentes na tabela

### F6 — Geração de Migration AdvPL
- Botão "Gerar Migration" no projeto
- Modal com:
  - Seleção de quais mudanças incluir (desde a última migration)
  - Nome amigável da migration
  - Preview do código `.PRW` gerado
  - Validações pré-geração (ex: "tabela `XYZ` não tem índice de ordem 1")
- Geração: arquivo `.PRW` numerado sequencialmente (`001_cria_tabela_zzz.prw`)
- Migration vira imutável após geração
- Histórico de migrations: lista com data, autor, items afetados, código

### F7 — Versionamento
- Cada operação (criar/editar/excluir tabela/campo/índice) é registrada como `MigrationItem` em uma migration `DRAFT` corrente
- Ao "Gerar Migration", a draft fecha e vira imutável
- Próximas operações iniciam nova draft
- Histórico permite ver "estado em cada ponto do tempo"

### F8 — Equipes
- Criar equipe com nome e slug único
- Convidar por email (link com token expirando em 7 dias)
- Aceitar/recusar convite
- Roles: OWNER (1+), ADMIN, MEMBER, VIEWER
- Permissões:
  - VIEWER: lê tudo, não edita
  - MEMBER: edita conteúdo, não convida nem remove
  - ADMIN: tudo exceto deletar a equipe e remover OWNER
  - OWNER: tudo
- Transferir ownership
- Sair da equipe

### F9 — Importação
- Upload de arquivo JSON/CSV exportado de SX3/SX2/SIX
- Parser detecta automaticamente o formato
- Preview com diff: "vai criar X, atualizar Y, ignorar Z"
- Import em transação (tudo ou nada)
- (V2) Parse de `.PRW` com `CriaSX3()` reverso

### F10 — Templates
- Vitrine pública de templates da comunidade
- Categorias: Financeiro, Estoque, Vendas, RH, Genéricos
- Template = snapshot completo de uma tabela (com campos e índices)
- "Aplicar template" copia tudo para o projeto atual
- Usuários podem publicar templates próprios (review opcional)
- Counter de downloads + favoritos

### F11 — Diff Visual
- Comparar dois projetos
- Comparar dois pontos no tempo de um mesmo projeto
- Output: lista de adições, alterações, remoções com syntax highlight
- Export do diff como markdown ou PDF

### F12 — Export
- Export do projeto inteiro como JSON (formato aberto SXGerador)
- Export como CSV (compatível com importação Protheus)
- Export como `.PRW` consolidado (todas as migrations num arquivo)
- Export como `.ptm` (V2)

### F13 — Search
- Busca global no projeto: tabela, campo, índice
- Filtros: por tipo, por módulo, por flag (obrigatório, virtual...)
- Atalho de teclado `Cmd/Ctrl+K`

### F14 — Playground (sem login)
- Modo "experimental" sem cadastro
- Permite criar 1 tabela com até 10 campos
- Gera `.PRW` para download
- CTA para criar conta e ter projetos persistentes


---

## 13. API Backend

### 13.1 Convenções gerais
- Base URL: `/api/v1`
- Formato: JSON em todas as direções
- Autenticação: header `Authorization: Bearer <jwt>`
- Códigos HTTP: 200/201/204 para sucesso, 4xx para erros do cliente, 5xx para erros do servidor
- Resposta de erro padronizada:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Prefixo deve ter exatamente 3 caracteres",
      "details": { "field": "prefix" }
    }
  }
  ```
- Paginação: query params `?page=1&pageSize=20`; resposta: `{ items, total, page, pageSize, totalPages }`
- Ordenação: `?sort=createdAt:desc,name:asc`
- Filtros: query params específicos por endpoint

### 13.2 Endpoints

#### Auth
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/signup` | Cria usuário |
| POST | `/auth/login` | Login com email/senha |
| POST | `/auth/refresh` | Troca refresh por novo access token |
| POST | `/auth/logout` | Revoga refresh atual |
| POST | `/auth/forgot-password` | Inicia recuperação |
| POST | `/auth/reset-password` | Conclui recuperação |
| GET | `/auth/verify-email/:token` | Verifica email |
| POST | `/auth/resend-verification` | Reenvia email de verificação |

#### Users
| Método | Rota | Descrição |
|---|---|---|
| GET | `/users/me` | Perfil do usuário logado |
| PATCH | `/users/me` | Edita perfil |
| DELETE | `/users/me` | Excluí conta (LGPD) |
| POST | `/users/me/avatar` | Upload de avatar |
| GET | `/users/me/audit-logs` | Histórico de ações |

#### Teams
| Método | Rota | Descrição |
|---|---|---|
| GET | `/teams` | Lista equipes do usuário |
| POST | `/teams` | Cria equipe |
| GET | `/teams/:id` | Detalhe |
| PATCH | `/teams/:id` | Edita |
| DELETE | `/teams/:id` | Exclui (apenas OWNER) |
| GET | `/teams/:id/members` | Lista membros |
| POST | `/teams/:id/invites` | Convida por email |
| DELETE | `/teams/:id/members/:userId` | Remove membro |
| PATCH | `/teams/:id/members/:userId` | Muda role |

#### Projects
| Método | Rota | Descrição |
|---|---|---|
| GET | `/projects` | Lista projetos acessíveis |
| POST | `/projects` | Cria projeto |
| GET | `/projects/:id` | Detalhe |
| PATCH | `/projects/:id` | Edita metadados |
| DELETE | `/projects/:id` | Soft-delete |
| POST | `/projects/:id/restore` | Restaura |
| POST | `/projects/:id/duplicate` | Duplica |
| GET | `/projects/:id/export` | Export JSON do projeto inteiro |
| POST | `/projects/:id/import` | Importa JSON/CSV |

#### Tables (SX2)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/projects/:projectId/tables` | Lista |
| POST | `/projects/:projectId/tables` | Cria |
| GET | `/projects/:projectId/tables/:id` | Detalhe (com fields e indexes) |
| PATCH | `/projects/:projectId/tables/:id` | Edita |
| DELETE | `/projects/:projectId/tables/:id` | Soft-delete |

#### Fields (SX3)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/projects/:projectId/tables/:tableId/fields` | Lista |
| POST | `/projects/:projectId/tables/:tableId/fields` | Cria |
| PATCH | `/projects/:projectId/tables/:tableId/fields/:id` | Edita |
| DELETE | `/projects/:projectId/tables/:tableId/fields/:id` | Soft-delete |
| POST | `/projects/:projectId/tables/:tableId/fields/reorder` | Reordena |
| POST | `/projects/:projectId/tables/:tableId/fields/bulk` | Bulk update |

#### Indexes (SIX)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/projects/:projectId/tables/:tableId/indexes` | Lista |
| POST | `/projects/:projectId/tables/:tableId/indexes` | Cria |
| PATCH | `/projects/:projectId/tables/:tableId/indexes/:id` | Edita |
| DELETE | `/projects/:projectId/tables/:tableId/indexes/:id` | Soft-delete |

#### Migrations
| Método | Rota | Descrição |
|---|---|---|
| GET | `/projects/:projectId/migrations` | Lista |
| GET | `/projects/:projectId/migrations/draft` | Pega draft corrente |
| POST | `/projects/:projectId/migrations/generate` | Fecha draft e gera .PRW |
| GET | `/projects/:projectId/migrations/:id` | Detalhe |
| GET | `/projects/:projectId/migrations/:id/download` | Download do .PRW |
| GET | `/projects/:projectId/migrations/:id/preview` | Preview do .PRW antes de baixar |

#### Templates
| Método | Rota | Descrição |
|---|---|---|
| GET | `/templates` | Vitrine pública |
| GET | `/templates/:id` | Detalhe |
| POST | `/templates` | Publica template |
| POST | `/templates/:id/apply` | Aplica em projeto |

#### Diff
| Método | Rota | Descrição |
|---|---|---|
| POST | `/diff/projects` | Diff entre dois projetos |
| POST | `/diff/migrations` | Diff entre duas migrations |

### 13.3 Validação com Zod (compartilhada)

O pacote `@sxgerador/shared-types` exporta os schemas Zod usados tanto no frontend (validação de formulário) quanto no backend (validação de payload). Exemplo:

```ts
// packages/shared-types/src/schemas/field.schema.ts
import { z } from 'zod';

export const FieldTypeSchema = z.enum(['C', 'N', 'D', 'M', 'L']);

export const CreateFieldSchema = z.object({
  name: z.string()
    .regex(/^[A-Z0-9]{1,3}_[A-Z0-9_]+$/, 'Nome deve seguir o padrão PREFIXO_NOME')
    .max(10, 'Máximo de 10 caracteres'),
  type: FieldTypeSchema,
  size: z.number().int().min(1).max(254),
  decimals: z.number().int().min(0).max(20).default(0),
  titlePt: z.string().max(12),
  titleEs: z.string().max(12).optional(),
  titleEn: z.string().max(12).optional(),
  descPt: z.string().max(25),
  descEs: z.string().max(25).optional(),
  descEn: z.string().max(25).optional(),
  picture: z.string().max(45).optional(),
  validation: z.string().max(160).optional(),
  // ...demais campos
}).refine(
  (data) => data.type === 'N' || data.decimals === 0,
  { message: 'Decimais só pode ser > 0 quando tipo é numérico', path: ['decimals'] }
);

export type CreateFieldInput = z.infer<typeof CreateFieldSchema>;
```

---

## 14. Geração de Migration AdvPL

### 14.1 Pacote `@sxgerador/advpl-builder`

Localização: `packages/advpl-builder/`

Função pura: recebe o estado da migration (lista de `MigrationItem`) e devolve string AdvPL formatada. **Sem dependências de banco, framework ou IO**. 100% testável.

### 14.2 Exemplo de output gerado

```advpl
#INCLUDE "PROTHEUS.CH"

/*/
{Protheus.doc} U_SXG001CriaTblZZZ
@description Migration gerada por SXGerador
@author Gustavo Pals (gustavo@example.com)
@since 05/05/2026
@version 1.0
@type function
@migration 001
@project meu-projeto
/*/
User Function SXG001CriaTblZZZ()
    Local aTabela := {}
    Local aCampos := {}
    Local aIndices := {}
    Local nI       := 0

    // ========================================================================
    // SX2 - Tabela ZZZ010 (Cadastro de Contratos)
    // ========================================================================
    aTabela := {;
        "ZZZ"                          ,;  // X2_CHAVE
        "ZZZ010"                       ,;  // X2_ARQUIVO
        "Cadastro de Contratos"        ,;  // X2_NOME
        "Registro de Contratos"        ,;  // X2_NOMESPA
        "Contracts Registry"           ,;  // X2_NOMEENG
        "C"                            ,;  // X2_MODO
        "S"                            ,;  // X2_TTS
        "ZZZ_FILIAL+ZZZ_CODIGO"        ;   // X2_UNICO
    }
    U_SXGCriaSX2(aTabela)

    // ========================================================================
    // SX3 - Campos da tabela ZZZ
    // ========================================================================
    aAdd(aCampos, {;
        "ZZZ_FILIAL", "01", "C", 02, 0,;
        "Filial", "Sucursal", "Branch",;
        "Filial do Sistema", "Sucursal del Sistema", "System Branch",;
        "@!", "", "þþþþþþþþþþþþþþþ" /* X3_USADO codificado */,;
        "xFilial('ZZZ')", "", 0, "U", "S", "V", "R" ;
    })

    aAdd(aCampos, {;
        "ZZZ_CODIGO", "02", "C", 10, 0,;
        "Código", "Código", "Code",;
        "Código do Contrato", "Código del Contrato", "Contract Code",;
        "@!", "", "þþþþþþþþþþþþþþþ",;
        "", "", 0, "U", "S", "A", "R" ;
    })

    For nI := 1 To Len(aCampos)
        U_SXGCriaSX3(aCampos[nI])
    Next nI

    // ========================================================================
    // SIX - Índices da tabela ZZZ
    // ========================================================================
    aAdd(aIndices, {;
        "ZZZ", "1", "ZZZ_FILIAL+ZZZ_CODIGO",;
        "Codigo", "Codigo", "Code",;
        "U", "", "", "S", "N", "N" ;
    })

    For nI := 1 To Len(aIndices)
        U_SXGCriaIdx(aIndices[nI])
    Next nI

    MsgInfo("Migration 001 aplicada com sucesso!", "SXGerador")
Return Nil
```

A migration **inclui** (via `#INCLUDE` ou anexo) um arquivo helper `SXG_HELPERS.PRW` que define `U_SXGCriaSX2`, `U_SXGCriaSX3`, `U_SXGCriaIdx`. Esse helper é gerado uma única vez por projeto e disponibilizado para download junto da primeira migration.

### 14.3 Algoritmo de geração (pseudocódigo)

```ts
function generateMigration(migration: MigrationWithItems): string {
  const sections: string[] = [];

  sections.push(buildHeader(migration));

  const tables = groupItemsByOperation(migration.items);

  if (tables.created.length) {
    sections.push(buildTableCreations(tables.created));
  }
  if (tables.altered.length) {
    sections.push(buildTableAlterations(tables.altered));
  }
  if (tables.dropped.length) {
    sections.push(buildTableDeletions(tables.dropped));
  }

  // mesma estrutura para fields e indexes...

  sections.push(buildFooter(migration));

  return sections.join('\n\n');
}
```

### 14.4 Validações pré-geração (bloqueantes)

1. Toda tabela criada deve ter **pelo menos 1 índice** com ordem `1`.
2. Toda tabela deve ter campo `<PREFIX>_FILIAL`.
3. Nome de campo deve seguir o padrão `<PREFIX>_*`.
4. Tipo `N` com decimais > 0 deve ter `tamanho > decimais`.
5. Combobox só faz sentido com tipo `C` ou `N`.
6. `X3_F3` deve referenciar uma consulta válida (validação de aviso, não bloqueante).

### 14.5 Codificação `X3_USADO` (atenção)

```ts
// packages/advpl-builder/src/encoders/x3-usado.encoder.ts

export interface UsadoFlags {
  visible: boolean;
  obligatoryEdit: boolean;
  // ... mais 10 flags
}

const FLAG_BITS: Record<keyof UsadoFlags, number> = {
  visible: 0,
  obligatoryEdit: 1,
  // ...
};

export function encodeX3Usado(flags: UsadoFlags): string {
  // Implementação: cria buffer de bytes, seta bits, converte para charset Protheus
  // Total de 120 caracteres no output
}

export function decodeX3Usado(encoded: string): UsadoFlags {
  // Inverso
}
```

**Cobertura por testes obrigatória:** ≥ 95% para esses encoders.

---

## 15. UX e Design

### 15.1 Princípios de UX

1. **Velocidade é feature**: cadastro de campo deve ser possível em < 30 segundos.
2. **Atalhos de teclado em tudo**: `Cmd+K` para busca, `N` para novo campo, `Esc` para cancelar.
3. **Validação inline**: erros aparecem ao lado do campo, não em modais.
4. **Mostrar progresso**: criar tabela com 30 campos = mostrar "12/30 cadastrados".
5. **Undo é sagrado**: toda destruição é recuperável (toasts com "Desfazer" por 10s).
6. **Estado vazio educativo**: telas vazias ensinam o que fazer.
7. **Loading skeletons**, não spinners.

### 15.2 Layouts

```
┌─────────────────────────────────────────────────────────────┐
│  SXGerador  [Projetos]  [Templates]  [Docs]    🔔 👤 PT▾   │  ← po-page-header
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │   Conteúdo principal                             │
│ (po-menu)│                                                  │
│          │                                                  │
│  • Tab.  │                                                  │
│  • Camp. │                                                  │
│  • Indx. │                                                  │
│  • Migr. │                                                  │
│  • Tmpl. │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### 15.3 Telas principais

| Rota | Componente | PO-UI primário |
|---|---|---|
| `/login` | LoginPage | po-page-login |
| `/signup` | SignupPage | po-page-login (modo cadastro) |
| `/dashboard` | DashboardPage | po-widget + po-grid |
| `/projects` | ProjectsListPage | po-page-list |
| `/projects/new` | NewProjectPage | po-page-edit |
| `/projects/:id` | ProjectDetailPage | po-tabs |
| `/projects/:id/tables` | TablesListPage | po-table |
| `/projects/:id/tables/:tableId` | TableDetailPage | po-tabs (Campos, Índices, Histórico) |
| `/projects/:id/tables/:tableId/fields/new` | NewFieldPage | po-stepper (3 passos) |
| `/projects/:id/migrations` | MigrationsListPage | po-table com expansão |
| `/projects/:id/generate` | GenerateMigrationPage | po-modal + po-code-editor |
| `/teams` | TeamsListPage | po-page-list |
| `/teams/:id` | TeamDetailPage | po-tabs |
| `/templates` | TemplatesGalleryPage | grid customizado |
| `/settings` | SettingsPage | po-tabs |

### 15.4 Componentes-chave a construir

| Componente | Descrição |
|---|---|
| `<sxg-field-form>` | Formulário de campo SX3 com 3 abas |
| `<sxg-usado-editor>` | Editor visual do bitmap X3_USADO |
| `<sxg-modules-editor>` | Editor visual do bitmap de módulos |
| `<sxg-combobox-editor>` | Editor de pares chave/valor trilíngue |
| `<sxg-key-builder>` | Builder visual de chave de índice (drag & drop) |
| `<sxg-code-editor>` | Wrapper Monaco para AdvPL/SQL |
| `<sxg-migration-preview>` | Preview do .PRW gerado com syntax highlight |
| `<sxg-diff-viewer>` | Viewer de diff visual |
| `<sxg-empty-state>` | Estado vazio educativo padronizado |
| `<sxg-keyboard-shortcuts-modal>` | Modal de atalhos (`?`) |

### 15.5 Tema e identidade visual
- **Paleta primária**: alinhada ao PO-UI (azul TOTVS) com acento próprio do SXGerador (sugestão: tom verde-esmeralda como destaque de "criação/sucesso").
- **Logo**: ícone abstrato de "SX" com elemento de "engrenagem/forja" — conotação de geração/construção.
- **Tipografia**: pilha do PO-UI (sans-serif sistema) + JetBrains Mono / Fira Code para code editor.
- **Dark mode**: suporte completo desde o início (PO-UI já oferece).

### 15.6 Responsividade
- Desktop-first (público-alvo trabalha em desktop)
- Tablet: layouts ajustam, sidebar colapsa
- Mobile: somente leitura confortável; edição funcional mas não otimizada

### 15.7 Acessibilidade (WCAG 2.1 AA)
- Contraste mínimo 4.5:1 em texto
- Foco visível em todos os elementos interativos
- Navegação completa por teclado
- ARIA labels em todos os ícones
- Mensagens de erro associadas via `aria-describedby`
- Anúncios via `aria-live` para ações assíncronas

---

## 16. Segurança e LGPD

### 16.1 Autenticação
- Senhas: **bcrypt** com cost ≥ 12
- JWT: HS256 com chave de **mínimo 64 caracteres aleatórios**, rotação semestral
- Refresh tokens: armazenados como **hash bcrypt no banco**, nunca em plain
- Refresh tokens são **rotativos** (cada uso revoga o anterior)
- Verificação de email obrigatória antes do primeiro login

### 16.2 Proteções HTTP
- `helmet` com CSP restritiva
- CORS limitado ao domínio do frontend (sem `*` em produção)
- Rate limiting por IP: 100 req/min em rotas públicas, 10 req/min em rotas de auth
- HTTPS obrigatório (HSTS habilitado)
- Cookies (se usados): `Secure`, `HttpOnly`, `SameSite=Lax`

### 16.3 Validação e sanitização
- Toda entrada validada por Zod
- Prisma elimina SQL injection por construção
- Frontend sanitiza markdown/HTML antes de renderizar (DOMPurify)
- Upload de arquivos: validação de mime type + tamanho máximo (1MB para JSON, 5MB para CSV)

### 16.4 LGPD (Lei Geral de Proteção de Dados — Brasil)
- **Consentimento explícito** no signup (checkbox obrigatório)
- **Política de privacidade clara** acessível em todo lugar
- **Direito ao esquecimento**: `DELETE /users/me` apaga todos os dados em até 30 dias (ou imediato, configurável)
- **Portabilidade**: usuário pode exportar todos os seus dados em JSON
- **Logs de auditoria** para ações sensíveis
- **Não compartilhamos dados** com terceiros (sem analytics invasivos; usar Plausible ou similar self-hosted)
- **Dados mínimos**: coletamos apenas o necessário (email, nome). Sem rastreamento comportamental.

### 16.5 Segredos
- Variáveis de ambiente nunca commitadas
- Vault em produção (AWS Secrets Manager, Doppler, ou similar)
- `.env.example` documentando todas as variáveis necessárias

---

## 17. Observabilidade

### 17.1 Logs
- **Pino** estruturados (JSON) no backend
- Níveis: `debug` (dev), `info` (prod), `warn`, `error`
- Correlation ID em cada request (header `X-Request-Id`)
- **Nunca** logar: senhas, tokens, PII completo (CPF, etc.)

### 17.2 Métricas (V1.5+)
- Endpoint `/metrics` exposto em formato Prometheus
- Métricas-chave:
  - Latência por endpoint (p50, p95, p99)
  - Taxa de erro por endpoint
  - Migrations geradas por dia
  - Usuários ativos diários (DAU)

### 17.3 Erro tracking
- **Sentry** opcional em produção
- Captura erros não tratados frontend e backend
- Source maps em produção (privados, não públicos)

### 17.4 Health checks
- `GET /health` — liveness (200 sempre que server está up)
- `GET /ready` — readiness (verifica conexão com banco)

---

## 18. Performance

### 18.1 Frontend
- Lazy loading de rotas (cada página = chunk separado)
- Virtualização em listas grandes (PO-UI já oferece em `po-table`)
- Debounce em inputs de busca (300ms)
- Imagens via CDN com lazy loading
- Bundle target: < 500 KB inicial, < 2 MB total
- Lighthouse score: ≥ 90 em performance

### 18.2 Backend
- Indexes Prisma corretos em colunas filtradas/ordenadas (já no schema)
- N+1 evitado com `include` explícito
- Paginação obrigatória em listas (default 20, máx 100)
- Cache em memória (NodeCache) para templates públicos
- Compression (gzip/brotli) habilitado
- Connection pool Prisma: 10 conexões default

### 18.3 Banco
- PostgreSQL com `work_mem` ajustado
- VACUUM automático
- Backups incrementais diários

---

## 19. Internacionalização e Acessibilidade

### 19.1 i18n
- **3 idiomas** desde o V1: PT-BR (default), EN-US, ES-ES
- Estratégia: `@ngx-translate/core` com lazy loading dos JSONs por feature
- Estrutura: `apps/web/src/assets/i18n/{pt-BR,en-US,es-ES}/{common,auth,projects,...}.json`
- Pluralização ICU
- Datas/números formatados via `Intl` nativo
- Idioma persistido em `localStorage` + sincronizado com `User.locale` no backend

### 19.2 Conteúdo trilíngue do dicionário
- PT é obrigatório
- EN e ES são opcionais mas **fortemente recomendados** com aviso amarelo se vazios
- Botão "auto-traduzir via DeepL/Google" como atalho (V2)

---

## 20. Testes

### 20.1 Pirâmide de testes

```
       /\
      /E2E\        ← Playwright: 10-15 cenários críticos
     /─────\
    /Integ. \      ← Vitest + supertest: cada endpoint
   /─────────\
  /   Unit    \    ← Vitest: lógica pura (encoders, validators, builders)
 /─────────────\
```

### 20.2 Cobertura mínima
- `@sxgerador/advpl-builder`: **95%** (geração de código é crítica)
- `@sxgerador/shared-types` (validators): **90%**
- `apps/api`: **80%**
- `apps/web` (services e stores): **70%**
- E2E: cobertura de fluxos críticos (signup, criar projeto, criar tabela, gerar migration)

### 20.3 Convenções
- Testes co-localizados (`field.service.ts` + `field.service.spec.ts`)
- Fixtures em `__fixtures__/`
- Factories com `@faker-js/faker`
- Banco de teste isolado (Prisma test database)

---

## 21. Deploy e Infraestrutura

### 21.1 Ambientes
- **dev**: local com Docker Compose
- **staging**: deploy automático ao mergear em `develop`
- **production**: deploy manual após release tag

### 21.2 Sugestões de hospedagem (gratuitas/baratas — alinhado ao princípio "sem custo")
- **Frontend**: Vercel ou Cloudflare Pages (free tier generoso)
- **Backend**: Railway, Render, Fly.io ou DigitalOcean App Platform
- **Banco**: Neon (PostgreSQL serverless free tier) ou Supabase
- **Email transacional**: Resend (3k emails/mês free) ou Postmark
- **Domínio**: `sxgerador.com.br` ou `sxgerador.dev`

### 21.3 CI/CD (GitHub Actions)
Workflows:
- `ci.yml`: lint + test + build em todo PR
- `deploy-staging.yml`: deploy automático em push para `develop`
- `deploy-prod.yml`: deploy em push para `main` (com aprovação manual)

### 21.4 Backups
- PostgreSQL: snapshot diário automático (retenção 30 dias)
- Banco também é exportável manualmente pelo admin

---

## 22. Estrutura do Monorepo

```
sxgerador/
├── apps/
│   ├── web/                          # Angular 21 + PO-UI 21
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── core/             # services singleton, interceptors, guards
│   │   │   │   ├── shared/           # componentes/pipes/directives reusáveis
│   │   │   │   ├── features/         # cada feature como módulo lazy-loaded
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── projects/
│   │   │   │   │   ├── tables/
│   │   │   │   │   ├── fields/
│   │   │   │   │   ├── indexes/
│   │   │   │   │   ├── migrations/
│   │   │   │   │   ├── teams/
│   │   │   │   │   ├── templates/
│   │   │   │   │   └── settings/
│   │   │   │   ├── stores/           # Signal stores
│   │   │   │   └── app.config.ts
│   │   │   ├── assets/i18n/
│   │   │   └── environments/
│   │   ├── angular.json
│   │   └── package.json
│   │
│   └── api/                          # Node 22 + Express + Prisma
│       ├── src/
│       │   ├── config/               # env, logger, db
│       │   ├── middleware/           # auth, error, rate-limit
│       │   ├── modules/              # cada módulo = controller + service + repo
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── teams/
│       │   │   ├── projects/
│       │   │   ├── tables/
│       │   │   ├── fields/
│       │   │   ├── indexes/
│       │   │   ├── migrations/
│       │   │   └── templates/
│       │   ├── routes/               # composição de rotas
│       │   ├── utils/
│       │   ├── app.ts                # Express app
│       │   └── server.ts             # bootstrap
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── package.json
│
├── packages/
│   ├── shared-types/                 # tipos + Zod schemas compartilhados
│   │   ├── src/
│   │   │   ├── schemas/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── advpl-builder/                # gerador de migrations (lógica pura)
│   │   ├── src/
│   │   │   ├── encoders/
│   │   │   │   ├── x3-usado.encoder.ts
│   │   │   │   └── x2-modulo.encoder.ts
│   │   │   ├── builders/
│   │   │   │   ├── table.builder.ts
│   │   │   │   ├── field.builder.ts
│   │   │   │   └── index.builder.ts
│   │   │   ├── templates/
│   │   │   │   ├── header.tpl.ts
│   │   │   │   └── helpers.advpl.ts  # SXG_HELPERS.PRW como string
│   │   │   ├── validators/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── dictionary-validator/         # validações de regras de domínio Protheus
│   │   ├── src/
│   │   └── package.json
│   │
│   └── ui-kit/                       # (V2) componentes Angular reutilizáveis fora do app
│
├── tools/
│   ├── docker/
│   │   ├── docker-compose.yml        # postgres local
│   │   └── docker-compose.prod.yml
│   └── scripts/
│
├── .github/
│   └── workflows/
├── .editorconfig
├── .gitignore
├── .nvmrc                            # 22
├── package.json                      # raiz com scripts globais
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── README.md
├── CONTRIBUTING.md
├── LICENSE                            # MIT
└── IDEIA.md                          # este arquivo
```

---

## 23. Convenções de Código

### 23.1 Estilo
- **TypeScript strict mode** habilitado
- **ESLint** com regras Airbnb (adaptadas) + `@typescript-eslint`
- **Prettier** com 100 char/linha, single quotes, trailing commas
- **Imports** ordenados (auto via plugin)

### 23.2 Naming
- Arquivos: `kebab-case` (ex: `field.service.ts`)
- Classes: `PascalCase`
- Funções/variáveis: `camelCase`
- Constantes: `SCREAMING_SNAKE_CASE`
- Componentes Angular: `sxg-*` prefix (ex: `sxg-field-form`)
- Schemas Zod: `*Schema` sufixo (ex: `CreateFieldSchema`)
- Tipos inferidos: sem sufixo (ex: `CreateFieldInput`)

### 23.3 Commits (Conventional Commits)
- `feat(fields): add bulk reorder endpoint`
- `fix(advpl): correct X3_USADO encoding for boolean flags`
- `docs(readme): update setup instructions`
- `refactor(stores): migrate auth store to signals`
- `test(builder): add edge cases for empty tables`
- `chore(deps): bump prisma to 6.5.0`

### 23.4 Branching
- `main` — produção
- `develop` — staging / integração
- `feat/*`, `fix/*`, `chore/*` — features e correções
- PRs obrigatórios; squash merge

### 23.5 Documentação inline
- TSDoc em funções públicas dos packages
- README em cada package com exemplos de uso
- CHANGELOG.md gerado por `changesets`


---

## 24. Roadmap de Desenvolvimento

> **Nota para desenvolvimento com IA (Claude Code):** cada Task abaixo é dimensionada para ser implementada em **uma sessão focada de Claude Code** (~30-90 min de trabalho efetivo). Subtasks são granulares o suficiente para serem unidades atômicas de commit. Use `Opus` para planejar a implementação de cada Task antes de delegar para `Sonnet`. Mantenha um arquivo `.claude/tasks/<task-id>.md` para cada task em desenvolvimento ativa.

### Convenções do roadmap
- **ID**: `F<fase>.<task>` (ex: `F1.3`)
- **Estimativa**: S (≤30min) / M (≤2h) / L (≤4h) / XL (≤1 dia)
- **Status sugerido**: `[ ]` pendente, `[~]` em progresso, `[x]` concluída

---

### 🟢 Fase 0 — Fundação (Setup do Monorepo)

**Objetivo:** ter um monorepo funcional, com lint, format, CI, banco local, e o "hello world" de cada app rodando.

**Saída esperada ao final da fase:**
- `pnpm dev` sobe web (4200) e api (3000)
- `pnpm test` roda em todos os pacotes
- `pnpm lint` e `pnpm format` funcionam
- CI básico no GitHub Actions verde
- Postgres local via Docker Compose

#### Task F0.1 — Inicializar repositório (S)
- [x] Criar repo `sxgerador` no GitHub (privado inicialmente, depois público)
- [x] Adicionar `.gitignore`, `.editorconfig`, `.nvmrc` (22)
- [x] Criar `LICENSE` (MIT)
- [x] Criar `README.md` inicial com badges, descrição, setup
- [x] Criar `CONTRIBUTING.md` com guia de contribuição
- [x] Adicionar `IDEIA.md` (este documento) na raiz

#### Task F0.2 — Configurar Turborepo + pnpm workspaces (M)
- [x] `pnpm init` na raiz
- [x] Criar `pnpm-workspace.yaml` declarando `apps/*` e `packages/*`
- [x] Instalar `turbo` como devDep da raiz
- [x] Criar `turbo.json` com pipelines `build`, `dev`, `test`, `lint`
- [x] Criar `tsconfig.base.json` na raiz com configs strict compartilhadas
- [x] Adicionar scripts globais no `package.json` raiz: `dev`, `build`, `test`, `lint`, `format`

#### Task F0.3 — Configurar ESLint + Prettier + Husky (M)
- [x] Instalar ESLint + plugins TypeScript + Angular + plugins de import
- [x] Configurar `.eslintrc.cjs` na raiz com regras compartilhadas
- [x] Instalar Prettier + plugin imports sort
- [x] Configurar `.prettierrc` com 100 char/linha, single quotes
- [x] Instalar Husky + lint-staged
- [x] Configurar pre-commit hook (lint + format) e commit-msg hook (commitlint)
- [x] Instalar `commitlint` com config Conventional Commits
- [x] Documentar no README

#### Task F0.4 — Criar `apps/web` Angular 21 + PO-UI 21 (L)
- [x] Gerar app Angular 21 com `ng new web --standalone --style=scss --ssr=false`
- [x] Mover para `apps/web`
- [x] Adicionar `@po-ui/ng-components` 21 e `@po-ui/style`
- [x] Configurar `angular.json` para incluir CSS do PO-UI
- [x] Configurar `app.config.ts` com `provideHttpClient`, `provideAnimations`, `providePoLocale`
- [x] Criar layout base com `po-page`, `po-toolbar`, `po-menu`
- [x] Criar página inicial "Hello SXGerador"
- [x] Configurar variáveis de ambiente (`environment.ts`, `environment.prod.ts`)
- [x] Validar `pnpm dev` sobe na porta 4200

#### Task F0.5 — Criar `apps/api` Express + TypeScript (L)
- [x] Inicializar `apps/api` com `package.json`
- [x] Instalar Express, TypeScript, ts-node-dev, types
- [x] Configurar `tsconfig.json` extendendo o base
- [x] Criar estrutura: `src/{config,middleware,modules,routes,utils}`
- [x] Criar `src/app.ts` com Express básico (helmet, cors, json)
- [x] Criar `src/server.ts` lendo `PORT` do env
- [x] Criar endpoint `GET /health` retornando `{ status: 'ok' }`
- [x] Configurar `pino` com pretty-print em dev
- [x] Configurar `dotenv` e `.env.example`
- [x] Validar `pnpm dev` sobe na porta 3000

#### Task F0.6 — Configurar Docker Compose para PostgreSQL (S)
- [x] Criar `tools/docker/docker-compose.yml` com serviço Postgres 16
- [x] Volume persistente em `tools/docker/data/postgres`
- [x] Adicionar PgAdmin opcional
- [x] Documentar comandos: `pnpm db:up`, `pnpm db:down`, `pnpm db:reset`

#### Task F0.7 — Configurar Prisma em `apps/api` (M)
- [x] Instalar `prisma` (dev) e `@prisma/client`
- [x] `npx prisma init`
- [x] Configurar `DATABASE_URL` no `.env`
- [x] Criar schema mínimo (apenas `User` por enquanto)
- [x] Rodar `prisma migrate dev --name init`
- [x] Criar `apps/api/prisma/seed.ts` com 1 usuário de exemplo
- [x] Adicionar script `pnpm db:seed`
- [x] Criar `src/config/db.ts` exportando `prisma` singleton

#### Task F0.8 — Criar `packages/shared-types` (M)
- [x] Estrutura básica do package com `package.json` e `tsconfig.json`
- [x] Configurar build com `tsup` (output ESM + CJS + types)
- [x] Instalar `zod`
- [x] Criar primeiro schema de exemplo (`UserSchema`)
- [x] Configurar `apps/web` e `apps/api` para consumir via workspace dep

#### Task F0.9 — Criar `packages/advpl-builder` (esqueleto) (M)
- [x] Estrutura do package
- [x] Vitest configurado
- [x] Função stub `buildMigration(input: any): string`
- [x] Teste smoke

#### Task F0.10 — CI/CD GitHub Actions (M)
- [x] Criar `.github/workflows/ci.yml`: lint + test + build
- [x] Matrix: Node 22
- [x] Cache pnpm
- [x] Service container Postgres para testes
- [x] Status badge no README

---

### 🔵 Fase 1 — Autenticação e Conta de Usuário

**Objetivo:** sistema de auth completo, end-to-end. Usuário consegue se cadastrar, verificar email, logar, recuperar senha, editar perfil e excluir conta.

**Saída esperada:**
- Fluxo completo de signup → verificação → login → dashboard funciona
- JWT + refresh token rotativo implementado
- Telas estilizadas com PO-UI
- Cobertura de testes ≥ 70% nessa feature

#### Task F1.1 — Schema Prisma para auth (M)
- [x] Adicionar modelos `User`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken` ao schema (conforme seção 11.2)
- [x] Migration `prisma migrate dev --name auth`
- [x] Atualizar seed com usuário verificado de teste

#### Task F1.2 — Schemas Zod de auth (S)
- [x] Em `packages/shared-types`: `SignupSchema`, `LoginSchema`, `ForgotPasswordSchema`, `ResetPasswordSchema`, `UpdateProfileSchema`
- [x] Validações: email válido, senha ≥ 8 chars com 1 maiúscula + 1 número
- [x] Testes unitários dos schemas

#### Task F1.3 — Service de auth no backend (L)
- [x] `apps/api/src/modules/auth/auth.service.ts`:
  - [x] `signup(input)`: cria user, hash senha, gera token de verificação, dispara email
  - [x] `login(input)`: valida credentials, gera JWT + refresh
  - [x] `refresh(token)`: valida refresh, rotaciona, retorna novo par
  - [x] `logout(refreshToken)`: revoga refresh
  - [x] `verifyEmail(token)`: marca user como verificado
  - [x] `forgotPassword(email)`: gera token + dispara email
  - [x] `resetPassword(token, newPassword)`: troca senha, revoga todos refresh
- [x] Testes unitários cobrindo casos felizes e edge cases (email duplicado, token expirado, etc.)

#### Task F1.4 — Controllers e rotas de auth (M)
- [x] `auth.controller.ts` com handlers Express
- [x] Validação via Zod com middleware `validate(schema)`
- [x] `auth.routes.ts` registrando endpoints
- [x] Integration tests com supertest

#### Task F1.5 — Middleware de autenticação JWT (M)
- [x] `apps/api/src/middleware/auth.middleware.ts`
- [x] Lê header `Authorization`, valida JWT, anexa `req.user`
- [x] Variantes: `requireAuth` e `optionalAuth`
- [x] Testes

#### Task F1.6 — Envio de emails transacionais (M)
- [x] Integrar **Resend** ou **Nodemailer**
- [x] Templates HTML simples para: verificação, reset de senha, convite
- [x] Service `email.service.ts` com métodos tipados
- [x] Modo dev: log do email no console em vez de enviar

#### Task F1.7 — Tela de Login (Angular) (M)
- [x] Componente `LoginPage` com `po-page-login`
- [x] Formulário reativo com validação
- [x] Integração com `AuthService` (frontend)
- [x] Persistência de tokens em `localStorage` (com fallback `sessionStorage`)
- [x] Tratamento de erros (toast)

#### Task F1.8 — Tela de Cadastro (M)
- [x] `SignupPage` similar à login
- [x] Aceite de Termos + Política de Privacidade (LGPD)
- [x] Pós-cadastro: tela "verifique seu email"

#### Task F1.9 — Verificação de email (S)
- [x] Rota `/verify-email/:token` no Angular
- [x] Chama API e exibe sucesso/erro
- [x] Botão "reenviar email" com cooldown de 60s

#### Task F1.10 — Esqueci minha senha (M)
- [x] Tela de pedido + tela de reset
- [x] Validação de força da senha visual
- [x] Confirmação de senha

#### Task F1.11 — HTTP Interceptor (Angular) (M)
- [x] Interceptor que adiciona `Authorization` automaticamente
- [x] Detecta 401 → tenta refresh → repete request
- [x] Se refresh falhar → desloga e redireciona

#### Task F1.12 — Auth Signal Store (M)
- [x] `apps/web/src/app/stores/auth.store.ts` com Signal Store
- [x] State: `user`, `isAuthenticated`, `isLoading`
- [x] Methods: `login`, `logout`, `loadCurrentUser`, `refreshToken`
- [x] Computed: `isVerified`

#### Task F1.13 — Route Guards (S)
- [x] `authGuard` redireciona para `/login` se não autenticado
- [x] `verifiedGuard` exige email verificado para certas rotas
- [x] `guestGuard` redireciona para `/dashboard` se já logado (em login/signup)

#### Task F1.14 — Página de perfil (M)
- [x] Tela `/settings/profile` com edição de nome, avatar, idioma
- [x] Upload de avatar (V1: armazena base64; V2: S3/R2)
- [x] Mudança de senha (com confirmação da atual)

#### Task F1.15 — Excluir conta (LGPD) (M)
- [x] Botão "Excluir conta" em settings
- [x] Modal de confirmação dupla
- [x] Endpoint `DELETE /users/me` que soft-deleta + agenda hard-delete em 30 dias (cron job futuro)
- [x] Email de confirmação

#### Task F1.16 — Audit log de auth (S)
- [x] Adicionar modelo `AuditLog` ao schema
- [x] Helper `logAudit(action, userId, metadata)`
- [x] Logar: signup, login, logout, password reset, account delete

---

### 🟣 Fase 2 — Projetos (Dicionários)

**Objetivo:** CRUD completo de projetos, com soft-delete, duplicação e visibilidade.

#### Task F2.1 — Schema Prisma de Projects (S)
- [ ] Adicionar modelo `Project` (sem owner ainda — só personal por enquanto)
- [ ] Migration

#### Task F2.2 — Schemas Zod (S)
- [ ] `CreateProjectSchema`, `UpdateProjectSchema`

#### Task F2.3 — Service e Controller de Projects (M)
- [ ] CRUD com paginação e filtros (search por nome)
- [ ] Soft-delete + restore
- [ ] Duplicate (clona projeto + tabelas + campos + índices)
- [ ] Testes

#### Task F2.4 — Tela de listagem de Projetos (M)
- [ ] `ProjectsListPage` com `po-page-list` ou grid customizado
- [ ] Cards com nome, descrição, contagem de tabelas, última atualização
- [ ] Botão "Novo projeto" abre modal/redireciona
- [ ] Filtro por arquivados/ativos

#### Task F2.5 — Tela de criação/edição (M)
- [ ] Form com nome, slug auto-gerado (com edição), descrição, idioma default, tamanho de filial
- [ ] Validação inline de slug único

#### Task F2.6 — Tela de detalhe do projeto (M)
- [ ] `ProjectDetailPage` com `po-tabs`: Tabelas / Migrations / Configurações / Histórico
- [ ] Header com nome, descrição, botões de ação
- [ ] Breadcrumb

#### Task F2.7 — Project Signal Store (S)
- [ ] State: `currentProject`, `projects`, `isLoading`
- [ ] Methods: `loadProjects`, `loadProject`, `create`, `update`, `delete`, `restore`, `duplicate`

---

### 🟡 Fase 3 — Tabelas (SX2)

**Objetivo:** CRUD de tabelas dentro de um projeto, com todas as validações de domínio.

#### Task F3.1 — Schema Prisma para Table (M)
- [ ] Adicionar modelo `Table` completo (todos os campos SX2 da seção 11.2)
- [ ] Migration

#### Task F3.2 — Validador de prefixo (S)
- [ ] Em `packages/dictionary-validator`: função `validatePrefix(prefix: string)`
- [ ] Regras: 3 chars, A-Z 0-9, warning se não começar com `Z`
- [ ] Testes

#### Task F3.3 — Schemas Zod de Table (S)
- [ ] `CreateTableSchema`, `UpdateTableSchema`
- [ ] Auto-gerar `fileName` se não fornecido (`<PREFIX>010`)

#### Task F3.4 — Service e Controller (M)
- [ ] CRUD com validações de domínio
- [ ] Verificação de prefixo único por projeto
- [ ] Testes

#### Task F3.5 — Lista de tabelas (M)
- [ ] `TablesListPage` com `po-table` (colunas: prefixo, nome, modo, qtd campos, qtd índices, ações)
- [ ] Search por prefixo ou nome
- [ ] Filtros por módulo
- [ ] Ações inline: editar, excluir, duplicar

#### Task F3.6 — Form de tabela (M)
- [ ] `TableFormPage` com seções: Identificação / Compartilhamento / Configurações Avançadas
- [ ] `TableFormPage` reutilizado para criar e editar
- [ ] Editor visual de `X2_MODULO` (componente `<sxg-modules-editor>`)
- [ ] Preview do `fileName` calculado em tempo real

#### Task F3.7 — Tela de detalhe da tabela (M)
- [ ] `TableDetailPage` com `po-tabs`: Campos / Índices / Histórico
- [ ] Header com prefixo, nome trilíngue, modo, ações
- [ ] Indicador de "tem campo FILIAL?" e "tem índice de ordem 1?" (com warning se não)

---

### 🔴 Fase 4 — Campos (SX3)

**Objetivo:** CRUD de campos com a UI mais polida do produto. Esta é a feature principal.

#### Task F4.1 — Schema Prisma para Field (L)
- [ ] Adicionar modelo `Field` completo (50+ campos)
- [ ] Migration
- [ ] Seeds com tabela exemplo (ZZZ + 5 campos)

#### Task F4.2 — Encoders de bitmap em `advpl-builder` (L) **CRÍTICO**
- [ ] `encodeX3Usado` / `decodeX3Usado` com TDD rigoroso
- [ ] `encodeX2Modulo` / `decodeX2Modulo`
- [ ] Testes com casos reais extraídos de SX3 de produção
- [ ] Cobertura ≥ 95%

#### Task F4.3 — Validador de nomenclatura de campo (S)
- [ ] `validateFieldName(name, tablePrefix)`: deve ser `<PREFIX>_*` com max 10 chars
- [ ] Testes

#### Task F4.4 — Schemas Zod de Field (M)
- [ ] `CreateFieldSchema` com todas as validações cruzadas
- [ ] Refinements: decimal só com tipo N, combobox só faz sentido com C/N, etc.

#### Task F4.5 — Service e Controller (L)
- [ ] CRUD + reorder + bulk
- [ ] Auto-incremento de `order` ao criar
- [ ] Validação: ao deletar campo presente em índice, alertar

#### Task F4.6 — Componente `<sxg-usado-editor>` (M)
- [ ] Grid de checkboxes representando cada flag
- [ ] Conversão para/de string codificada via encoders
- [ ] Preview da string em monospace
- [ ] Testes de componente

#### Task F4.7 — Componente `<sxg-modules-editor>` (M)
- [ ] Grid de checkboxes dos módulos TOTVS (SIGAFAT, SIGAEST, SIGACOM, SIGAFIN, SIGAGPE...)
- [ ] Bitmap encode/decode
- [ ] Reutilizável para tabela e campo

#### Task F4.8 — Componente `<sxg-combobox-editor>` (M)
- [ ] UI de pares chave/valor trilíngue (3 colunas: chave, valor PT, valor ES, valor EN)
- [ ] Adicionar/remover linha
- [ ] Validação: chaves únicas
- [ ] Output: 3 strings no formato `1=Sim;2=Não`

#### Task F4.9 — Componente `<sxg-code-editor>` (M)
- [ ] Wrapper Monaco Editor com syntax highlight para AdvPL/SQL
- [ ] Modos: read-only, edit
- [ ] Validação de sintaxe básica

#### Task F4.10 — Form de campo — Aba Básico (M)
- [ ] Nome (com prefixo bloqueado), tipo, tamanho, decimais
- [ ] Títulos trilíngues lado a lado
- [ ] Descrições trilíngues
- [ ] Auto-foco e atalhos (Tab navega; Enter no último campo salva)

#### Task F4.11 — Form de campo — Aba Comportamento (M)
- [ ] Picture com sugestões (`@!`, `@E 999.999,99`...)
- [ ] Editor de validação (Monaco)
- [ ] Inicialização padrão (Monaco)
- [ ] When (Monaco)
- [ ] Browse, modo visual, contexto

#### Task F4.12 — Form de campo — Aba Avançado (L)
- [ ] Editor de combobox
- [ ] Editor de Usado (bitmap)
- [ ] Editor de módulos (bitmap)
- [ ] F3 (consulta padrão) — input simples por enquanto, V2 = autocomplete
- [ ] SQL condition / SQL check (Monaco)
- [ ] Flags diversas (PYME, ortografia, virtual, etc.)

#### Task F4.13 — Lista de campos (L)
- [ ] `po-table` com virtualização
- [ ] Colunas configuráveis (usuário escolhe quais ver)
- [ ] Drag-and-drop para reordenar
- [ ] Bulk actions: marcar como obrigatório, browse, deletar
- [ ] Inline edit em campos simples (titulo, descrição)
- [ ] Search por nome/título/descrição
- [ ] Filtros: tipo, obrigatório, virtual, browse

#### Task F4.14 — Atalhos de teclado (S)
- [ ] `N` = novo campo
- [ ] `E` = editar selecionado
- [ ] `Del` = deletar selecionado (com confirmação)
- [ ] `Cmd+S` = salvar form
- [ ] `Esc` = cancelar
- [ ] `?` = mostrar modal de atalhos

#### Task F4.15 — Field Signal Store (M)
- [ ] State e methods conforme padrão

---

### 🟠 Fase 5 — Índices (SIX)

**Objetivo:** CRUD de índices com builder visual de chave.

#### Task F5.1 — Schema Prisma para Index (S)
- [ ] Modelo `Index`, migration

#### Task F5.2 — Validações (S)
- [ ] Apenas 1 índice de ordem `1` por tabela
- [ ] Chave referencia somente campos existentes na tabela

#### Task F5.3 — Service e Controller (M)
- [ ] CRUD + validações

#### Task F5.4 — Componente `<sxg-key-builder>` (M)
- [ ] Drag-and-drop de campos disponíveis para a chave
- [ ] Preview da string da chave (`A+B+C`)
- [ ] Permite adicionar funções (ex: `xFilial('ZZZ')`) como itens especiais
- [ ] Reordenação dentro da chave

#### Task F5.5 — Lista e form de índices (M)
- [ ] `po-table` com colunas básicas
- [ ] Form com builder, descrições trilíngues, flags

---

### ⚫ Fase 6 — Geração de Migration AdvPL

**Objetivo:** o coração do produto. Pegar o estado do projeto e gerar `.PRW` válido.

#### Task F6.1 — Schema Prisma para Migration (M)
- [ ] Modelos `Migration` e `MigrationItem`, migration

#### Task F6.2 — Service de Migration (L)
- [ ] `getCurrentDraft(projectId)`: retorna draft em aberto ou cria
- [ ] `recordChange(projectId, item)`: registra item no draft
- [ ] `generateMigration(projectId, name)`: fecha draft, chama builder, salva código
- [ ] Hooks em CRUD de Table/Field/Index para chamar `recordChange`

#### Task F6.3 — Pacote `advpl-builder` — table.builder (L)
- [ ] Função `buildSx2(table: Table): string`
- [ ] Templates de array `aTabela := {...}`
- [ ] Tratamento de campos opcionais
- [ ] Testes com snapshots

#### Task F6.4 — `advpl-builder` — field.builder (XL)
- [ ] Função `buildSx3(field: Field): string`
- [ ] Inclui codificação `X3_USADO`
- [ ] Testes exaustivos com snapshots

#### Task F6.5 — `advpl-builder` — index.builder (M)
- [ ] Função `buildSix(index: Index): string`

#### Task F6.6 — `advpl-builder` — composer (L)
- [ ] Função `buildMigration(items: MigrationItem[], meta): string`
- [ ] Header com metadados
- [ ] Seções: SX2 / SX3 / SIX
- [ ] Footer com mensagem final
- [ ] Numeração sequencial de migration name (`SXG001CriaTblZZZ`)

#### Task F6.7 — Helpers AdvPL (`SXG_HELPERS.PRW`) (L)
- [ ] Implementar `U_SXGCriaSX2`, `U_SXGCriaSX3`, `U_SXGCriaIdx` em AdvPL
- [ ] Cada função: `dbSelectArea` na SX correspondente, `RecLock`, `Replace`, `MsUnLock`
- [ ] Tratamento de "atualizar se já existe"
- [ ] Compatível com Protheus 12.1.x+
- [ ] Distribuído como string no pacote (gerado junto)

#### Task F6.8 — Endpoint de geração e download (M)
- [ ] `POST /projects/:id/migrations/generate` retorna metadados
- [ ] `GET /projects/:id/migrations/:id/download` retorna `.PRW` como text/plain
- [ ] `GET /projects/:id/migrations/:id/preview` retorna código sem download

#### Task F6.9 — Tela de geração de migration (L)
- [ ] Modal/página com:
  - [ ] Lista de mudanças desde a última migration (checkbox para incluir)
  - [ ] Input de nome amigável
  - [ ] Validações pré-geração (lista de erros e warnings)
  - [ ] Preview do `.PRW` com syntax highlight
  - [ ] Botão "Gerar e baixar"
- [ ] Toast de sucesso após geração

#### Task F6.10 — Lista de migrations (M)
- [ ] `MigrationsListPage` com tabela expansível
- [ ] Cada linha: nº, data, autor, nome, qtd items
- [ ] Expandir mostra os items detalhados
- [ ] Botão "Baixar novamente"

---

### 🟤 Fase 7 — Equipes e Colaboração

**Objetivo:** múltiplos usuários trabalhando no mesmo dicionário.

#### Task F7.1 — Schema Prisma de Teams (S)
- [ ] Modelos `Team`, `TeamMember`, `ProjectInvite`
- [ ] Migration

#### Task F7.2 — Service e Controller de Teams (L)
- [ ] CRUD de teams
- [ ] Listar membros
- [ ] Convites (gerar token, enviar email)
- [ ] Aceitar/recusar convite
- [ ] Mudar role / remover membro
- [ ] Transferir ownership

#### Task F7.3 — Permissões (RBAC) (L)
- [ ] Helper `canUserDo(user, action, resource)` no backend
- [ ] Aplicar em todos os endpoints de project/table/field/index
- [ ] Testes exaustivos das permissões

#### Task F7.4 — Telas de teams (L)
- [ ] Lista de teams
- [ ] Detalhe + membros + convites
- [ ] Modal de convite
- [ ] Página de aceite de convite (`/invites/:token`)
- [ ] Settings da team (nome, slug, avatar, exclusão)

#### Task F7.5 — UI de seleção de "owner" ao criar projeto (M)
- [ ] Dropdown: "Pessoal" ou cada team que o user é membro
- [ ] Lógica de transferência entre owners (V2)

---

### 🟦 Fase 8 — Importação e Exportação

#### Task F8.1 — Export JSON do projeto (M)
- [ ] Endpoint `GET /projects/:id/export` retorna JSON estruturado
- [ ] Botão "Baixar" no detalhe do projeto

#### Task F8.2 — Import JSON (L)
- [ ] Endpoint `POST /projects/:id/import` com upload
- [ ] Parser + validador
- [ ] Preview de diff antes de aplicar
- [ ] Transação: tudo ou nada

#### Task F8.3 — Import CSV de SX2/SX3/SIX (XL)
- [ ] Parser de CSV exportado do Protheus
- [ ] Mapeamento de colunas → modelo SXGerador
- [ ] Tratamento de bitmaps (decodificação `X3_USADO`)
- [ ] UI: upload + preview + confirmação

#### Task F8.4 — Export CSV (M)
- [ ] Gerar CSV no formato esperado pelo Protheus
- [ ] Útil para quem prefere import via SIGACFG

---

### 🟣 Fase 9 — Templates da Comunidade

#### Task F9.1 — Schema e CRUD de Templates (M)
- [ ] Modelo `Template`
- [ ] Endpoints
- [ ] Permissões: criar = qualquer user logado

#### Task F9.2 — Vitrine pública de templates (L)
- [ ] `/templates` com grid e filtros por categoria
- [ ] Card com nome, autor, descrição, downloads, botão "Aplicar"

#### Task F9.3 — Aplicar template em projeto (M)
- [ ] Modal: selecionar projeto destino
- [ ] Preview do que será criado
- [ ] Lógica de merge (e.g., conflitos de prefixo)

#### Task F9.4 — Publicar template a partir de tabela (M)
- [ ] Botão "Publicar como template" no detalhe da tabela
- [ ] Form: categoria, descrição, screenshots opcionais
- [ ] Templates ficam pendentes de moderação (V2) ou imediatamente públicos com flag de "não-oficial"

#### Task F9.5 — Templates oficiais (S)
- [ ] Seed inicial com 5-10 templates curados (ex: tabela financeira padrão, tabela de cadastro genérica, etc.)

---

### 🟢 Fase 10 — Diff Visual e Histórico

#### Task F10.1 — Engine de diff (L)
- [ ] Função pura `diff(stateA, stateB): DiffResult`
- [ ] Detecta: adicionado, removido, alterado (com campo a campo)
- [ ] Testes

#### Task F10.2 — UI de diff de migrations (M)
- [ ] Comparar duas migrations do mesmo projeto
- [ ] Lista lado-a-lado com cores

#### Task F10.3 — UI de diff de projetos (M)
- [ ] Comparar 2 projetos
- [ ] Útil para "estou indo subir minha customização do cliente A para o cliente B, o que muda?"

#### Task F10.4 — Histórico de mudanças (M)
- [ ] Aba "Histórico" no projeto/tabela mostrando timeline de migrations e items
- [ ] Filtros por autor, tipo de operação, período

---

### 🟡 Fase 11 — Polimento, Performance e Acessibilidade

#### Task F11.1 — Audit Lighthouse (M)
- [ ] Rodar Lighthouse em todas as telas críticas
- [ ] Score ≥ 90 em performance, acessibilidade, best practices, SEO

#### Task F11.2 — Audit de acessibilidade (M)
- [ ] Verificação manual com teclado em todos os fluxos
- [ ] Testes automáticos com `axe-core`
- [ ] Correções necessárias

#### Task F11.3 — i18n completa (L)
- [ ] Extrair todas as strings para JSONs de tradução
- [ ] PT, EN, ES completos
- [ ] Switcher de idioma no header

#### Task F11.4 — Dark mode (M)
- [ ] Habilitar dark theme do PO-UI
- [ ] Persistência em localStorage + sincronização com User.prefs
- [ ] Testar todos os componentes próprios

#### Task F11.5 — Loading states / Skeletons (M)
- [ ] Substituir spinners por skeletons em listas e detalhes
- [ ] Estados vazios educativos com ilustração e CTA

#### Task F11.6 — Tratamento robusto de erros (M)
- [ ] Componente global de erro
- [ ] Mensagens user-friendly (não jogar stack trace)
- [ ] Botão "Reportar problema"

#### Task F11.7 — Otimização de bundle (M)
- [ ] Análise com `webpack-bundle-analyzer`
- [ ] Lazy load Monaco apenas quando necessário
- [ ] Tree-shaking validado

#### Task F11.8 — Caching e queries otimizadas (M)
- [ ] Cache em memória para templates
- [ ] Indexes adicionais no Postgres se análise mostrar slow queries

---

### 🔵 Fase 12 — Lançamento e Comunidade

#### Task F12.1 — Landing page (L)
- [ ] Site separado em `apps/landing` (ou no próprio web na rota `/`)
- [ ] Hero, features, screenshots, CTA "Começar grátis"
- [ ] Depoimentos (após primeiros usuários)
- [ ] Link para docs e GitHub

#### Task F12.2 — Documentação (L)
- [ ] Site `docs.sxgerador.com.br` (Docusaurus ou Astro Starlight)
- [ ] Guia de início rápido
- [ ] Tutorial: "Sua primeira migration em 5 minutos"
- [ ] Referência completa dos campos SX2/SX3/SIX
- [ ] FAQ

#### Task F12.3 — Setup de produção (L)
- [ ] Provisionar servidores/serviços
- [ ] Configurar domínios e DNS
- [ ] Configurar SSL (Let's Encrypt automático)
- [ ] Variáveis de ambiente seguras
- [ ] Backup automatizado
- [ ] Deploy de produção

#### Task F12.4 — Beta fechado (M)
- [ ] Convidar 10-20 devs Protheus conhecidos
- [ ] Feedback survey
- [ ] Iterar 2-3 semanas

#### Task F12.5 — Lançamento público (M)
- [ ] Post no LinkedIn
- [ ] Post em comunidades TOTVS (TDN, fóruns, grupos de Telegram/Discord)
- [ ] Vídeo demo (3-5 min)
- [ ] Open source no GitHub (público)

#### Task F12.6 — Canais de feedback (S)
- [ ] GitHub Issues como canal principal
- [ ] Discord/Telegram da comunidade SXGerador
- [ ] Email de suporte: hello@sxgerador.com.br

---

## 25. KPIs e Métricas de Sucesso

### Métricas de produto (V1, primeiros 6 meses)

| KPI | Meta 30 dias | Meta 90 dias | Meta 180 dias |
|---|---|---|---|
| Usuários cadastrados | 100 | 500 | 2.000 |
| Usuários ativos semanais (WAU) | 30 | 150 | 600 |
| Migrations geradas | 200 | 2.000 | 10.000 |
| Projetos criados | 80 | 400 | 1.500 |
| NPS | ≥ 30 | ≥ 50 | ≥ 60 |
| Taxa de retenção (D7) | ≥ 30% | ≥ 40% | ≥ 50% |

### Métricas técnicas

| KPI | Meta |
|---|---|
| Uptime | ≥ 99.5% |
| Latência API p95 | < 300ms |
| Lighthouse Performance | ≥ 90 |
| Cobertura de testes (avg) | ≥ 80% |
| Bugs críticos abertos | 0 |

---

## 26. Visão de Futuro (V2+)

Ideias que **não** entram no V1, mas vale documentar:

- **Integração via REST com Protheus**: aplicar migrations diretamente via webservice (opcional, requer endpoint custom no Protheus do usuário)
- **CLI** (`sxg`): gerar migrations sem abrir o navegador
- **VS Code Extension**: visualizar/editar dicionário direto no editor
- **GitHub integration**: commit automático das migrations geradas
- **OAuth Google + GitHub** no signup
- **Marketplace de templates pago** (para autores ganharem tip jar — mas o produto base permanece grátis)
- **Suporte a SXB (consultas padrão), SX1 (perguntas), SX7 (gatilhos)** completos
- **Ambientes**: rastreamento de "qual migration está aplicada em qual ambiente"
- **Webhooks** para integrar com pipelines CI/CD do usuário
- **API pública** para outros sistemas (ex: import via API)
- **Dictionary scanner**: cliente desktop opcional que conecta no Protheus do usuário e sincroniza dicionário (modo avançado, sob demanda)
- **Editor colaborativo em tempo real** (CRDT) ao estilo Figma
- **Auto-tradução** dos campos trilíngues (DeepL/OpenAI)
- **Suite de linting de dicionário**: detectar antipadrões comuns

---

## 27. Glossário

| Termo | Significado |
|---|---|
| **Protheus** | ERP da TOTVS, líder no mercado brasileiro |
| **AdvPL / TLPP** | Linguagens proprietárias do Protheus |
| **SIGACFG** | Módulo Configurador do Protheus |
| **SX2** | Tabela do dicionário que define tabelas |
| **SX3** | Tabela do dicionário que define campos |
| **SIX** | Tabela do dicionário que define índices |
| **SXB** | Tabela do dicionário que define consultas padrão (F3) |
| **SX1** | Tabela do dicionário que define perguntas (parâmetros) |
| **SX7** | Tabela do dicionário que define gatilhos |
| **SXG** | Tabela do dicionário que define grupos de campos |
| **`.PRW`** | Arquivo fonte AdvPL |
| **`.PRO`** | Fonte compilado |
| **`.RPO`** | Repositório de fontes Protheus |
| **`xFilial`** | Função AdvPL que retorna a filial corrente |
| **PYME** | Versão simplificada do Protheus para pequenas empresas |
| **Migration** | Script de mudança incremental aplicável em ambientes |
| **Bitmap codificado** | String que representa flags binárias (ex: `X3_USADO`) |
| **Multi-empresa** | Capacidade do Protheus de operar várias empresas/filiais |
| **TOTVS** | Empresa brasileira que desenvolve o Protheus |
| **PO-UI** | Biblioteca de componentes UI da TOTVS para Angular |

---

## Apêndice A — Variáveis de Ambiente

`.env.example` (api):

```bash
# Server
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database
DATABASE_URL="postgresql://sxgerador:sxgerador@localhost:5432/sxgerador?schema=public"

# JWT
JWT_SECRET="generate-with-openssl-rand-base64-64"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Email
EMAIL_PROVIDER="resend"  # resend | smtp | console
RESEND_API_KEY=""
EMAIL_FROM="SXGerador <noreply@sxgerador.com.br>"

# Frontend URL (para links em emails)
FRONTEND_URL="http://localhost:4200"

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=10

# Sentry (opcional)
SENTRY_DSN=""
```

`.env.example` (web):

```bash
NG_APP_API_URL="http://localhost:3000/api/v1"
NG_APP_ENVIRONMENT="development"
NG_APP_SENTRY_DSN=""
```

---

## Apêndice B — Comandos úteis

```bash
# Dev
pnpm install                        # instala tudo
pnpm db:up                          # sobe Postgres local
pnpm dev                            # roda web + api em paralelo (turbo)

# Banco
pnpm --filter api prisma migrate dev --name <nome>
pnpm --filter api prisma studio
pnpm --filter api db:seed

# Testes
pnpm test                           # todos os pacotes
pnpm --filter advpl-builder test    # apenas um pacote
pnpm test:watch
pnpm test:e2e                       # Playwright

# Qualidade
pnpm lint
pnpm format
pnpm typecheck

# Build
pnpm build                          # tudo
pnpm --filter web build:prod
```

---

## Apêndice C — Convenções específicas para desenvolvimento com Claude Code

Esta seção é um guia operacional para o autor (Gustavo) ao desenvolver o SXGerador usando Claude Code.

### C.1 Fluxo recomendado

1. **Planejamento (Opus)**: para cada Task do roadmap, criar `.claude/tasks/F<n>.<task>.md` com:
   - Objetivo e contexto
   - Lista de arquivos a criar/modificar
   - Pseudocódigo das funções principais
   - Casos de teste a cobrir
   - Critérios de aceitação

2. **Execução (Sonnet)**: delegar a implementação efetiva, referenciando o arquivo de planejamento.

3. **Revisão (manual + Opus)**: revisar PR antes de merge, idealmente com IA gerando um summary das mudanças.

### C.2 Convenções de prompt

- Sempre referenciar o `IDEIA.md` no início de uma sessão nova
- Sempre mencionar a Task ID (`Estou implementando F4.2`)
- Pedir testes junto com implementação
- Solicitar conformidade com convenções da seção 23

### C.3 Git workflow sugerido

- 1 branch por Task (`feat/F4.2-x3-usado-encoder`)
- Commits atômicos (1 subtask = 1 commit ideal)
- PR template referenciando a Task
- Squash merge para histórico limpo no `main`

### C.4 Quando usar `/compact`

- Após sessões longas de implementação para preservar contexto
- Antes de mudar de fase do roadmap
- Sempre que o contexto começar a confundir Claude

---

## Apêndice D — Critérios para considerar o V1 "pronto"

V1 é considerado pronto quando:

- [ ] Todas as Tasks das Fases 0-7 estão completas
- [ ] Cobertura de testes ≥ 80% nos pacotes core
- [ ] Lighthouse ≥ 90 em performance e acessibilidade
- [ ] Zero bugs críticos abertos
- [ ] Beta fechado com ≥ 10 devs gerou feedback positivo
- [ ] Documentação básica publicada
- [ ] Política de Privacidade e Termos de Uso publicados
- [ ] Plano de moderação para conteúdo público (templates) definido
- [ ] Backups automatizados validados (restore testado)
- [ ] Domínio + SSL + email configurados em produção

---

**FIM DO DOCUMENTO**

Documento vivo. Sugestões e PRs ao próprio repositório.
