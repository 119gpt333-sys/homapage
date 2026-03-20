# Prebuilt Vercel 배포 스크립트
# 로컬 빌드 후 .vercel/output 생성하여 배포

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "1. 빌드 중..."
npm run build

Write-Host "2. .vercel/output 생성..."
$outputDir = ".vercel\output"
$staticDir = "$outputDir\static"
Remove-Item -Recurse -Force $outputDir -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $staticDir | Out-Null

Copy-Item -Path "dist\*" -Destination $staticDir -Recurse -Force

# SPA 라우팅 + API 제외
$config = @{
  version = 3
  routes = @(
    @{ handle = "filesystem" }
    @{ src = "/((?!api/).*)"; dest = "/index.html" }
  )
} | ConvertTo-Json -Depth 5

$config | Out-File -FilePath "$outputDir\config.json" -Encoding utf8

Write-Host "3. Vercel 배포 중..."
npx vercel deploy --prebuilt --prod --yes
