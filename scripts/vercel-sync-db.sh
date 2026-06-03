#!/usr/bin/env bash
# Roda no build da Vercel (DATABASE_URL de produção). Corrige migrations travadas e alinha o schema.
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[vercel-sync-db] DATABASE_URL ausente — pulando."
  exit 0
fi

echo "[vercel-sync-db] Sincronizando banco Railway..."

FAILED_MIGRATIONS=(
  "20260603120000_championship_sponsor_analytics"
  "20260603140000_brand_portal_contact_social"
  "20260603000000_championship_members_sponsors"
)

for migration in "${FAILED_MIGRATIONS[@]}"; do
  npx prisma migrate resolve --rolled-back "$migration" 2>/dev/null || true
done

if npx prisma migrate deploy; then
  echo "[vercel-sync-db] migrate deploy OK"
else
  echo "[vercel-sync-db] migrate deploy falhou — usando db push"
  npx prisma db push --skip-generate
fi
