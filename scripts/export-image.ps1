param(
  [string]$Image = "pmc-app:latest",
  [string]$OutFile = "pmc-app_latest.tar"
)

$ErrorActionPreference = "Stop"

Write-Host "Exporting Docker image '$Image' to '$OutFile'..."

# Ensure the image exists locally
docker image inspect $Image *> $null

docker save -o $OutFile $Image

Write-Host "Done."
Write-Host "Next: copy '$OutFile' + 'docker-compose.offline.yml' to the offline server and run scripts/import-image.ps1"


