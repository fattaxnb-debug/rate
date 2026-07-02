-- Tabela de Banco de Falhas para Equipamentos
CREATE TABLE IF NOT EXISTS failures (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Identificação do Equipamento
  brand VARCHAR(100),
  model VARCHAR(100),
  power VARCHAR(50),
  board_reference VARCHAR(100),
  input_voltage VARCHAR(50),
  output_voltage VARCHAR(50),
  battery_voltage VARCHAR(50),
  
  -- Diagnóstico
  failure_description TEXT,
  initial_symptoms TEXT,
  tests_performed TEXT,
  tools_used TEXT,
  components TEXT,
  photo_urls TEXT,
  
  -- Solução
  suggested_solution TEXT,
  parts_used TEXT,
  
  -- Classificação
  category ENUM('Elétrica', 'Eletrônica', 'Mecânica', 'Software'),
  frequency ENUM('Rara', 'Ocasional', 'Comum', 'Muito Comum'),
  tags TEXT,
  
  -- Metadados
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_brand_model (brand, model),
  INDEX idx_category (category),
  INDEX idx_frequency (frequency),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
