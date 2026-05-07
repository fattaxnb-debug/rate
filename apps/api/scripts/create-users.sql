-- Criar usuários no banco de dados local

DELETE FROM users;

-- FATTAX ADMIN - Gerente acesso FULL
INSERT INTO users (id, email, password, name, role) 
VALUES (
  'admin-001',
  'fattax@fattax.srv.br',
  '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK',
  'FATTAX ADMIN',
  'Gerente'
);

-- Tito Livio - Técnico
INSERT INTO users (id, email, password, name, role) 
VALUES (
  'tecnico-001',
  'tito@fattax.srv.br',
  '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK',
  'Tito Livio',
  'Técnico'
);

-- Tiago Viana - Técnico
INSERT INTO users (id, email, password, name, role) 
VALUES (
  'tecnico-002',
  'comercial@fattax.srv.br',
  '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK',
  'Tiago Viana',
  'Técnico'
);
