#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:-pmc-app:latest}"
OUT_FILE="${2:-pmc-app_latest.tar}"

echo "Exporting Docker image '${IMAGE}' to '${OUT_FILE}'..."

# Ensure image exists locally
docker image inspect "${IMAGE}" >/dev/null

docker save -o "${OUT_FILE}" "${IMAGE}"

echo "Done. Transfer '${OUT_FILE}' to the offline machine and run import-image.(sh|ps1)."


