# Script para facilitar commit e push para GitHub

Write-Host "🚀 Iniciando deploy automático..." -ForegroundColor Green

# Adiciona todas as alterações
git add -A

# Pede mensagem de commit
$message = Read-Host "Digite a mensagem do commit"

# Se não digitou mensagem, usa padrão
if (-not $message) {
    $message = "Update"
}

# Faz commit
git commit -m $message

# Faz push para GitHub
git push origin main

Write-Host "✅ Push realizado! O GitHub Actions fará o deploy automático para o Hostinger." -ForegroundColor Green
Write-Host "📦 Acompanhe o deploy em: https://github.com/fattaxnb-debug/rat-fattax/actions" -ForegroundColor Cyan
