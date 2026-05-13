-- Schema do banco de dados para o projeto FAT TAX RAT
-- Importe este arquivo no phpMyAdmin após criar o banco de dados

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'technician') NOT NULL DEFAULT 'technician',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('pessoa_fisica', 'pessoa_juridica') DEFAULT 'pessoa_fisica',
  name VARCHAR(255) NOT NULL,
  fantasy_name VARCHAR(255),
  cnpj VARCHAR(20),
  cpf VARCHAR(14),
  rg VARCHAR(20),
  ie VARCHAR(20),
  address TEXT,
  number VARCHAR(20),
  complement VARCHAR(255),
  neighborhood VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  technical_contact VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de equipamentos
CREATE TABLE IF NOT EXISTS equipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  type VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  installation_date DATE,
  power_va VARCHAR(50),
  voltage_in VARCHAR(50),
  voltage_out VARCHAR(50),
  voltage_battery VARCHAR(50),
  voltage_type VARCHAR(50),
  battery_type VARCHAR(50),
  battery_quantity INT,
  battery_volts VARCHAR(50),
  battery_bank_voltage VARCHAR(50),
  battery_current VARCHAR(50),
  battery_connection VARCHAR(50),
  battery_terminal VARCHAR(50),
  battery_brand VARCHAR(100),
  battery_model VARCHAR(100),
  capacity_ah VARCHAR(50),
  symmetric VARCHAR(10),
  isolated VARCHAR(10),
  signalizers_quantity INT,
  ihm VARCHAR(10),
  localizadores VARCHAR(10),
  communication_cable_type VARCHAR(100),
  fixation VARCHAR(100),
  quantity INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  technician_id INT NOT NULL,
  equipment_id INT,
  scheduled_date DATETIME NOT NULL,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de relatórios
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT,
  client_id INT NOT NULL,
  equipment_id INT NOT NULL,
  technician_id INT NOT NULL,
  created_date TIMESTAMP,
  service_order_number VARCHAR(50),
  report_number VARCHAR(50),
  service_type VARCHAR(100),
  attendance_date_time DATETIME,
  status ENUM('draft', 'completed') DEFAULT 'draft',
  technician_edit_count INT DEFAULT 0,
  responsible_person VARCHAR(255),
  installation_location VARCHAR(100),
  installation_location_explanation TEXT,
  local VARCHAR(100),
  inadequate_location_reason TEXT,
  
  -- Equipamento
  equipment_type VARCHAR(100),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  capacity VARCHAR(100),
  installation_date DATE,
  
  -- Instalação
  installation_type VARCHAR(100),
  location_details TEXT,
  environment VARCHAR(100),
  access VARCHAR(100),
  
  -- Elétrica
  power_supply_type VARCHAR(100),
  breaker VARCHAR(100),
  cable_entry_phase VARCHAR(100),
  cable_entry_neutral VARCHAR(100),
  cable_entry_ground VARCHAR(100),
  cable_exit_phase VARCHAR(100),
  cable_exit_neutral VARCHAR(100),
  external_battery_positive_cable VARCHAR(100),
  external_battery_negative_cable VARCHAR(100),
  external_battery_neutral_cable VARCHAR(100),
  external_battery_connection VARCHAR(100),
  external_battery_nobreak_connection VARCHAR(100),
  electrical_measurements TEXT,
  
  -- Baterias
  battery_bank TEXT,
  cooled_environment VARCHAR(10),
  
  -- Inspeção e Descrição
  external_inspection TEXT,
  internal_inspection TEXT,
  attendance_description TEXT,
  diagnosis TEXT,
  conclusion TEXT,
  reported_problems TEXT,
  identified_defects TEXT,
  procedures_performed TEXT,
  replaced_parts TEXT,
  parts_request TEXT,
  observations TEXT,
  problems_reported TEXT,
  technical_description TEXT,
  
  -- Assinaturas
  client_signature TEXT,
  technician_signature TEXT,
  
  -- Fotos (JSON array)
  photos TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de fotos dos relatórios
CREATE TABLE IF NOT EXISTS report_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  photo_url TEXT NOT NULL,
  comment TEXT,
  photo_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de configurações da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  company_logo TEXT,
  company_name VARCHAR(255),
  signature_tiago_viana TEXT,
  signature_tito_livio TEXT,
  cover_pdf TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para melhorar performance
CREATE INDEX idx_reports_client ON reports(client_id);
CREATE INDEX idx_reports_technician ON reports(technician_id);
CREATE INDEX idx_reports_equipment ON reports(equipment_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_schedules_client ON schedules(client_id);
CREATE INDEX idx_schedules_technician ON schedules(technician_id);
CREATE INDEX idx_schedules_status ON schedules(status);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
