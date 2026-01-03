param(
  [string]$Image = "pmc-app:latest",
  [string]$OutDir = "offline-bundle",
  [string]$TarName = "pmc-app_latest.tar"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Write-Host "Building image '$Image' (requires internet for base image + apt + npm)..."
docker compose build

Write-Host "Saving image to bundle..."
docker save -o (Join-Path $OutDir $TarName) $Image

Write-Host "Copying offline compose + helper scripts..."
Copy-Item -Force "docker-compose.offline.yml" (Join-Path $OutDir "docker-compose.offline.yml")
Copy-Item -Force "scripts\import-image.ps1" (Join-Path $OutDir "import-image.ps1")
Copy-Item -Force "scripts\import-image.sh" (Join-Path $OutDir "import-image.sh")

Write-Host "Bundle created in '$OutDir'."
Write-Host "Transfer that folder to the offline server, then run:"
Write-Host "  .\import-image.ps1 -TarFile $TarName"
Write-Host "  docker compose -f docker-compose.offline.yml up -d --pull never"


