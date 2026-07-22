-- Adicionar coluna sequence à tabela report_photos para manter a ordem das fotos
-- Execute este SQL no phpMyAdmin da Hostinger

ALTER TABLE report_photos 
ADD COLUMN sequence INT DEFAULT NULL AFTER photo_type;

-- Atualizar fotos existentes para ter sequence baseado na ordem de criação
SET @row_number = 0;
UPDATE report_photos 
SET sequence = (@row_number := @row_number + 1)
ORDER BY created_at ASC;

-- Adicionar índice para melhorar performance de consultas ordenadas
CREATE INDEX idx_report_photos_sequence ON report_photos(sequence);
