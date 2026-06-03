#!/usr/bin/env bash
# Roda no build da Vercel (DATABASE_URL de produção). Corrige migrations travadas e alinha o schema.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[vercel-sync-db] DATABASE_URL ausente — pulando."
  exit 0
fi

echo "[vercel-sync-db] Sincronizando banco..."

npx prisma migrate resolve --rolled-back "20260603120000_championship_sponsor_analytics" 2>/dev/null || true

if npx prisma migrate deploy; then
  echo "[vercel-sync-db] migrate deploy OK"
else
  echo "[vercel-sync-db] migrate deploy falhou — usando db push"
  npx prisma db push --skip-generate
fi
