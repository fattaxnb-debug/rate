-- Adicionar campos para endereço de atendimento diferenciado
-- use_default_address: BOOLEAN - Usa endereço padrão do cliente?
-- use_registered_client: BOOLEAN - Se não usar padrão, usa cliente cadastrado?
-- attendance_client_id: INT - ID do cliente para atendimento (se usar cliente cadastrado)
-- attendance_client_name: VARCHAR(255) - Nome do cliente de atendimento (se preencher manual)
-- attendance_address: VARCHAR(255) - Rua do atendimento
-- attendance_number: VARCHAR(50) - Número do atendimento
-- attendance_neighborhood: VARCHAR(255) - Bairro do atendimento
-- attendance_city: VARCHAR(255) - Cidade do atendimento
-- attendance_state: VARCHAR(2) - UF do atendimento

ALTER TABLE schedules 
ADD COLUMN use_default_address BOOLEAN DEFAULT TRUE NULL AFTER equipment_id,
ADD COLUMN use_registered_client BOOLEAN DEFAULT NULL AFTER use_default_address,
ADD COLUMN attendance_client_id INT NULL AFTER use_registered_client,
ADD COLUMN attendance_client_name VARCHAR(255) NULL AFTER attendance_client_id,
ADD COLUMN attendance_address VARCHAR(255) NULL AFTER attendance_client_name,
ADD COLUMN attendance_number VARCHAR(50) NULL AFTER attendance_address,
ADD COLUMN attendance_neighborhood VARCHAR(255) NULL AFTER attendance_number,
ADD COLUMN attendance_city VARCHAR(255) NULL AFTER attendance_neighborhood,
ADD COLUMN attendance_state VARCHAR(2) NULL AFTER attendance_city;

-- Adicionar índice para attendance_client_id
CREATE INDEX idx_schedules_attendance_client_id ON schedules(attendance_client_id);
