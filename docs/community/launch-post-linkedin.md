# Post de lançamento — LinkedIn

> Recomendação: dois posts. Um técnico/narrativo no perfil pessoal; um curto e direto na página da empresa (se houver).

---

## Versão A — Perfil pessoal (longa, narrativa)

```
🚀 Hoje liberamos o SXGerador para todos.

Há um problema silencioso que todo dev TOTVS Protheus conhece: criar e
versionar dicionário de dados (SX2, SX3, SIX) é manual, demorado e
suscetível a erros que só aparecem em produção. O X3_USADO sozinho já é
um pesadelo — 120 caracteres de bitmap codificado que, se vier errado,
quebra o ERP.

A gente tentou planilhas, scripts, XML — nenhum resolve de verdade.

O SXGerador é nossa tentativa de mudar isso:

✅ Interface moderna pra modelar SX2/SX3/SIX
✅ Validação automática de prefixo, nome de campo, índice único
✅ X3_USADO e X3_MODULO codificados certo (100% cobertos por teste)
✅ Geração de migration AdvPL .PRW pronta pra compilar
✅ Colaboração em equipe com 4 papéis (Owner/Admin/Member/Viewer)
✅ Templates da comunidade — aplique tabelas inteiras com 1 clique
✅ Diff visual entre versões + histórico completo

Tudo open source MIT.

Passamos por 3 semanas de beta fechado com [N] devs Protheus que me deram
feedback honesto (e bugs reais 😅) — obrigado a todos. Vocês moldaram isso.

🔗 sxgerador.com.br — comece grátis em 5 min
📚 docs.sxgerador.com.br — primeira migration em 5 min
💻 github.com/sxgerador/sxgerador — código aberto

Se você é dev Protheus, me conta nos comentários: como você lida com SX3 hoje?

#TOTVS #Protheus #AdvPL #OpenSource #ERP
```

---

## Versão B — Página da empresa (curta, direta)

```
SXGerador agora é open source público.

Plataforma para criar, versionar e gerar migrations AdvPL de dicionário Protheus (SX2/SX3/SIX).

→ Comece grátis: sxgerador.com.br
→ Docs: docs.sxgerador.com.br
→ Código: github.com/sxgerador/sxgerador

MIT. Comunidade. Sem mistério.

#TOTVS #Protheus #AdvPL
```

---

## Comentário fixado (responder a si mesmo no próprio post)

```
Pequena thread sobre o que tem rolando por baixo:

🧪 100% de cobertura de testes no encoder de X3_USADO — esse é o coração
do produto. Errar lá quebra o ERP em produção. Está em packages/advpl-builder.

🏗️ Stack: Angular 21 (Signals) + PO-UI 21 / Node 22 + Express + Prisma 6 /
Postgres 16. Monorepo Turborepo + pnpm.

🤝 Quer contribuir? Tem ~30 issues marcadas "good first issue" no Github,
de UX a backend. CONTRIBUTING.md explica como rodar local.
```

---

## Imagens recomendadas

- **OG image principal:** screenshot da tela de gerar migration com diff visual ao lado (1200×630)
- **Imagem 2:** terminal mostrando `.PRW` gerado com syntax highlight
- **Imagem 3:** GIF de 5s mostrando criar tabela → gerar migration

## Hashtags secundárias (rodízio)

`#TOTVS #Protheus #AdvPL #OpenSource #ERP #SoftwareDevelopment #Dev #Backend #Angular`

## Quando postar

**Terça ou quarta, entre 9h e 11h** (horário com mais engajamento orgânico no LinkedIn pt-BR).
