-- Adicionar coluna observations na tabela proposals
ALTER TABLE proposals ADD COLUMN observations TEXT AFTER proposal_validity;

-- Adicionar coluna motivo na tabela proposals (se não existir)
ALTER TABLE proposals ADD COLUMN motivo VARCHAR(255) AFTER observations;

-- Adicionar coluna created_by na tabela proposals (se não existir)
ALTER TABLE proposals ADD COLUMN created_by INT AFTER motivo;

-- Adicionar colunas de bateria na tabela proposals (se não existirem)
ALTER TABLE proposals ADD COLUMN battery_bank_type VARCHAR(100) AFTER created_by;
ALTER TABLE proposals ADD COLUMN battery_quantity INT AFTER battery_bank_type;
ALTER TABLE proposals ADD COLUMN battery_voltage VARCHAR(50) AFTER battery_quantity;
ALTER TABLE proposals ADD COLUMN battery_amperage VARCHAR(50) AFTER battery_amperage;

-- Adicionar coluna power_supply na tabela proposals (se não existir)
ALTER TABLE proposals ADD COLUMN power_supply VARCHAR(255) AFTER battery_amperage;

-- Adicionar coluna nobreak_output na tabela proposals (se não existir)
ALTER TABLE proposals ADD COLUMN nobreak_output VARCHAR(255) AFTER power_supply;
