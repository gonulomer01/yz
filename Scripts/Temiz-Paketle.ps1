# ==============================================================================
# MELIKGAZI BELEDIYESI - YAPAY ZEKA PLATFORMU PROJE TEMIZLEME VE PAKETLEME ARACI
# Bu betik, ana projenize (veya anahtarlariniza) HICBIR ZARAR VERMEDEN,
# karsi tarafa gondermek veya GitHub'a yuklemek uzere tamamen temiz, API anahtarsiz, 
# cerezsiz ve gorselsiz yepyeni bir kopya klasor (ve ZIP paketi) olusturur.
# ==============================================================================

[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Melikgazi AI Platformu - Temiz Kopya ve Paket Olusturucu " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$KaynakKlasor = Split-Path $PSScriptRoot -Parent
$HedefKlasor = Join-Path (Split-Path $KaynakKlasor -Parent) "ai_automation_project_Temiz_Kopya"
$ZipDosyasi = Join-Path (Split-Path $KaynakKlasor -Parent) "ai_automation_project_Paylasim.zip"

Write-Host "`n[1/5] Eski temiz kopya veya ZIP varsa temizleniyor..." -ForegroundColor Yellow
if (Test-Path $HedefKlasor) {
    Remove-Item -Path $HedefKlasor -Recurse -Force
}
if (Test-Path $ZipDosyasi) {
    Remove-Item -Path $ZipDosyasi -Force
}
New-Item -ItemType Directory -Path $HedefKlasor | Out-Null

Write-Host "[2/5] Kaynak kodlar (bin, obj, .vs, veritabanlari ve cerezler haric) kopyalaniyor..." -ForegroundColor Yellow

# Kopyalanacak ve kopyalanmayacak ogeler (.gitignore kurallariyla uyumlu)
$HaricTutulanlar = @("bin", "obj", ".vs", ".git", "GeminiChromeProfile_*", "ChatGptChromeProfile_*", "CopilotChromeProfile_*", "*.db", "*.db-shm", "*.db-wal", "*.mdf", "*.ldf", "ai_automation_project_*", "*.zip", "*.ps1")

Get-ChildItem -Path $KaynakKlasor | Where-Object {
    $item = $_
    $skip = $false
    foreach ($h in $HaricTutulanlar) {
        if ($item.Name -like $h) { $skip = $true; break }
    }
    return -not $skip
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $HedefKlasor -Recurse -Force
}

Write-Host "[3/5] Uretilen resimler (gorsel arsiv) temizleniyor..." -ForegroundColor Yellow
$GeneratedDir = Join-Path $HedefKlasor "wwwroot\generated"
$GeneratedFreeDir = Join-Path $HedefKlasor "wwwroot\generated-free"
$GeneratedGeminiDir = Join-Path $HedefKlasor "wwwroot\generated-gemini"
$GeneratedStabilityDir = Join-Path $HedefKlasor "wwwroot\generated-stability"
$GeneratedChatGptDir = Join-Path $HedefKlasor "wwwroot\generated-chatgpt"
$GeneratedCopilotDir = Join-Path $HedefKlasor "wwwroot\generated-copilot"
$GeneratedGrokDir = Join-Path $HedefKlasor "wwwroot\generated-grok"

foreach ($dir in @($GeneratedDir, $GeneratedFreeDir, $GeneratedGeminiDir, $GeneratedStabilityDir, $GeneratedChatGptDir, $GeneratedCopilotDir, $GeneratedGrokDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Get-ChildItem -Path $dir -File | Where-Object { $_.Name -ne ".gitkeep" } | Remove-Item -Force
    $gitKeep = Join-Path $dir ".gitkeep"
    if (-not (Test-Path $gitKeep)) {
        [System.IO.File]::WriteAllText($gitKeep, "# Keep folder in git`r`n", [System.Text.Encoding]::UTF8)
    }
}

Write-Host "[4/5] Kopya projedeki API anahtarlari (ai_credentials.json) sifirlaniyor..." -ForegroundColor Yellow
$CredsFile = Join-Path $HedefKlasor "ai_credentials.json"
$TemplateFile = Join-Path $HedefKlasor "ai_credentials.template.json"

$AnaTemplateFile = Join-Path $KaynakKlasor "ai_credentials.template.json"
$TemizCredsJsonStr = [System.IO.File]::ReadAllText($AnaTemplateFile, [System.Text.Encoding]::UTF8)
$CredsObj = $TemizCredsJsonStr | ConvertFrom-Json
$CredsObj.LastResetDate = (Get-Date -Format "yyyy-MM-dd")
$TemizCredsJson = $CredsObj | ConvertTo-Json -Depth 5

[System.IO.File]::WriteAllText($CredsFile, $TemizCredsJson, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($TemplateFile, $TemizCredsJson, [System.Text.Encoding]::UTF8)

Write-Host "[5/5] Temiz proje ZIP formatinda sikistiriliyor..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($HedefKlasor, $ZipDosyasi)

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " BASARILI! Karsi tarafa göndereceginiz temiz paket hazir: " -ForegroundColor Green
Write-Host " Klasor : $HedefKlasor" -ForegroundColor White
Write-Host " ZIP    : $ZipDosyasi" -ForegroundColor White
Write-Host " (Bu kopyanin icinde HICBIR API anahtariniz, Google oturumunuz veya resminiz yoktur!)" -ForegroundColor Green
Write-Host "==========================================================`n" -ForegroundColor Green
