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

$sectionASource = Join-Path $VideoRoot "Border_collie_in_202603302102.mp4"
$sectionBSource = Join-Path $VideoRoot "Border_collie_in_202603302100 (1).mp4"

foreach ($sourcePath in @($sectionASource, $sectionBSource)) {
  if (-not (Test-Path $sourcePath)) {
    throw "Missing source video: $sourcePath"
  }
}

if (Test-Path $assetRoot) {
  Get-ChildItem -Path $assetRoot -Force | Remove-Item -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $assetRoot | Out-Null
New-Item -ItemType Directory -Force -Path $frameRoot | Out-Null

$filmDesktopPath = Join-Path $assetRoot "cinematic-film-desktop.mp4"
$filmMobilePath = Join-Path $assetRoot "cinematic-film-mobile.mp4"
$filmPosterPath = Join-Path $assetRoot "cinematic-film-poster.webp"

$scrollMobilePath = Join-Path $assetRoot "interactive-scroll-mobile.mp4"
$scrollPosterPath = Join-Path $assetRoot "interactive-scroll-poster.webp"
$scrollManifestPath = Join-Path $assetRoot "interactive-scroll-manifest.json"
$scrollIntermediatePath = Join-Path $assetRoot "interactive-scroll-intermediate.mp4"

$cinematicFilterBase = "crop=3520:1980:0:0,eq=brightness=0.035:saturation=1.04:contrast=1.03"
$scrollFilterBase = "crop=3520:1980:0:0,eq=brightness=0.045:saturation=1.05:contrast=1.04"

Invoke-Ffmpeg -Arguments @(
  "-i", $sectionASource,
  "-vf", "$cinematicFilterBase,scale=2560:1440:flags=lanczos",
  "-an",
  "-c:v", "libx264",
  "-preset", "slow",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  $filmDesktopPath
)

Invoke-Ffmpeg -Arguments @(
  "-i", $sectionASource,
  "-vf", "$cinematicFilterBase,scale=1280:720:flags=lanczos",
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "21",
  "-pix_fmt", "yuv420p",
  $filmMobilePath
)

Invoke-Ffmpeg -Arguments @(
  "-ss", "3.9",
  "-i", $sectionASource,
  "-frames:v", "1",
  "-vf", "$cinematicFilterBase,scale=1600:900:flags=lanczos",
  "-c:v", "libwebp",
  "-compression_level", "6",
  "-quality", "82",
  "-update", "1",
  $filmPosterPath
)

Invoke-Ffmpeg -Arguments @(
  "-i", $sectionBSource,
  "-vf", "$scrollFilterBase,scale=1280:720:flags=lanczos",
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "21",
  "-pix_fmt", "yuv420p",
  $scrollMobilePath
)

Invoke-Ffmpeg -Arguments @(
  "-ss", "4.0",
  "-i", $sectionBSource,
  "-frames:v", "1",
  "-vf", "$scrollFilterBase,scale=1600:900:flags=lanczos",
  "-c:v", "libwebp",
  "-compression_level", "6",
  "-quality", "82",
  "-update", "1",
  $scrollPosterPath
)

Invoke-Ffmpeg -Arguments @(
  "-i", $sectionBSource,
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
Write-Host "  Section A desktop: $filmDesktopPath"
Write-Host "  Section A mobile:  $filmMobilePath"
Write-Host "  Section B mobile:  $scrollMobilePath"
Write-Host "  Section B frames:  $frameCount files in $frameRoot"
