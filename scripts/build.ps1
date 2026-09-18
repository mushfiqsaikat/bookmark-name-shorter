$ErrorActionPreference = "Stop"

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$distDirectory = [System.IO.Path]::GetFullPath((Join-Path $projectRoot "dist"))

if (-not $distDirectory.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to build outside the project directory."
}

$manifest = Get-Content -Raw -LiteralPath (Join-Path $projectRoot "manifest.json") | ConvertFrom-Json
$archiveName = "bookmark-name-shorter-v$($manifest.version).zip"
$archivePath = Join-Path $distDirectory $archiveName
$stagingDirectory = Join-Path $distDirectory "package"

if (Test-Path -LiteralPath $distDirectory) {
  Remove-Item -LiteralPath $distDirectory -Recurse -Force
}

New-Item -ItemType Directory -Path (Join-Path $stagingDirectory "icons") -Force | Out-Null

@(
  "manifest.json",
  "background.js",
  "bookmark-manager.js",
  "cleanup-controller.js",
  "title.js"
) | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $projectRoot $_) -Destination $stagingDirectory
}

@(16, 24, 32, 48, 128) | ForEach-Object {
  $iconName = "icon$_.png"
  Copy-Item -LiteralPath (Join-Path $projectRoot "icons\$iconName") -Destination (Join-Path $stagingDirectory "icons")
}

Compress-Archive -Path (Join-Path $stagingDirectory "*") -DestinationPath $archivePath -CompressionLevel Optimal
Remove-Item -LiteralPath $stagingDirectory -Recurse -Force

Write-Output "Built $archivePath"
