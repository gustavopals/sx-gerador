# Script de Vídeo Demo — SXGerador (3-5 min)

> Roteiro pronto para gravação. Cronometre cada bloco. Use OBS ou Loom.
> Resolução final: 1080p MP4, áudio limpo (mic externo se possível).

## Metadados do vídeo

- **Título:** SXGerador em 5 minutos — versionando dicionário Protheus sem SIGACFG
- **Duração alvo:** 4:30
- **Plataforma:** YouTube (público) + embed no site
- **Idioma:** Português (com legendas auto-traduzidas para ES/EN ativadas)
- **Thumbnail:** "DIZER ADEUS AO SIGACFG" sobre print da app

---

## Roteiro (cena a cena)

### Cena 1 — Hook (0:00 - 0:20)

**Cena:** Screen recording do SIGACFG aberto, lentidão proposital ao mexer em SX3.
**Voz:**

> "Se você é dev Protheus, provavelmente já perdeu uma manhã inteira
> ajustando SX3 no SIGACFG. Hoje eu mostro um jeito melhor — em 5
> minutos do zero até a migration AdvPL pronta."

### Cena 2 — Quem sou (0:20 - 0:40)

**Cena:** Webcam pequena no canto + landing page do SXGerador.
**Voz:**

> "Sou o Gustavo. Trabalho com Protheus há [N] anos e cansei do fluxo
> manual de dicionário. Construí o SXGerador para resolver isso para
> mim e para vocês. É open source, MIT, gratuito."

### Cena 3 — Criar conta + projeto (0:40 - 1:20)

**Cena:** Signup → criar projeto chamado "Demo Cadastro" com prefixo ZDM.
**Voz:**

> "Criei a conta. Agora um projeto novo — chamo de Demo Cadastro,
> prefixo ZDM, TAMFIL 2, pessoal. Pronto."

### Cena 4 — Criar tabela (1:20 - 2:00)

**Cena:** Modal de Nova Tabela, preencher prefixo ZDM, nome PT/ES/EN, módulos EST+FAT.
**Voz:**

> "Nova tabela. Prefixo ZDM, nome em três idiomas como o Protheus
> precisa. Marco os módulos onde ela vai aparecer. Note que ZDM010 e
> ZDM_FILIAL são criados automaticamente — eu não preciso digitar."

### Cena 5 — Campos + X3_USADO (2:00 - 3:00)

**Cena:** Criar ZDM_CODIGO, ZDM_DESCRI, ZDM_DTAQUI, ZDM_VALOR. Destaque ao marcar opções de X3_USADO via checkboxes.
**Voz:**

> "Adiciono os campos. Tipo, tamanho, picture. Aqui — olha o segredo —
> o famoso X3_USADO. No Protheus puro são 120 caracteres bizarros que
> se você errar uma posição quebra tudo. Aqui eu marco em checkbox o
> que quero. O sistema gera o bitmap certo. Tem teste cobrindo 100%."

### Cena 6 — Índice principal (3:00 - 3:20)

**Cena:** Criar índice ordem 1 com chave ZDM_FILIAL+ZDM_CODIGO.
**Voz:**

> "Índice principal — ordem 1. Chave ZDM_FILIAL+ZDM_CODIGO. Se eu tentar
> criar um segundo com ordem 1, ele me impede. Cada tabela só tem um
> principal — regra do Protheus, e ele me protege de quebrá-la."

### Cena 7 — Gerar e baixar .PRW (3:20 - 4:00)

**Cena:** Botão Gerar Migration → modal de seleção → download do .PRW → abrir o arquivo no VSCode mostrando o AdvPL gerado.
**Voz:**

> "Hora da mágica. Gerar Migration. Seleciono o que entra. Aperto Gerar.
> Aí está o .PRW pronto. CriaSX2, CriaSX3, CriaSIX, X3_USADO codificado.
> Eu compilo isso no AppServer e roda."

### Cena 8 — Bonus: colaboração + templates (4:00 - 4:25)

**Cena:** Convidar email para uma equipe. Mostrar galeria de templates aplicando um em 1 clique.
**Voz:**

> "Bônus: tudo isso funciona em equipe, com convites e papéis. E tem
> uma galeria pública de templates — se alguém já modelou Cadastro de
> Equipamentos, você reaplica num clique escolhendo seu prefixo."

### Cena 9 — Fecha (4:25 - 4:30)

**Cena:** Volta para landing page com URL grande.
**Voz:**

> "sxgerador.com.br. Grátis, open source. Tô buscando feedback e bugs.
> Link na descrição. Abraço!"

---

## Lista de pré-gravação

- [ ] Ambiente limpo: novo projeto Demo, nada de dados antigos
- [ ] Tema da app em modo claro (melhor pra vídeo)
- [ ] Zoom do browser em 110% (legibilidade)
- [ ] Webcam testada, iluminação OK
- [ ] Mic externo conectado (não usar mic interno do notebook)
- [ ] Não notificações no desktop (Do Not Disturb ON)
- [ ] Cronômetro visível na 2ª tela

## Pós-produção

- Cortar pausas longas (> 1.5s)
- Adicionar legendas pt-BR (auto + revisão manual)
- Lower-third no início com nome + título
- Música de fundo neutra, volume baixo (-25dB)
- Última frame com call-to-action: URL + GitHub + Discord

## Descrição do YouTube

```
SXGerador é uma plataforma open source para criar, versionar e gerar
migrations AdvPL de dicionário Protheus (SX2, SX3, SIX).

🔗 Site: https://sxgerador.com.br
📚 Documentação: https://docs.sxgerador.com.br
💻 Código (MIT): https://github.com/sxgerador/sxgerador
💬 Comunidade: https://discord.gg/sxgerador

00:00 Intro
00:20 Quem sou
00:40 Criando o projeto
01:20 Modelando a tabela
02:00 Campos e X3_USADO
03:00 Índice principal
03:20 Gerando o .PRW
04:00 Colaboração e templates
04:25 Fim

Não é produto oficial TOTVS — é projeto da comunidade.

#TOTVS #Protheus #AdvPL #OpenSource
```
