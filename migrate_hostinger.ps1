# Script para executar migração na Hostinger
$headers = @{
    'Content-Type' = 'application/json'
}

try {
    Write-Host "Executando migração da tabela clients..."
    $response = Invoke-WebRequest -Uri "https://rate.fattax.srv.br/api/migrate/clients" -Method POST -Headers $headers -UseBasicParsing
    Write-Host "Migração concluída com sucesso!"
    Write-Host $response.Content
} catch {
    Write-Host "Erro na migração:"
    Write-Host $_.Exception.Message
    Write-Host $_.ErrorDetails.Message
}

Write-Host "`nPressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
