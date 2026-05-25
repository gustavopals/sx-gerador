#!/bin/sh
# Backup Postgres do SXGerador.
# Roda via cron dentro do container "backup" do docker-compose.prod.yml,
# ou manualmente: docker compose run --rm backup /usr/local/bin/backup-postgres.sh

set -eu

: "${PGHOST:?PGHOST required}"
: "${PGUSER:?PGUSER required}"
: "${PGDATABASE:?PGDATABASE required}"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILE="$BACKUP_DIR/sxgerador-$PGDATABASE-$TIMESTAMP.sql.gz"

echo "[$(date -Iseconds)] Starting backup of $PGDATABASE to $FILE"
pg_dump --clean --if-exists --no-owner --no-privileges "$PGDATABASE" \
  | gzip -9 > "$FILE"

SIZE=$(du -h "$FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup OK — $FILE ($SIZE)"

echo "[$(date -Iseconds)] Pruning backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -type f -name "sxgerador-*.sql.gz" -mtime +"$RETENTION_DAYS" -print -delete

echo "[$(date -Iseconds)] Done"
