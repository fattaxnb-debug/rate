-- Adicionar campo status na tabela proposals
ALTER TABLE proposals ADD COLUMN status VARCHAR(20) DEFAULT 'ABERTA' AFTER proposal_number;

-- Atualizar propostas existentes para 'ABERTA'
UPDATE proposals SET status = 'ABERTA' WHERE status IS NULL;
