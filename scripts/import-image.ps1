param(
  [string]$TarFile = "pmc-app_latest.tar",
  [string]$Image = "pmc-app:latest",
  [string[]]$AlsoTagAs = @("pmc_app:latest")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TarFile)) {
  throw "Tar file not found: $TarFile"
}

Write-Host "Loading Docker image tar '$TarFile'..."
$out = docker load -i $TarFile

# Some tar files may contain a different image repo:tag than the one our compose file expects.
# Detect what Docker loaded and retag it to $Image (without echoing the raw docker output).
$loadedImage = $null
$loadedMatches = [regex]::Matches($out, '(?m)^Loaded image:\s+(.+)$')
if ($loadedMatches.Count -gt 0) {
  $loadedImage = $loadedMatches[$loadedMatches.Count - 1].Groups[1].Value.Trim()
}

$loadedImageId = $null
if (-not $loadedImage) {
  $idMatches = [regex]::Matches($out, '(?m)^Loaded image ID:\s+(.+)$')
  if ($idMatches.Count -gt 0) {
    $loadedImageId = $idMatches[$idMatches.Count - 1].Groups[1].Value.Trim()
  }
}

if ($loadedImage -and $loadedImage -ne $Image) {
  Write-Host "Tagging loaded image as '$Image'..."
  docker tag $loadedImage $Image | Out-Null
  try { docker image rm $loadedImage | Out-Null } catch {}
} elseif ($loadedImageId) {
  Write-Host "Tagging loaded image as '$Image'..."
  docker tag $loadedImageId $Image | Out-Null
}

# Ensure the expected tag exists (otherwise compose will fail to find the image)
docker image inspect $Image *> $null

Write-Host "Image loaded."

# Tag to a known name (sometimes Compose/project naming ends up expecting pmc_app:latest)
if ($AlsoTagAs.Count -gt 0) {
  foreach ($tag in $AlsoTagAs) {
    if ([string]::IsNullOrWhiteSpace($tag)) { continue }
    Write-Host "Tagging '$Image' as '$tag'..."
    docker tag $Image $tag | Out-Null
  }
}

Write-Host "Done. You can now run:"
Write-Host "  docker compose -f docker-compose.offline.yml up -d"
Write-Host ""
Write-Host "Tip: if your Docker Compose supports it, you can enforce no-pull with:"
Write-Host "  docker compose -f docker-compose.offline.yml up -d --pull never"


