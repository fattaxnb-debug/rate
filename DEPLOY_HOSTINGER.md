# DEPLOY NO HOSTINGER - RESUMO DE ALTERAÇÕES

## 1. MIGRAÇÕES SQL (EXECUTAR NA ORDEM)

### 1.1 Status dos Agendamentos
Arquivo: `migrations/update_schedule_status.sql`
```sql
-- Atualizar status existentes para novos valores
UPDATE schedules SET status = 'ABERTO' WHERE status = 'pending' OR status = 'confirmed';
UPDATE schedules SET status = 'ATENDENDO' WHERE status = 'confirmed';
UPDATE schedules SET status = 'CONCLUIDO' WHERE status = 'completed';
UPDATE schedules SET status = 'FINALIZADO' WHERE status = 'cancelled';

-- Alterar o enum da coluna status
ALTER TABLE schedules MODIFY COLUMN status enum('ABERTO','ATRASADO','ATENDENDO','CONCLUIDO','FINALIZADO') DEFAULT 'ABERTO';
```

### 1.2 Tabela de Propostas
Arquivo: `migrations/create_proposals_table.sql`
- Cria tabela `proposals`
- Cria tabela `proposal_items`
- Cria tabela `proposal_sequence`

### 1.3 Campos Adicionais de Propostas
Arquivo: `migrations/add_proposal_date_and_number.sql`
- Adiciona campos de data e número da proposta

Arquivo: `migrations/add_proposal_fields.sql`
- Adiciona campos adicionais da proposta

Arquivo: `migrations/add_proposal_status.sql`
```sql
ALTER TABLE proposals ADD COLUMN status VARCHAR(20) DEFAULT 'ABERTA' AFTER proposal_number;
UPDATE proposals SET status = 'ABERTA' WHERE status IS NULL;
```

Arquivo: `migrations/add_proposal_motivo.sql`
```sql
ALTER TABLE proposals ADD COLUMN motivo TEXT AFTER observations;
```

### 1.4 Status dos Relatórios
Arquivo: `migrations/check_reports_status.sql` (verificar se existe)
- Adiciona campo `status` na tabela `reports`

## 2. ARQUIVOS BACKEND (ENVIAR PARA O SERVIDOR)

### 2.1 Novos Arquivos
- `src/routes/proposals.js` - Rotas CRUD de propostas

### 2.2 Arquivos Modificados
- `src/routes/index.js` - Adicionada rota `/proposals`
- `src/routes/reports.js` - Adicionado campo `technician_signature_file` na query

## 3. ARQUIVOS FRONTEND (ENVIAR PARA O SERVIDOR)

### 3.1 Novos Arquivos
- `web/src/pages/ProposalsPage.jsx` - Lista de propostas com abas por status
- `web/src/pages/ProposalViewer.jsx` - Visualização de proposta e geração de PDF
- `web/src/components/ProposalForm.jsx` - Formulário de criação/edição de proposta
- `web/src/utils/generateProposalPDF.js` - Função de geração de PDF de proposta

### 3.2 Arquivos Modificados
- `web/src/App.jsx` - Adicionadas rotas `/proposals` e `/proposals/:id`
- `web/src/components/Header.jsx` - Adicionado link "Propostas" no menu

## 4. FUNCIONALIDADES IMPLEMENTADAS

### 4.1 Status dos Agendamentos
- Novos status: ABERTO, ATRASADO, ATENDENDO, CONCLUIDO, FINALIZADO
- Migração de status antigos para novos

### 4.2 Status dos Relatórios
- Campo `technician_signature_file` adicionado na query de relatórios
- Campo `status` na tabela reports (verificar migração)

### 4.3 Sistema de Propostas
- **Criação de propostas técnicas** com todas as especificações
- **Geração de PDF** com cabeçalho alinhado verticalmente
- **Status de propostas**: ABERTA, FECHADA, DISPENSADA
- **Campo MOTIVO**: aparece apenas quando status = DISPENSADA (informação interna)
- **Abas na lista**: ABERTAS, FECHADAS, DISPENSADAS
- **Mudança automática de aba**: ao alterar status, a proposta vai para a aba correspondente
- **Cores do status**: azul (ABERTA), verde (FECHADA), vermelho (DISPENSADA)
- **Geração automática de número**: formato DDMMYY-XXXX
- **Sequência de números**: controlada por tabela `proposal_sequence`

## 5. PASSOS PARA DEPLOY NO HOSTINGER

### 5.1 Executar Migrações SQL
1. Acessar phpMyAdmin no Hostinger
2. Selecionar o banco de dados
3. Executar os arquivos SQL na ordem:
   - `migrations/update_schedule_status.sql`
   - `migrations/create_proposals_table.sql`
   - `migrations/add_proposal_date_and_number.sql`
   - `migrations/add_proposal_fields.sql`
   - `migrations/add_proposal_status.sql`
   - `migrations/add_proposal_motivo.sql`
   - Verificar se existe migração de status de relatórios

### 5.2 Enviar Arquivos Backend
1. Enviar `src/routes/proposals.js`
2. Atualizar `src/routes/index.js`
3. Atualizar `src/routes/reports.js`
4. Reiniciar backend

### 5.3 Enviar Arquivos Frontend
1. Enviar `web/src/pages/ProposalsPage.jsx`
2. Enviar `web/src/pages/ProposalViewer.jsx`
3. Enviar `web/src/components/ProposalForm.jsx`
4. Enviar `web/src/utils/generateProposalPDF.js`
5. Atualizar `web/src/App.jsx`
6. Atualizar `web/src/components/Header.jsx`
7. Build do frontend
8. Reiniciar frontend

## 6. VERIFICAÇÕES PÓS-DEPLOY

1. Testar criação de proposta
2. Testar edição de status
3. Testar geração de PDF
4. Testar mudança de abas
5. Testar campo motivo quando status = DISPENSADA
6. Verificar se status de agendamentos está correto
7. Verificar se status de relatórios está correto
