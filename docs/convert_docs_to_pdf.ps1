# Bhotch CRM Documentation to PDF Converter
# PowerShell Script for Windows

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Bhotch CRM - Documentation PDF Converter" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if pandoc is installed
if (!(Get-Command pandoc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Pandoc is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Pandoc using one of these methods:" -ForegroundColor Yellow
    Write-Host "  1. Chocolatey: choco install pandoc" -ForegroundColor White
    Write-Host "  2. Download from: https://pandoc.org/installing.html" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Pandoc found: $(pandoc --version | Select-Object -First 1)" -ForegroundColor Green
Write-Host ""

# Create output directory
$outputDir = "generated"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
    Write-Host "📁 Created output directory: $outputDir" -ForegroundColor Green
}

# Get current date
$currentDate = Get-Date -Format "yyyy-MM-dd"

# Convert System Guide
Write-Host "📄 Converting COMPREHENSIVE_SYSTEM_GUIDE.md..." -ForegroundColor Cyan
pandoc COMPREHENSIVE_SYSTEM_GUIDE.md `
  -o "$outputDir/Bhotch_CRM_System_Guide.pdf" `
  --pdf-engine=xelatex `
  --toc `
  --toc-depth=3 `
  --number-sections `
  -V geometry:margin=1in `
  -V fontsize=10pt `
  -V documentclass=report `
  -V colorlinks=true `
  -V linkcolor=blue `
  -V urlcolor=blue `
  -V toccolor=gray `
  --highlight-style=tango `
  -V title="Bhotch CRM - Comprehensive System Guide" `
  -V author="Bhotch CRM Development Team" `
  -V date="$currentDate"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ System Guide PDF created successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ System Guide conversion failed!" -ForegroundColor Red
}

Write-Host ""

# Convert User Guide
Write-Host "📄 Converting USER_FEATURE_GUIDE.md..." -ForegroundColor Cyan
pandoc USER_FEATURE_GUIDE.md `
  -o "$outputDir/Bhotch_CRM_User_Guide.pdf" `
  --pdf-engine=xelatex `
  --toc `
  --toc-depth=2 `
  --number-sections `
  -V geometry:margin=1in `
  -V fontsize=11pt `
  -V documentclass=article `
  -V colorlinks=true `
  -V linkcolor=blue `
  -V urlcolor=blue `
  -V toccolor=gray `
  --highlight-style=tango `
  -V title="Bhotch CRM - User Feature Guide" `
  -V author="Bhotch CRM Development Team" `
  -V date="$currentDate"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ User Guide PDF created successfully!" -ForegroundColor Green
} else {
    Write-Host "  ❌ User Guide conversion failed!" -ForegroundColor Red
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  ✅ PDF Conversion Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files:" -ForegroundColor White
Write-Host "  📑 $outputDir/Bhotch_CRM_System_Guide.pdf" -ForegroundColor Cyan
Write-Host "  📑 $outputDir/Bhotch_CRM_User_Guide.pdf" -ForegroundColor Cyan
Write-Host ""

# Get file sizes
$systemGuide = Get-Item "$outputDir/Bhotch_CRM_System_Guide.pdf" -ErrorAction SilentlyContinue
$userGuide = Get-Item "$outputDir/Bhotch_CRM_User_Guide.pdf" -ErrorAction SilentlyContinue

if ($systemGuide) {
    $systemSize = [math]::Round($systemGuide.Length / 1KB, 2)
    Write-Host "  System Guide: $systemSize KB" -ForegroundColor Gray
}

if ($userGuide) {
    $userSize = [math]::Round($userGuide.Length / 1KB, 2)
    Write-Host "  User Guide: $userSize KB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Open the generated PDF files to view!" -ForegroundColor Yellow
Write-Host ""
