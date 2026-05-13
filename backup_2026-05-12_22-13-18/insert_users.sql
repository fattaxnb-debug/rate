-- Inserir usuários iniciais
-- Execute isso no phpMyAdmin para criar os usuários

INSERT INTO users (email, password, name, role) VALUES 
('fattax@fattax.srv.br', '$2b$10$QoiLRr0V1E2xo1OmLvJMPOfSqQhM8v4ZlShHNKqkNl99cYixQwAwi', 'FATTAX ADMIN', 'manager'),
('comercial@fattax.srv.br', '$2b$10$LLFNKrsBRwKJ6MYwI81R0.NVekPUVxUdmFJ/CYfU7Z8HCGGagFPZe', 'Tiago Viana', 'technician'),
('tito@fattax.srv.br', '$2b$10$dTSWIXRF3GMo4qRMWrRRHO7lkqMemN.ORZoV9tZnSvLtVNbs8YASG', 'Tito Livio', 'technician');

-- Senha para todos: Serv!2026@
