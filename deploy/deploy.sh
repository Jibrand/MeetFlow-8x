#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/meetflow
compose=(docker compose --project-name meetflow --env-file .env.production --env-file images.env -f docker-compose.prod.yml)
"${compose[@]}" config --quiet
# Inspect ingress ownership before changing application services. Never stop an
# unrelated listener or remove containers/volumes to make a deployment succeed.
echo 'Ingress listeners (read-only diagnostics):'
sudo -n ss -ltnp '( sport = :80 or sport = :443 )' || true
docker ps --format 'table {{.Names}}\t{{.Ports}}'
if command -v systemctl >/dev/null; then
  systemctl is-active nginx apache2 caddy || true
fi
"${compose[@]}" --profile tools pull
"${compose[@]}" up -d --wait --wait-timeout 120 postgres redis
# Stop all application writers before applying migrations. A failure leaves them stopped.
"${compose[@]}" stop -t 180 api worker
"${compose[@]}" run --rm --no-deps migrate
"${compose[@]}" up -d --wait --wait-timeout 180 api worker frontend proxy
"${compose[@]}" ps
