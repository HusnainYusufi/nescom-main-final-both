#!/usr/bin/env bash
set -euo pipefail

# Start MongoDB
mkdir -p "${MONGO_DATA:-/data/db}"
mongod --dbpath "${MONGO_DATA:-/data/db}" --bind_ip_all --fork --logpath /var/log/mongodb.log

# Start Redis
redis-server --daemonize yes

# Seed admin user (idempotent; uses env vars provided in docker-compose)
node /app/nscm-backend/scripts/seedAdmin.js

# Start backend
node /app/nscm-backend/app.js &

# Start frontend (served statically); Vite builds to /app/pmc-front/build
serve -s /app/pmc-front/build -l "${FRONTEND_PORT:-4173}"

