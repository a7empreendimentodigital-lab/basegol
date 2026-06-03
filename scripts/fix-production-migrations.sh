#!/usr/bin/env bash
# Corrige migrations travadas no Railway e aplica o restante.
# Requer DATABASE_URL apontando para produção (rlwy.net).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Erro: defina DATABASE_URL (Railway) no .env ou no ambiente."
  exit 1
fi

if [[ "$DATABASE_URL" != *"rlwy.net"* ]] && [[ "$DATABASE_URL" != *"railway"* ]]; then
  echo "Aviso: DATABASE_URL não parece ser Railway. Confirme antes de continuar."
  read -r -p "Continuar mesmo assim? [y/N] " ans
  [[ "${ans,,}" == "y" ]] || exit 1
fi

echo "→ Resolvendo migration analytics (falha anterior)..."
npx prisma migrate resolve --rolled-back "20260603120000_championship_sponsor_analytics" || true

echo "→ Aplicando migrations..."
npx prisma migrate deploy

echo "→ Conferindo status..."
npx prisma migrate status

echo "Pronto."
