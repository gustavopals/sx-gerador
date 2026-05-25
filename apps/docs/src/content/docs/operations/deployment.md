---
title: Runbook de produção
description: Como provisionar, hospedar e operar o SXGerador em um servidor de produção.
---

> Este runbook é para **operadores** que vão hospedar o SXGerador em um servidor próprio (self-hosted ou SaaS oficial). Usuários finais não precisam disso.

## Visão geral da topologia

```
┌─────────────────────────────────────────────────────────┐
│                       Internet                          │
└──────────────────────────┬──────────────────────────────┘
                           │ 80/443
                  ┌────────▼─────────┐
                  │      Traefik     │  Let's Encrypt + HTTPS redirect
                  └────────┬─────────┘
            ┌──────────────┼──────────────┐
       sxgerador.com.br  api.…   docs.…
            │              │              │
       ┌────▼───┐    ┌────▼───┐     ┌────▼───┐
       │  web   │    │  api   │     │  docs  │
       │ nginx  │    │ node22 │     │ nginx  │
       └────────┘    └────┬───┘     └────────┘
                          │
                    ┌─────▼─────┐
                    │ postgres  │
                    │    16     │
                    └───────────┘
```

## Pré-requisitos

| Recurso | Especificação mínima                             |
| ------- | ------------------------------------------------ |
| VPS     | 2 vCPU, 4 GB RAM, 40 GB SSD                      |
| OS      | Debian 12 ou Ubuntu 24.04 LTS                    |
| Docker  | 24+ com Compose v2                               |
| Domínio | `sxgerador.com.br` + subdomínios `api.`, `docs.` |
| Portas  | 80 e 443 abertas para o mundo                    |

## 1. Provisionar o servidor

```bash
# Como root, no servidor recém-criado:
apt update && apt upgrade -y
apt install -y curl git docker.io docker-compose-v2 ufw fail2ban
systemctl enable --now docker

# Firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Usuário de deploy
useradd -m -s /bin/bash sxg
usermod -aG docker sxg
mkdir -p /opt/sxgerador
chown sxg:sxg /opt/sxgerador
```

## 2. Configurar DNS

No painel do seu registrador (Registro.br, Cloudflare etc.), aponte para o IP do servidor:

| Registro                | Tipo | Valor         |
| ----------------------- | ---- | ------------- |
| `sxgerador.com.br`      | A    | `<IP do VPS>` |
| `www.sxgerador.com.br`  | A    | `<IP do VPS>` |
| `api.sxgerador.com.br`  | A    | `<IP do VPS>` |
| `docs.sxgerador.com.br` | A    | `<IP do VPS>` |

Aguarde a propagação (`dig sxgerador.com.br` deve retornar o IP).

## 3. Clonar e configurar

```bash
su - sxg
cd /opt/sxgerador
git clone https://github.com/sxgerador/sxgerador.git .

cp .env.production.example .env.production
# Edite e preencha todos os valores. Gere secrets com:
#   openssl rand -base64 64
nano .env.production
chmod 600 .env.production
```

## 4. SSL automático (Let's Encrypt)

Já está pré-configurado no `tools/docker/docker-compose.prod.yml` via Traefik com challenge TLS. Basta garantir que:

- `ACME_EMAIL` está preenchido em `.env.production`
- Portas 80 e 443 estão abertas
- DNS já propagou

O certificado é gerado no **primeiro `up`** e renovado automaticamente.

## 5. Subir o stack

```bash
cd /opt/sxgerador
docker compose -f tools/docker/docker-compose.prod.yml --env-file .env.production pull
docker compose -f tools/docker/docker-compose.prod.yml --env-file .env.production up -d
```

Verifique:

```bash
docker compose -f tools/docker/docker-compose.prod.yml ps
curl -fsS https://api.sxgerador.com.br/health
curl -fsSI https://sxgerador.com.br/
curl -fsSI https://docs.sxgerador.com.br/
```

## 6. Backup automatizado

O serviço `backup` no compose já roda **diariamente às 03:00 UTC** e mantém **14 dias** (configurável via `BACKUP_RETENTION_DAYS`). Arquivos vão para `./backups/sxgerador-*.sql.gz` no host.

Para snapshots manuais:

```bash
docker compose -f tools/docker/docker-compose.prod.yml --env-file .env.production \
  run --rm backup /usr/local/bin/backup-postgres.sh
```

### Restore

```bash
gunzip -c backups/sxgerador-sxgerador-20260101T030000Z.sql.gz | \
  docker compose exec -T postgres psql -U sxgerador -d sxgerador
```

### Off-site

**Fortemente recomendado:** copie `backups/` para fora do servidor (S3, Backblaze B2, rsync para outro VPS) via cron separado. O backup local não protege contra perda do servidor inteiro.

```bash
# Exemplo com rclone para S3
rclone copy /opt/sxgerador/backups remote:sxgerador-backups --max-age 7d
```

## 7. Deploy contínuo

O workflow `.github/workflows/deploy.yml` builda imagens Docker e empurra para GHCR a cada push em `main`, depois faz SSH no servidor e `docker compose pull && up -d`.

**Secrets necessários no GitHub repo settings:**

| Secret           | Descrição                           |
| ---------------- | ----------------------------------- |
| `DEPLOY_HOST`    | IP/hostname do servidor             |
| `DEPLOY_USER`    | Usuário SSH (ex. `sxg`)             |
| `DEPLOY_SSH_KEY` | Chave SSH privada (formato OpenSSH) |

## 8. Observabilidade

Logs via `docker compose logs`. Para produção séria, considere:

- **Métricas:** Prometheus + Grafana
- **Logs:** Loki ou ELK
- **Alertas:** Uptime Robot ou healthchecks.io apontando para `https://api.sxgerador.com.br/health`

## 9. Troubleshooting

### Certificado não gerado

```bash
docker compose logs traefik | grep acme
```

Causas comuns: DNS ainda não propagou; porta 80 bloqueada; `ACME_EMAIL` inválido.

### Migration Prisma falhou no startup

```bash
docker compose exec api pnpm --filter api prisma migrate status
```

Se necessário, rode `prisma migrate deploy` manualmente.

### Banco cheio

```bash
docker compose exec postgres psql -U sxgerador -c "SELECT pg_size_pretty(pg_database_size('sxgerador'));"
```
