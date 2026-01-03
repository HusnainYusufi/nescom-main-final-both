#!/usr/bin/env bash
set -euo pipefail

TAR_FILE="${1:-pmc-app_latest.tar}"
IMAGE="${2:-pmc-app:latest}"

if [[ ! -f "$TAR_FILE" ]]; then
  echo "Tar file not found: $TAR_FILE" >&2
  exit 1
fi

echo "Loading Docker image tar: $TAR_FILE"
out="$(docker load -i "$TAR_FILE")"

# Some tar files may contain a different image repo:tag than the one our compose file expects.
# Detect what Docker loaded and retag it to $IMAGE (without echoing the raw docker output).
loaded_image="$(echo "$out" | sed -n 's/^Loaded image: //p' | tail -n 1 || true)"
loaded_id="$(echo "$out" | sed -n 's/^Loaded image ID: //p' | tail -n 1 || true)"

if [[ -n "${loaded_image:-}" && "$loaded_image" != "$IMAGE" ]]; then
  docker tag "$loaded_image" "$IMAGE" >/dev/null 2>&1 || true
  docker image rm "$loaded_image" >/dev/null 2>&1 || true
elif [[ -n "${loaded_id:-}" ]]; then
  docker tag "$loaded_id" "$IMAGE" >/dev/null 2>&1 || true
fi

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "Failed to tag loaded image as '$IMAGE'. Please verify the tar contains a Docker image." >&2
  exit 1
fi

# Compatibility tag (some Compose/project naming ends up expecting pmc_app:latest)
echo "Tagging '$IMAGE' as 'pmc_app:latest' (compat)..."
docker tag "$IMAGE" "pmc_app:latest" >/dev/null 2>&1 || true

echo "Done. Run:"
echo "  docker compose -f docker-compose.offline.yml up -d"


