# Programa de Beta Fechado — SXGerador

> **Status:** template de execução. Preencher a lista de convidados, datas reais e canal de feedback antes de disparar.

## Objetivo

Validar com 10-20 desenvolvedores Protheus reais o fluxo end-to-end do SXGerador antes do lançamento público — capturar bugs, fricção de UX e validar a proposta de valor central (substituir o SIGACFG manual).

## Critérios de seleção dos beta testers

Procuramos um mix de:

- **Devs sênior AdvPL** (8+ anos de Protheus) — conhecem o SX2/SX3/SIX de cor
- **Devs pleno em consultoria** — tocam vários projetos por mês
- **Devs in-house em médias empresas** — cuidam de um Protheus inteiro
- **Time leads / arquitetos** — pensam em colaboração e versionamento

**Diversidade:** ao menos 30% mulheres devs; representação de SP, RS, BA, PE, MG.

## Roteiro de 3 semanas

### Semana 1 — Onboarding

- Email de convite individual com 1 parágrafo personalizado
- Onboarding call de 20 min (opcional, agrupado)
- Acesso ao Discord do beta com canal exclusivo
- Tarefa: criar 1 projeto real e gerar 1 migration

### Semana 2 — Uso ativo

- Daily Discord: "o que tentei e quebrou hoje?"
- Recolher bugs no GitHub Issues (label `beta`)
- 3 office hours por semana (terça/quinta/sábado, 1h cada)

### Semana 3 — Survey + iteração

- Disparar [beta-survey.md](./beta-survey.md) (Google Forms / Tally / Typeform)
- Sessões 1-a-1 com 5-7 mais engajados (30 min cada)
- Patch final de bugs críticos
- Briefing para lançamento público

## Comunicação

| Quando          | Canal                           | Mensagem                                    |
| --------------- | ------------------------------- | ------------------------------------------- |
| Convite inicial | Email pessoal                   | Lista de [convidados](#lista-de-convidados) |
| Onboarding      | Email + Discord DM              | Link do Discord + tutorial                  |
| Daily updates   | Discord canal `#beta-sxgerador` | Bugs corrigidos, deploys, etc               |
| Survey          | Email + DM                      | [Link do Tally](#)                          |
| Encerramento    | Email + Discord                 | Agradecimento + roadmap pós-launch          |

## Métricas a acompanhar

| Métrica                        | Meta                           |
| ------------------------------ | ------------------------------ |
| Taxa de aceite do convite      | ≥ 70%                          |
| Devs que criaram ≥ 1 projeto   | ≥ 80% dos aceitos              |
| Devs que geraram ≥ 1 migration | ≥ 60%                          |
| Bugs reportados                | qualquer número > 0 é positivo |
| NPS no survey final            | ≥ 30                           |

## Lista de convidados

> **PREENCHER ANTES DE DISPARAR.** Mantenha esta lista privada (não publique no repo público).

| Nome             | Empresa/Contexto              | Contato                | Status      |
| ---------------- | ----------------------------- | ---------------------- | ----------- |
| _exemplo_ Fulano | Consultor freelancer Protheus | linkedin.com/in/fulano | ⬜ Pendente |
| ...              | ...                           | ...                    | ...         |

## Template de email de convite

```
Assunto: Convite — beta fechado do SXGerador (versionamento de SX2/SX3/SIX)

Oi, [NOME]!

Estou em beta fechado de um projeto que talvez te interesse: SXGerador,
uma plataforma open source para criar, versionar e gerar migrations AdvPL
de dicionário Protheus (SX2/SX3/SIX). A ideia é substituir o fluxo manual
no SIGACFG por uma interface moderna com colaboração de time.

Vi que você [LINHA PERSONALIZADA — algo que mostra que você não está em mass mailing,
ex.: "trabalha com Protheus há X anos", "fez aquela palestra no TDN", "é colega
do Beltrano que recomendou"].

Estou convidando 15 devs pra usar por 3 semanas e me ajudar a achar bugs e
ajustar UX antes do lançamento público. Tem zero custo, dá acesso anteci-
pado a tudo, e (claro) o seu feedback molda o produto. Você toparia?

Se sim, respondo com link de acesso e do Discord do beta.

Abraço,
Gustavo
```

## Pós-beta

- Pacote de agradecimento (sticker / camiseta / créditos eternos no site)
- Beta testers ganham badge especial no SXGerador
- Lista permanente no `THANKS.md`
