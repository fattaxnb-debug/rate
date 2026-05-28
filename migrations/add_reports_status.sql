-- Adicionar campo status na tabela reports
ALTER TABLE reports ADD COLUMN status VARCHAR(20) DEFAULT 'draft' AFTER service_type;

-- Atualizar relatórios existentes para 'draft'
UPDATE reports SET status = 'draft' WHERE status IS NULL;
