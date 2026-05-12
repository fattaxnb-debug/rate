-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 07/05/2026 às 03:16
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Estrutura para tabela `clients`
--

CREATE TABLE IF NOT EXISTS `clients` (
  `id` varchar(36) NOT NULL,
  `type` enum('fisica','juridica') DEFAULT 'fisica',
  `name` varchar(255) NOT NULL,
  `fantasy_name` varchar(255) DEFAULT NULL,
  `cnpj_cpf` varchar(20) DEFAULT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `ie` varchar(20) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `number` varchar(20) DEFAULT NULL,
  `complement` varchar(100) DEFAULT NULL,
  `neighborhood` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(2) DEFAULT NULL,
  `zip_code` varchar(10) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `technical_contact` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `clients`
--

INSERT INTO `clients` (`id`, `type`, `name`, `fantasy_name`, `cnpj_cpf`, `rg`, `ie`, `address`, `number`, `complement`, `neighborhood`, `city`, `state`, `zip_code`, `phone`, `mobile`, `email`, `technical_contact`, `created_at`, `updated_at`) VALUES
('56e833a1-48ee-11f1-885b-00e04f18cd90', 'juridica', 'FATTAX COMERCIO E SERVICOS DE NOBREAKS E ESTABILIZADORES LIMITADA', 'FATTAX NOBREAKS E ESTABILIZADORES DE TENSAO', '35.000.744/0001-90', '', '25252525', 'Rua Doutor Ratisbona', '410', 'LOJA', 'Fátima', 'Fortaleza', 'CE', '60411-220', '8532566989', '85992121887', 'fattax@fattax.srv.br', 'TITO LIVIO SENIOR', '2026-05-06 01:53:12', '2026-05-06 01:53:12'),
('b1034421-48ee-11f1-885b-00e04f18cd90', 'juridica', '59.761.883 TIAGO LUCIANE DA SILVA VIANA', 'TVENERGYTECH', '59.761.883/0001-03', '', '34534854', 'Rua Mozart Firmeza', '1233', 'CASA', 'Henrique Jorge', 'Fortaleza', 'CE', '60510-193', '85988522698', '85988522698', 'tvenergytech@gmail.com', 'TIAGO VIANA', '2026-05-06 01:55:43', '2026-05-06 01:55:43');

--
-- Estrutura para tabela `equipments`
--

CREATE TABLE IF NOT EXISTS `equipments` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `power_va` varchar(20) DEFAULT NULL,
  `voltage_in` varchar(20) DEFAULT NULL,
  `voltage_out` varchar(20) DEFAULT NULL,
  `voltage_battery` varchar(20) DEFAULT NULL,
  `voltage_type` enum('TRIFÁSICA','TRIMONO','MONOFÁSICA') DEFAULT NULL,
  `battery_type` enum('Interno','Externo') DEFAULT NULL,
  `battery_quantity` int(11) DEFAULT NULL,
  `battery_volts` varchar(10) DEFAULT NULL,
  `battery_bank_voltage` varchar(20) DEFAULT NULL,
  `battery_current` varchar(10) DEFAULT NULL,
  `battery_connection` enum('CABOS','BARRAS','CABOS E BARRAS') DEFAULT NULL,
  `battery_terminal` varchar(50) DEFAULT NULL,
  `battery_brand` varchar(100) DEFAULT NULL,
  `battery_model` varchar(100) DEFAULT NULL,
  `capacity_ah` varchar(10) DEFAULT NULL,
  `symmetric` varchar(10) DEFAULT NULL,
  `isolated` varchar(10) DEFAULT NULL,
  `signalizers_quantity` int(11) DEFAULT NULL,
  `ihm` varchar(50) DEFAULT NULL,
  `localizadores` varchar(50) DEFAULT NULL,
  `communication_cable_type` varchar(50) DEFAULT NULL,
  `fixation` varchar(50) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `installation_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `equipments`
--

INSERT INTO `equipments` (`id`, `client_id`, `type`, `brand`, `model`, `serial_number`, `power_va`, `voltage_in`, `voltage_out`, `voltage_battery`, `voltage_type`, `battery_type`, `battery_quantity`, `battery_volts`, `battery_bank_voltage`, `battery_current`, `battery_connection`, `battery_terminal`, `battery_brand`, `battery_model`, `capacity_ah`, `symmetric`, `isolated`, `signalizers_quantity`, `ihm`, `localizadores`, `communication_cable_type`, `fixation`, `quantity`, `installation_date`, `created_at`, `updated_at`) VALUES
('32cbc6a3-48f0-11f1-885b-00e04f18cd90', '56e833a1-48ee-11f1-885b-00e04f18cd90', 'Nobreak', 'CM COMANDOS', 'CONCEPTION S1', '111111', '40000', '380', '380', '384', 'TRIFÁSICA', 'Externo', 32, '12', NULL, '50AH', 'CABOS', '35MM', 'FREEDOM', 'DF1500', NULL, 'Não', 'Não', NULL, NULL, NULL, NULL, NULL, 1, '2020-02-20', '2026-05-06 02:06:30', '2026-05-06 02:06:30'),
('f642df7e-48f0-11f1-885b-00e04f18cd90', 'b1034421-48ee-11f1-885b-00e04f18cd90', 'Nobreak', 'LEGRAND', 'KEOR BR', '222222', '6000', '220', '220', '192', 'MONOFÁSICA', 'Interno', 16, '12', NULL, '34W', 'CABOS', 'FASTON', 'CSB', 'GP1234W', NULL, 'Não', 'Não', NULL, NULL, NULL, NULL, NULL, 1, '2020-02-20', '2026-05-06 02:11:58', '2026-05-06 02:11:58');

--
-- Estrutura para tabela `schedules`
--

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` varchar(36) NOT NULL,
  `client_id` varchar(36) NOT NULL,
  `equipment_id` varchar(36) DEFAULT NULL,
  `technician_id` varchar(36) DEFAULT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_time` time DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `contact_name` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `client_id` (`client_id`),
  KEY `equipment_id` (`equipment_id`),
  KEY `technician_id` (`technician_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `schedules`
--

INSERT INTO `schedules` (`id`, `client_id`, `equipment_id`, `technician_id`, `scheduled_date`, `scheduled_time`, `service_type`, `status`, `notes`, `address`, `city`, `contact_name`, `contact_phone`, `created_at`, `updated_at`) VALUES
('5903b687-48f6-11f1-885b-00e04f18cd90', 'b1034421-48ee-11f1-885b-00e04f18cd90', 'f642df7e-48f0-11f1-885b-00e04f18cd90', 'tecnico-002', '2026-05-06', '09:00:00', NULL, '', NULL, NULL, NULL, NULL, NULL, '2026-05-06 02:50:31', '2026-05-06 02:50:31'),
('e122f77e-48f5-11f1-885b-00e04f18cd90', '56e833a1-48ee-11f1-885b-00e04f18cd90', '32cbc6a3-48f0-11f1-885b-00e04f18cd90', 'tecnico-001', '2026-05-06', '14:00:00', NULL, '', NULL, NULL, NULL, NULL, NULL, '2026-05-06 02:47:10', '2026-05-06 02:47:10');

--
-- Estrutura para tabela `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('Técnico','Gerente','Admin') DEFAULT 'Técnico',
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `phone`, `avatar`, `is_active`, `created_at`, `updated_at`) VALUES
('admin-001', 'fattax@fattax.srv.br', '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK', 'FATTAX ADMIN', 'Gerente', NULL, NULL, 1, '2026-05-06 01:20:43', '2026-05-06 01:20:43'),
('tecnico-001', 'tito@fattax.srv.br', '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK', 'Tito Livio', 'Técnico', NULL, NULL, 1, '2026-05-06 01:20:43', '2026-05-06 01:20:43'),
('tecnico-002', 'comercial@fattax.srv.br', '$2b$10$y3ets/bzMOF7fmlsTz52MuEz5Lkn9qW56ofT02IGBkEWacCahEZXK', 'Tiago Viana', 'Técnico', NULL, NULL, 1, '2026-05-06 01:20:43', '2026-05-06 01:20:43');

--
-- Índices para tabelas despejadas
--

ALTER TABLE `clients`
  ADD UNIQUE KEY `cnpj_cpf` (`cnpj_cpf`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_cnpj_cpf` (`cnpj_cpf`),
  ADD KEY `idx_city` (`city`);

ALTER TABLE `equipments`
  ADD KEY `idx_client` (`client_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_serial` (`serial_number`);

ALTER TABLE `schedules`
  ADD KEY `idx_date` (`scheduled_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_technician` (`technician_id`);

ALTER TABLE `users`
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Restrições para tabelas despejadas
--

ALTER TABLE `equipments`
  ADD CONSTRAINT `equipments_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE SET NULL;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
