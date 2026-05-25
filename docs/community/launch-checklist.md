# Checklist de Lançamento Público

Execute D-1 (véspera) e D (dia do lançamento). Marque conforme avança.

## D-7 (uma semana antes)

- [ ] Domínios apontando corretamente (`sxgerador.com.br`, `api.`, `docs.`)
- [ ] SSL renovando automaticamente (`certbot renew --dry-run` ou Traefik ACME log)
- [ ] Backup automatizado rodando e testado (restore funcionou)
- [ ] Todos os bugs `priority:critical` resolvidos
- [ ] Landing page revisada (mobile + desktop)
- [ ] Documentação completa (índice, tutorial, FAQ, referências)
- [ ] Vídeo demo gravado e publicado no YouTube/Vimeo
- [ ] Repositório GitHub pronto para ser público (revisar histórico, secrets, branches)
- [ ] README badges atualizados (build, license, stars)
- [ ] LICENSE confirmado MIT
- [ ] CODE_OF_CONDUCT, SECURITY, SUPPORT, CONTRIBUTING populados
- [ ] Issue templates funcionando
- [ ] Discord criado com canais: #anuncios, #geral, #ajuda, #templates, #dev
- [ ] hello@sxgerador.com.br e security@sxgerador.com.br funcionando

## D-1 (véspera)

- [ ] Smoke test em produção (signup, projeto, tabela, migration)
- [ ] Snapshot do banco
- [ ] Posts agendados/escritos (LinkedIn, TDN, grupos)
- [ ] Vídeo demo upload final + thumbnail
- [ ] Imagens OG para compartilhamento (LinkedIn/Twitter) testadas
- [ ] Avisar beta testers que será no dia seguinte (eles podem amplificar)

## D (dia do lançamento)

### Manhã (8h-10h horário do BR)

- [ ] Tornar repositório GitHub público
- [ ] Publicar release v0.1.0 (ou v1.0.0-beta.1) com changelog
- [ ] Tornar Discord público (link compartilhável)

### Meio da manhã (10h-12h)

- [ ] Postar no LinkedIn (ver [launch-post-linkedin.md](./launch-post-linkedin.md))
- [ ] Postar no TDN (ver [launch-post-tdn.md](./launch-post-tdn.md))
- [ ] Postar nos grupos Telegram/Discord (ver [launch-post-discord-telegram.md](./launch-post-discord-telegram.md))
- [ ] Avisar beta testers para curtir/compartilhar

### Tarde

- [ ] Responder TODOS os comentários nas primeiras 6h
- [ ] Acompanhar issues no GitHub
- [ ] Monitorar Sentry/logs para erros novos
- [ ] Postar follow-up no fim do dia com primeira reação

### Noite

- [ ] Recolher métricas do dia (signups, stars, comments)
- [ ] Decidir patches/respostas para D+1

## D+7

- [ ] Post de "primeira semana — números"
- [ ] Triagem completa dos issues novos
- [ ] Retro pessoal: o que funcionou, o que não funcionou
