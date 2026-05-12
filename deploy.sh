#!/bin/bash
# Script para facilitar commit e push para GitHub

echo "🚀 Iniciando deploy automático..."

# Adiciona todas as alterações
git add -A

# Pede mensagem de commit
echo "Digite a mensagem do commit:"
read commit_message

# Faz commit
git commit -m "$commit_message"

# Faz push para GitHub
git push origin main

echo "✅ Push realizado! O GitHub Actions fará o deploy automático para o Hostinger."
echo "📦 Acompanhe o deploy em: https://github.com/fattaxnb-debug/rat-fattax/actions"
