# deploy.ps1 — commit tudo e envia para Vercel via GitHub
# Uso: .\deploy.ps1 "mensagem do commit"
# Se não passar mensagem, usa timestamp automático.

param([string]$msg = "")

Set-Location $PSScriptRoot

# Mensagem padrão com timestamp
if (-not $msg) {
  $msg = "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

Write-Host "`n[1/3] Staging alterações..." -ForegroundColor Cyan
git add -A

$status = git status --porcelain
if (-not $status) {
  Write-Host "Nenhuma alteração para commitar." -ForegroundColor Yellow
  exit 0
}

Write-Host "[2/3] Commitando: $msg" -ForegroundColor Cyan
git commit -m $msg

Write-Host "[3/3] Enviando para GitHub → Vercel vai fazer deploy automático..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✓ Deploy iniciado!" -ForegroundColor Green
Write-Host "  Acompanhe em: https://vercel.com/lucasagostini-s-projects/project-hub" -ForegroundColor DarkGray
