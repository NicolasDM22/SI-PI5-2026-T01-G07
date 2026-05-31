# install-node.ps1 — instala Node.js LTS via winget e prepara o frontend

Write-Host ""
Write-Host "=== Instalacao do Node.js ===" -ForegroundColor Cyan

# Verifica se ja esta instalado
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Node.js ja instalado: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "Instalando Node.js LTS via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro na instalacao. Tente instalar manualmente em https://nodejs.org" -ForegroundColor Red
        exit 1
    }

    # Recarrega PATH da sessao atual
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH", "User")

    Write-Host "Node.js instalado: $(node --version)" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Instalando dependencias do frontend ===" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Rodando npm install..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "node_modules ja existe, pulando npm install." -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Pronto! ===" -ForegroundColor Green
Write-Host "Para rodar o frontend:  cd frontend  e  npx expo start" -ForegroundColor White
Write-Host ""
