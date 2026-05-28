-- Adicionar campos proposal_date e proposal_number à tabela proposals
-- Para compatibilidade com o frontend que já envia esses campos

ALTER TABLE proposals
ADD COLUMN proposal_date DATE NULL AFTER proposal_number;

-- O campo proposal_number já existe, apenas garantir que está correto
-- Não é necessário adicionar novamente
