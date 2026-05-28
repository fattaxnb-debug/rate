-- Adicionar campo motivo na tabela proposals
ALTER TABLE proposals ADD COLUMN motivo TEXT AFTER total_amount;
