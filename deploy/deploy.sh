#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/meetflow
compose=(docker compose --project-name meetflow --env-file .env.production --env-file images.env -f docker-compose.prod.yml)
"${compose[@]}" config --quiet
"${compose[@]}" --profile tools pull
"${compose[@]}" up -d --wait --wait-timeout 120 postgres redis
# Stop all application writers before applying migrations. A failure leaves them stopped.
"${compose[@]}" stop -t 180 api worker
"${compose[@]}" run --rm --no-deps migrate
"${compose[@]}" up -d --wait --wait-timeout 180 api worker frontend proxy
"${compose[@]}" ps
