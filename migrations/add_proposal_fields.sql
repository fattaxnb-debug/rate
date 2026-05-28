-- Migration para adicionar novos campos à tabela proposals
ALTER TABLE proposals 
ADD COLUMN battery_bank_type VARCHAR(20) COMMENT 'Interno ou Externo',
ADD COLUMN battery_quantity INT DEFAULT 0,
ADD COLUMN battery_voltage VARCHAR(20),
ADD COLUMN battery_amperage VARCHAR(20),
ADD COLUMN power_supply VARCHAR(50) COMMENT 'Tomada, Circuito ou Tomada e Circuito',
ADD COLUMN nobreak_output VARCHAR(50) COMMENT 'Tomada, Circuito ou Tomada e Circuito';

-- Renomear campo shipping para installation_activation
ALTER TABLE proposals CHANGE COLUMN shipping installation_activation VARCHAR(100);
