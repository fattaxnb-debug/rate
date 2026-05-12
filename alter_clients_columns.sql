-- Adicionar colunas extras à tabela clients na Hostinger
-- Execute este SQL no phpMyAdmin da Hostinger

ALTER TABLE clients ADD COLUMN type ENUM('pessoa_fisica', 'pessoa_juridica') DEFAULT 'pessoa_juridica';
ALTER TABLE clients ADD COLUMN fantasy_name VARCHAR(255);
ALTER TABLE clients ADD COLUMN cnpj VARCHAR(20);
ALTER TABLE clients ADD COLUMN cpf VARCHAR(14);
ALTER TABLE clients ADD COLUMN rg VARCHAR(20);
ALTER TABLE clients ADD COLUMN ie VARCHAR(20);
ALTER TABLE clients ADD COLUMN number VARCHAR(20);
ALTER TABLE clients ADD COLUMN complement VARCHAR(255);
ALTER TABLE clients ADD COLUMN neighborhood VARCHAR(255);
ALTER TABLE clients ADD COLUMN city VARCHAR(255);
ALTER TABLE clients ADD COLUMN state VARCHAR(2);
ALTER TABLE clients ADD COLUMN zip_code VARCHAR(10);
ALTER TABLE clients ADD COLUMN mobile VARCHAR(20);
ALTER TABLE clients ADD COLUMN technical_contact VARCHAR(255);
