-- Script para corrigir a coluna type na tabela clients
-- Primeiro, verificar valores atuais
SELECT DISTINCT type FROM clients;

-- Alterar a coluna type para VARCHAR(20) para aceitar qualquer valor
-- ou criar o enum correto
ALTER TABLE clients MODIFY COLUMN type VARCHAR(20) DEFAULT 'fisica';

-- Agora atualizar os valores
UPDATE clients 
SET type = 'juridica' 
WHERE LENGTH(REPLACE(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', ''), '/', '')) = 14;

UPDATE clients 
SET type = 'fisica' 
WHERE LENGTH(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', '')) = 11 
   OR LENGTH(REPLACE(REPLACE(REPLACE(cnpj_cpf, '.', ''), '-', ''), '/', '')) != 14;

-- Verificar resultado
SELECT 
    type,
    COUNT(*) as total
FROM clients 
GROUP BY type;
