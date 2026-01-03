# PMC Docker Setup

Single-container image that runs:
- Frontend (static build served via `serve` on 4173)
- Backend (Express on internal 3254, all routes prefixed with `/api`)
- MongoDB (embedded)
- Redis (embedded)

## Prerequisites
- Docker Desktop (WSL2 on Windows)
- Free host ports: 4173 (frontend) and 3254 (backend).

## Build
```bash
# From repo root
docker compose build
# For verbose output:
# docker compose build --progress=plain
```

## Run
```bash
docker compose up -d
```

## Offline / air-gapped servers (no internet)
This repo **cannot be built offline** with the current `Dockerfile` because it needs to download:
- the base image (`node:18-bookworm`)
- Debian/MongoDB/Redis packages via `apt`
- npm packages via the npm registry

Instead, build once on an internet-connected machine and transfer the built image as a tar file.

### On an internet-connected machine
```powershell
# Build the image
docker compose build

# Create an offline bundle folder with the image tar + compose file
.\scripts\make-offline-bundle.ps1
```

```bash
# Linux equivalent
./scripts/make-offline-bundle.sh
```

Copy the resulting `offline-bundle/` folder to the offline server (USB, internal share, etc).

### On the offline server
```powershell
cd offline-bundle

# Load the image (also tags it as pmc_app:latest for compatibility)
.\import-image.ps1 -TarFile "pmc-app_latest.tar"

# Run (no builds; and it won't pull anything as long as the image is already loaded)
docker compose -f docker-compose.offline.yml up -d
```

### On an Ubuntu (Linux) offline server / VM
```bash
cd offline-bundle

# Load the image tar (and tag it as pmc-app:latest + pmc_app:latest)
chmod +x import-image.sh
./import-image.sh pmc-app_latest.tar pmc-app:latest

# Run (no builds; and it won't pull anything as long as the image is already loaded)
docker compose -f docker-compose.offline.yml up -d
```

If you ever see `unexpected end of JSON input` for an image, your local Docker image cache is corrupted.
Remove the image and re-load the tar:

```powershell
docker compose -f docker-compose.offline.yml down
docker image rm -f pmc-app:latest
docker image rm -f pmc_app:latest
.\import-image.ps1 -TarFile "pmc-app_latest.tar"
docker compose -f docker-compose.offline.yml up -d
```

## Access
- Frontend: http://localhost:4173
- Backend: http://localhost:3254
- When served from 4173, the frontend auto-calls `http://<same-host>:3254/api` by default.
  - If you deploy behind a reverse proxy (same origin), rebuild with `VITE_API_BASE_URL=/api`.
- Logs: `docker compose logs -f`
- Stop: `docker compose down`

## Config
- `/api` prefix applied in backend routes.
- Frontend `VITE_API_BASE_URL` falls back to `http://<host>:3254/api` when served from 4173; override at build with `--build-arg VITE_API_BASE_URL=...` if you front it with another proxy.
- Environment variables set in `docker-compose.yml` under `environment:`; move secrets to an env file if needed.

## Rebuild without cache (if layers corrupt)
```bash
docker compose build --no-cache --progress=plain
```

