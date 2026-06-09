-- Script para corrigir o tipo de clientes baseado no CNPJ/CPF
-- Se tiver 14 dígitos = Pessoa Jurídica
-- Se tiver 11 dígitos = Pessoa Física

-- Atualizar clientes com CNPJ (14 dígitos) para juridica
UPDATE clients 
SET type = 'juridica' 
WHERE LENGTH(REPLACE(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', ''), '/', '')) = 14;

-- Atualizar clientes com CPF (11 dígitos) para fisica
UPDATE clients 
SET type = 'fisica' 
WHERE LENGTH(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', '')) = 11;

-- Verificar resultado
SELECT 
    type,
    COUNT(*) as total,
    GROUP_CONCAT(DISTINCT LEFT(cnpj_cpf, 20)) as exemplos
FROM clients 
GROUP BY type;
