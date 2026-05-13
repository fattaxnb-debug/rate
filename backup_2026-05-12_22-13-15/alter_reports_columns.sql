-- Adicionar colunas extras à tabela reports na Hostinger
-- Execute este SQL no phpMyAdmin da Hostinger

-- Remover colunas antigas se existirem
ALTER TABLE reports DROP COLUMN IF EXISTS input_voltage;
ALTER TABLE reports DROP COLUMN IF EXISTS output_voltage;
ALTER TABLE reports DROP COLUMN IF EXISTS current_phase;
ALTER TABLE reports DROP COLUMN IF EXISTS neutral_current;
ALTER TABLE reports DROP COLUMN IF EXISTS ground_current;
ALTER TABLE reports DROP COLUMN IF EXISTS cables_input;
ALTER TABLE reports DROP COLUMN IF EXISTS cables_output;
ALTER TABLE reports DROP COLUMN IF EXISTS l1_current;
ALTER TABLE reports DROP COLUMN IF EXISTS l2_current;
ALTER TABLE reports DROP COLUMN IF EXISTS l3_current;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_quantity;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_volts;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_current;
ALTER TABLE reports DROP COLUMN IF EXISTS bank_voltage;
ALTER TABLE reports DROP COLUMN IF EXISTS charger_voltage;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_brand;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_model;
ALTER TABLE reports DROP COLUMN IF EXISTS battery_replaced;

-- Adicionar colunas novas
ALTER TABLE reports ADD COLUMN schedule_id INT;
ALTER TABLE reports ADD COLUMN report_number VARCHAR(50);
ALTER TABLE reports ADD COLUMN technician_edit_count INT DEFAULT 0;
ALTER TABLE reports ADD COLUMN responsible_person VARCHAR(255);
ALTER TABLE reports ADD COLUMN installation_location VARCHAR(100);
ALTER TABLE reports ADD COLUMN installation_location_explanation TEXT;
ALTER TABLE reports ADD COLUMN cable_entry_phase VARCHAR(100);
ALTER TABLE reports ADD COLUMN cable_entry_neutral VARCHAR(100);
ALTER TABLE reports ADD COLUMN cable_entry_ground VARCHAR(100);
ALTER TABLE reports ADD COLUMN cable_exit_phase VARCHAR(100);
ALTER TABLE reports ADD COLUMN cable_exit_neutral VARCHAR(100);
ALTER TABLE reports ADD COLUMN external_battery_positive_cable VARCHAR(100);
ALTER TABLE reports ADD COLUMN external_battery_negative_cable VARCHAR(100);
ALTER TABLE reports ADD COLUMN external_battery_neutral_cable VARCHAR(100);
ALTER TABLE reports ADD COLUMN external_battery_connection VARCHAR(100);
ALTER TABLE reports ADD COLUMN external_battery_nobreak_connection VARCHAR(100);
ALTER TABLE reports ADD COLUMN electrical_measurements TEXT;
ALTER TABLE reports ADD COLUMN battery_bank TEXT;
ALTER TABLE reports ADD COLUMN cooled_environment VARCHAR(10);
ALTER TABLE reports ADD COLUMN attendance_description TEXT;
ALTER TABLE reports ADD COLUMN diagnosis TEXT;
ALTER TABLE reports ADD COLUMN conclusion TEXT;
ALTER TABLE reports ADD COLUMN identified_defects TEXT;
ALTER TABLE reports ADD COLUMN procedures_performed TEXT;
ALTER TABLE reports ADD COLUMN replaced_parts TEXT;
ALTER TABLE reports ADD COLUMN parts_request TEXT;
ALTER TABLE reports ADD COLUMN observations TEXT;
