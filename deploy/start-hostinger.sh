#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.hostinger.yml"

if [ ! -f .env ]; then
  echo "File .env belum ada. Jalankan: cp .env.example .env && nano .env"
  exit 1
fi

echo "==> Build images (no cache)..."
docker builder prune -f >/dev/null 2>&1 || true
$COMPOSE build --no-cache --pull

echo "==> Start containers..."
$COMPOSE up -d

echo ""
echo "Selesai! Cek: docker compose ps"
echo "Akses: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}'):8701"
