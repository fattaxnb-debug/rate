-- Adicionar colunas extras à tabela equipments na Hostinger
-- Execute este SQL no phpMyAdmin da Hostinger

-- Remover colunas antigas se existirem
ALTER TABLE equipments DROP COLUMN IF EXISTS name;
ALTER TABLE equipments DROP COLUMN IF EXISTS location;

-- Adicionar colunas novas
ALTER TABLE equipments ADD COLUMN brand VARCHAR(100);
ALTER TABLE equipments ADD COLUMN model VARCHAR(100);
ALTER TABLE equipments ADD COLUMN power_va VARCHAR(50);
ALTER TABLE equipments ADD COLUMN voltage_in VARCHAR(50);
ALTER TABLE equipments ADD COLUMN voltage_out VARCHAR(50);
ALTER TABLE equipments ADD COLUMN voltage_battery VARCHAR(50);
ALTER TABLE equipments ADD COLUMN voltage_type VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_type VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_quantity INT;
ALTER TABLE equipments ADD COLUMN battery_volts VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_bank_voltage VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_current VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_connection VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_terminal VARCHAR(50);
ALTER TABLE equipments ADD COLUMN battery_brand VARCHAR(100);
ALTER TABLE equipments ADD COLUMN battery_model VARCHAR(100);
ALTER TABLE equipments ADD COLUMN capacity_ah VARCHAR(50);
ALTER TABLE equipments ADD COLUMN symmetric VARCHAR(10);
ALTER TABLE equipments ADD COLUMN isolated VARCHAR(10);
ALTER TABLE equipments ADD COLUMN signalizers_quantity INT;
ALTER TABLE equipments ADD COLUMN ihm VARCHAR(10);
ALTER TABLE equipments ADD COLUMN localizadores VARCHAR(10);
ALTER TABLE equipments ADD COLUMN communication_cable_type VARCHAR(100);
ALTER TABLE equipments ADD COLUMN fixation VARCHAR(100);
ALTER TABLE equipments ADD COLUMN quantity INT;
