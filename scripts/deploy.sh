#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

echo "🚀 DevHub Production Deployment"
echo "================================"

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"
DC="docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE}"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found!"
  exit 1
fi

# Ensure required vars exist (backend требует JWT_SECRET)
if ! grep -q '^JWT_SECRET=' "$ENV_FILE" || [ -z "$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)" ]; then
  echo "❌ JWT_SECRET is missing in $ENV_FILE"
  echo "   Add something like: JWT_SECRET=$(openssl rand -hex 32)"
  exit 1
fi

echo "📥 Pulling latest code..."
git pull origin main

echo "🛑 Stopping existing containers..."
$DC down

echo "🔨 Building images..."
$DC build --no-cache

echo "🚀 Starting infra (postgres/redis/minio)..."
$DC up -d postgres redis minio

echo "⏳ Waiting for postgres to be ready..."
# ждём pg_isready внутри контейнера
for i in {1..30}; do
  if $DC exec -T postgres pg_isready -U "${DB_USER:-devhub}" >/dev/null 2>&1; then
    echo "✅ Postgres is ready"
    break
  fi
  sleep 2
  if [ "$i" -eq 30 ]; then
    echo "❌ Postgres not ready"
    $DC logs --tail=200 postgres
    exit 1
  fi
done

echo "📊 Running migrations (migrate/migrate)..."
# Берём DB_* из env.production (уже подхвачено через --env-file)
DB_USER="$(grep '^DB_USER=' "$ENV_FILE" | cut -d= -f2- || echo devhub)"
DB_PASSWORD="$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2- || echo devhub)"
DB_NAME="$(grep '^DB_NAME=' "$ENV_FILE" | cut -d= -f2- || echo devhub)"

docker run --rm \
  --network devhub_devhub-network \
  -v "$APP_DIR/backend/migrations:/migrations" \
  migrate/migrate:4 \
  -path=/migrations \
  -database "postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?sslmode=disable" \
  up

echo "🚀 Starting app services..."
$DC up -d backend frontend nginx

echo "⏳ Waiting a bit..."
sleep 3

echo "🏥 Health check..."
curl -fsS http://127.0.0.1/health >/dev/null
echo "✅ Deployment successful!"
echo "🌐 Open: http://$(hostname -I | awk '{print $1}')/"
