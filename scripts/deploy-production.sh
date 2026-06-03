#!/usr/bin/env bash
# Deploy código + migrations + auditoria (produção Railway).
set -euo pipefail
cd "$(dirname "$0")/.."

SLUG="${1:-}"

echo "=== 1/4 Git push ==="
git push origin "$(git branch --show-current)"

echo "=== 2/4 Migrations (Railway) ==="
export DATABASE_URL="${DATABASE_URL:-}"
if [[ -z "$DATABASE_URL" && -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
bash scripts/fix-production-migrations.sh

echo "=== 3/4 Deploy Vercel (production) ==="
npx vercel deploy --prod --yes

echo "=== 4/4 Auditoria ==="
if [[ -n "$SLUG" ]]; then
  npm run audit:championship-isolation -- "$SLUG"
else
  npm run audit:championship-isolation
fi

echo "=== Concluído ==="
