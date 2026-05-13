-- Script para atualizar a tabela schedules para usar UUID
-- Execute este script no banco de dados da Hostinger

-- 1. Fazer backup dos dados existentes (se houver)
CREATE TABLE IF NOT EXISTS schedules_backup AS SELECT * FROM schedules;

-- 2. Deletar a tabela antiga
DROP TABLE IF EXISTS schedules;

-- 3. Criar a nova tabela com schema correto
CREATE TABLE schedules (
  id varchar(36) NOT NULL,
  client_id varchar(36) NOT NULL,
  equipment_id varchar(36) DEFAULT NULL,
  technician_id varchar(36) DEFAULT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time DEFAULT NULL,
  service_type varchar(100) DEFAULT NULL,
  status enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  notes text DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  city varchar(100) DEFAULT NULL,
  contact_name varchar(255) DEFAULT NULL,
  contact_phone varchar(20) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY client_id (client_id),
  KEY equipment_id (equipment_id),
  KEY technician_id (technician_id),
  KEY idx_date (scheduled_date),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
