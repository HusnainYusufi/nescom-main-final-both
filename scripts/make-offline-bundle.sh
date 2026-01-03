#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:-pmc-app:latest}"
OUT_DIR="${2:-offline-bundle}"
TAR_NAME="${3:-pmc-app_latest.tar}"

echo "Building image '${IMAGE}' (requires internet for base image + apt + npm)..."
docker compose build

echo "Creating offline bundle in '${OUT_DIR}'..."
mkdir -p "${OUT_DIR}"

echo "Saving image to tar: ${OUT_DIR}/${TAR_NAME}"
docker save -o "${OUT_DIR}/${TAR_NAME}" "${IMAGE}"

echo "Copying compose + import helpers..."
cp docker-compose.offline.yml "${OUT_DIR}/docker-compose.offline.yml"
cp scripts/import-image.sh "${OUT_DIR}/import-image.sh"
cp scripts/import-image.ps1 "${OUT_DIR}/import-image.ps1" || true

echo "Bundle ready in '${OUT_DIR}'. On the offline machine:"
echo "  cd ${OUT_DIR}"
echo "  ./import-image.sh ${TAR_NAME} ${IMAGE}"
echo "  docker compose -f docker-compose.offline.yml up -d"


