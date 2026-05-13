-- Inserir usuários iniciais
-- Execute isso no phpMyAdmin para criar os usuários
-- Roles compatíveis com Hostinger: 'Admin', 'Gerente', 'Técnico'

INSERT INTO users (id, email, password, name, role) VALUES 
('admin-001', 'fattax@fattax.srv.br', '$2b$10$QoiLRr0V1E2xo1OmLvJMPOfSqQhM8v4ZlShHNKqkNl99cYixQwAwi', 'FATTAX ADMIN', 'Gerente'),
('tecnico-001', 'tito@fattax.srv.br', '$2b$10$LLFNKrsBRwKJ6MYwI81R0.NVekPUVxUdmFJ/CYfU7Z8HCGGagFPZe', 'Tito Livio', 'Técnico'),
('tecnico-002', 'comercial@fattax.srv.br', '$2b$10$dTSWIXRF3GMo4qRMWrRRHO7lkqMemN.ORZoV9tZnSvLtVNbs8YASG', 'Tiago Viana', 'Técnico');

-- Senha para todos: Serv!2026@
