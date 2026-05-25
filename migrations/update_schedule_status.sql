-- Migration para atualizar o enum de status na tabela schedules
-- Executar no banco de dados para migrar de status antigos para novos

-- Atualizar status existentes para novos valores
UPDATE schedules SET status = 'ABERTO' WHERE status = 'pending' OR status = 'confirmed';
UPDATE schedules SET status = 'ATENDENDO' WHERE status = 'confirmed';
UPDATE schedules SET status = 'CONCLUIDO' WHERE status = 'completed';
UPDATE schedules SET status = 'FINALIZADO' WHERE status = 'cancelled';

-- Alterar o enum da coluna status (SEM ACENTO para evitar problemas de codificação)
ALTER TABLE schedules MODIFY COLUMN status enum('ABERTO','ATRASADO','ATENDENDO','CONCLUIDO','FINALIZADO') DEFAULT 'ABERTO';
