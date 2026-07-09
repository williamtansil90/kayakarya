#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "File .env belum ada. Salin dari .env.example dulu:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "==> Build & start Docker containers..."
docker compose up -d --build

echo "==> Menunggu backend sehat..."
for i in $(seq 1 30); do
  if docker compose exec -T backend python -c \
    "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8702/api/health')" 2>/dev/null; then
    break
  fi
  sleep 2
done

echo "==> Deploy nginx reverse proxy untuk kayakarya.com..."
bash "$ROOT/deploy/setup-nginx.sh"

echo ""
echo "Selesai! Aplikasi berjalan di Docker:"
echo "  - Frontend (internal): http://127.0.0.1:8701"
echo "  - Backend (internal):  backend:8702 (via /api di nginx web)"
echo "  - Domain publik:       https://kayakarya.com"
echo ""
echo "Cek status: docker compose ps"
echo "Cek log:    docker compose logs -f"
