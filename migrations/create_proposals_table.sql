-- Migration para criar tabela de propostas técnicas
CREATE TABLE IF NOT EXISTS proposals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_number VARCHAR(20) UNIQUE NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_cnpj VARCHAR(20),
  client_phone VARCHAR(20),
  client_mobile VARCHAR(20),
  client_email VARCHAR(255),
  client_contact VARCHAR(255),
  
  -- Seção Referência
  brand VARCHAR(100),
  line VARCHAR(100),
  model VARCHAR(100),
  code VARCHAR(50),
  
  -- Seção Especificações
  power VARCHAR(50),
  input_voltage VARCHAR(50),
  output_voltage VARCHAR(50),
  
  -- Seção Condições Gerais de Fornecimento
  monitoring TEXT,
  shipping VARCHAR(100),
  
  -- Seção Condições Comerciais
  payment_terms VARCHAR(255),
  delivery_time VARCHAR(100),
  warranty VARCHAR(100),
  shipping_terms VARCHAR(100),
  proposal_validity DATE,
  
  -- Total geral
  total_amount DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  INDEX idx_proposal_number (proposal_number),
  INDEX idx_client_name (client_name),
  INDEX idx_created_at (created_at)
);

-- Tabela de itens/produtos da proposta
CREATE TABLE IF NOT EXISTS proposal_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proposal_id INT NOT NULL,
  product_code VARCHAR(50),
  product_description TEXT,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(15,2) DEFAULT 0,
  total_price DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
  INDEX idx_proposal_id (proposal_id)
);

-- Sequência para número da proposta (formato: 25260525-0001)
CREATE TABLE IF NOT EXISTS proposal_sequence (
  sequence_date VARCHAR(8) PRIMARY KEY,
  last_number INT DEFAULT 0
);
