#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is niet geïnstalleerd. Installeer Node 20+ en probeer opnieuw."
  exit 1
fi

echo "== Depth MVP: dependencies installeren =="
npm install

echo "== Prisma: generate =="
npx prisma generate

echo "== Prisma: migrate (SQLite) =="
npx prisma migrate dev --name init --skip-seed

echo "== Prisma: seed demo data =="
node prisma/seed.js || true

echo "== Start Next.js dev server =="
npm run dev
