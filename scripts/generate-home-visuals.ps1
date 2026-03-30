param(
  [string]$RepoRoot = "C:\Users\ADMIN\Downloads\pethub\Pethub-main-home-fullscreen",
  [string]$VideoRoot = "C:\Users\ADMIN\Downloads\pethub\Video"
)

$ErrorActionPreference = "Stop"

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found in PATH."
  }
}

function Invoke-Ffmpeg {
  param([string[]]$Arguments)

  & ffmpeg -y -hide_banner @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg exited with code $LASTEXITCODE."
  }
}

Assert-Command -Name "ffmpeg"

$assetRoot = Join-Path $RepoRoot "public\assets\home-video"
$frameRoot = Join-Path $assetRoot "interactive-scroll-frames"
$scrollSource = Join-Path $VideoRoot "Border_collie_in_202603302100 (1).mp4"

if (-not (Test-Path $scrollSource)) {
  throw "Missing source video: $scrollSource"
}

if (Test-Path $assetRoot) {
  Get-ChildItem -Path $assetRoot -Force | Remove-Item -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null
New-Item -ItemType Directory -Force -Path $frameRoot | Out-Null

$scrollPosterPath = Join-Path $assetRoot "interactive-scroll-poster.webp"
$scrollManifestPath = Join-Path $assetRoot "interactive-scroll-manifest.json"
$scrollIntermediatePath = Join-Path $assetRoot "interactive-scroll-intermediate.mp4"

$scrollFilterBase = "crop=3520:1980:0:0,eq=brightness=0.045:saturation=1.05:contrast=1.04"

Invoke-Ffmpeg -Arguments @(
  "-ss", "4.0",
  "-i", $scrollSource,
  "-frames:v", "1",
  "-vf", "$scrollFilterBase,scale=1600:900:flags=lanczos",
  "-c:v", "libwebp",
  "-compression_level", "6",
  "-quality", "82",
  "-update", "1",
  $scrollPosterPath
)

Invoke-Ffmpeg -Arguments @(
  "-i", $scrollSource,
  "-vf", "$scrollFilterBase,scale=1920:1080:flags=lanczos,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:vsbmc=1",
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  $scrollIntermediatePath
)

Invoke-Ffmpeg -Arguments @(
  "-i", $scrollIntermediatePath,
  "-an",
  "-start_number", "1",
  "-c:v", "libwebp",
  "-compression_level", "6",
  "-quality", "78",
  (Join-Path $frameRoot "frame-%03d.webp")
)

$frameCount = (Get-ChildItem -Path $frameRoot -Filter "frame-*.webp").Count
$manifest = @{
  frameCount = $frameCount
  fps = 48
  padLength = 3
} | ConvertTo-Json

Set-Content -Path $scrollManifestPath -Value $manifest -Encoding ascii

if (Test-Path $scrollIntermediatePath) {
  Remove-Item -Path $scrollIntermediatePath -Force
}

Write-Host "Generated homepage visuals:"
Write-Host "  Poster: $scrollPosterPath"
Write-Host "  Frames: $frameCount files in $frameRoot"
Write-Host "  Manifest: $scrollManifestPath"
