-- Schema do banco de dados para o projeto FAT TAX RAT
-- Importe este arquivo no phpMyAdmin após criar o banco de dados
-- Schema compatível com Hostinger (UUID, roles em português)

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id varchar(36) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  role enum('Admin','Gerente','Técnico') NOT NULL DEFAULT 'Técnico',
  phone varchar(20) DEFAULT NULL,
  avatar varchar(255) DEFAULT NULL,
  is_active tinyint(1) DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id varchar(36) NOT NULL,
  type enum('fisica','juridica') DEFAULT 'fisica',
  name varchar(255) NOT NULL,
  fantasy_name varchar(255) DEFAULT NULL,
  cnpj_cpf varchar(20) DEFAULT NULL,
  rg varchar(20) DEFAULT NULL,
  ie varchar(20) DEFAULT NULL,
  address varchar(255) DEFAULT NULL,
  number varchar(20) DEFAULT NULL,
  complement varchar(100) DEFAULT NULL,
  neighborhood varchar(100) DEFAULT NULL,
  city varchar(100) DEFAULT NULL,
  state varchar(2) DEFAULT NULL,
  zip_code varchar(10) DEFAULT NULL,
  phone varchar(20) DEFAULT NULL,
  mobile varchar(20) DEFAULT NULL,
  email varchar(255) DEFAULT NULL,
  technical_contact varchar(255) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY cnpj_cpf (cnpj_cpf),
  KEY idx_name (name),
  KEY idx_cnpj_cpf (cnpj_cpf),
  KEY idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipments (
  id varchar(36) NOT NULL,
  client_id varchar(36) NOT NULL,
  type varchar(50) NOT NULL,
  brand varchar(100) DEFAULT NULL,
  model varchar(100) DEFAULT NULL,
  serial_number varchar(100) DEFAULT NULL,
  power_va varchar(20) DEFAULT NULL,
  voltage_in varchar(20) DEFAULT NULL,
  voltage_out varchar(20) DEFAULT NULL,
  voltage_battery varchar(20) DEFAULT NULL,
  voltage_type enum('TRIFÁSICA','TRIMONO','MONOFÁSICA') DEFAULT NULL,
  battery_type enum('Interno','Externo') DEFAULT NULL,
  battery_quantity int(11) DEFAULT NULL,
  battery_volts varchar(10) DEFAULT NULL,
  battery_bank_voltage varchar(20) DEFAULT NULL,
  battery_current varchar(10) DEFAULT NULL,
  battery_connection enum('CABOS','BARRAS','CABOS E BARRAS') DEFAULT NULL,
  battery_terminal varchar(50) DEFAULT NULL,
  battery_brand varchar(100) DEFAULT NULL,
  battery_model varchar(100) DEFAULT NULL,
  capacity_ah varchar(10) DEFAULT NULL,
  symmetric varchar(10) DEFAULT NULL,
  isolated varchar(10) DEFAULT NULL,
  signalizers_quantity int(11) DEFAULT NULL,
  ihm varchar(50) DEFAULT NULL,
  localizadores varchar(50) DEFAULT NULL,
  communication_cable_type varchar(50) DEFAULT NULL,
  fixation varchar(50) DEFAULT NULL,
  quantity int(11) DEFAULT 1,
  installation_date date DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  KEY client_id (client_id),
  KEY idx_client (client_id),
  KEY idx_type (type),
  KEY idx_serial (serial_number),
  CONSTRAINT equipments_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS schedules (
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
  KEY idx_status (status),
  KEY idx_technician (technician_id),
  CONSTRAINT schedules_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT schedules_ibfk_2 FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS reports (
  id varchar(36) NOT NULL,
  schedule_id varchar(36) DEFAULT NULL,
  client_id varchar(36) NOT NULL,
  equipment_id varchar(36) NOT NULL,
  technician_id varchar(36) NOT NULL,
  created_date datetime DEFAULT NULL,
  service_order_number varchar(50) DEFAULT NULL,
  report_number varchar(50) DEFAULT NULL,
  service_type varchar(100) DEFAULT NULL,
  attendance_date_time datetime DEFAULT NULL,
  status enum('draft','completed') DEFAULT 'draft',
  technician_edit_count int(11) DEFAULT 0,
  responsible_person varchar(255) DEFAULT NULL,
  installation_location varchar(100) DEFAULT NULL,
  installation_location_explanation text DEFAULT NULL,
  local varchar(100) DEFAULT NULL,
  inadequate_location_reason text DEFAULT NULL,
  
  -- Equipamento
  equipment_type varchar(100) DEFAULT NULL,
  manufacturer varchar(100) DEFAULT NULL,
  model varchar(100) DEFAULT NULL,
  serial_number varchar(100) DEFAULT NULL,
  capacity varchar(100) DEFAULT NULL,
  installation_date date DEFAULT NULL,
  
  -- Instalação
  installation_type varchar(100) DEFAULT NULL,
  location_details text DEFAULT NULL,
  environment varchar(100) DEFAULT NULL,
  access varchar(100) DEFAULT NULL,
  
  -- Elétrica
  power_supply_type varchar(100) DEFAULT NULL,
  breaker varchar(100) DEFAULT NULL,
  cable_entry_phase varchar(100) DEFAULT NULL,
  cable_entry_neutral varchar(100) DEFAULT NULL,
  cable_entry_ground varchar(100) DEFAULT NULL,
  cable_exit_phase varchar(100) DEFAULT NULL,
  cable_exit_neutral varchar(100) DEFAULT NULL,
  external_battery_positive_cable varchar(100) DEFAULT NULL,
  external_battery_negative_cable varchar(100) DEFAULT NULL,
  external_battery_neutral_cable varchar(100) DEFAULT NULL,
  external_battery_connection varchar(100) DEFAULT NULL,
  external_battery_nobreak_connection varchar(100) DEFAULT NULL,
  electrical_measurements text DEFAULT NULL,
  
  -- Baterias
  battery_bank text DEFAULT NULL,
  cooled_environment varchar(10) DEFAULT NULL,
  
  -- Inspeção e Descrição
  external_inspection text DEFAULT NULL,
  internal_inspection text DEFAULT NULL,
  attendance_description text DEFAULT NULL,
  diagnosis text DEFAULT NULL,
  conclusion text DEFAULT NULL,
  reported_problems text DEFAULT NULL,
  identified_defects text DEFAULT NULL,
  procedures_performed text DEFAULT NULL,
  replaced_parts text DEFAULT NULL,
  parts_request text DEFAULT NULL,
  observations text DEFAULT NULL,
  problems_reported text DEFAULT NULL,
  technical_description text DEFAULT NULL,
  
  -- Assinaturas
  client_signature text DEFAULT NULL,
  technician_signature text DEFAULT NULL,
  
  -- Fotos (JSON array)
  photos text DEFAULT NULL,
  
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  
  PRIMARY KEY (id),
  KEY idx_reports_client (client_id),
  KEY idx_reports_technician (technician_id),
  KEY idx_reports_equipment (equipment_id),
  KEY idx_reports_status (status),
  CONSTRAINT reports_ibfk_1 FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT reports_ibfk_2 FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT reports_ibfk_3 FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de fotos dos relatórios
CREATE TABLE IF NOT EXISTS report_photos (
  id varchar(36) NOT NULL,
  report_id varchar(36) NOT NULL,
  photo_url text NOT NULL,
  comment text DEFAULT NULL,
  photo_type varchar(50) DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id varchar(36) NOT NULL,
  user_id varchar(36) DEFAULT NULL,
  company_logo text DEFAULT NULL,
  company_name varchar(255) DEFAULT NULL,
  signature_tiago_viana text DEFAULT NULL,
  signature_tito_livio text DEFAULT NULL,
  cover_pdf text DEFAULT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para melhorar performance
CREATE INDEX idx_reports_client ON reports(client_id);
CREATE INDEX idx_reports_technician ON reports(technician_id);
CREATE INDEX idx_reports_equipment ON reports(equipment_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_schedules_technician ON schedules(technician_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
