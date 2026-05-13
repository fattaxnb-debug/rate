import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// POST /migrate/schedules - Migrar tabela schedules para UUID
router.post('/schedules', async (req, res) => {
  try {
    console.log('=== Starting schedules table migration ===');

    // 1. Verificar se a tabela existe e qual é o schema atual
    const [tableInfo] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules'
    `);

    if (tableInfo.length === 0) {
      return res.status(404).json({ error: 'Tabela schedules não encontrada' });
    }

    console.log('Current table schema:', tableInfo);

    // Verificar se o id já é varchar(36) (UUID)
    const idColumn = tableInfo.find(col => col.COLUMN_NAME === 'id');
    if (idColumn && idColumn.DATA_TYPE === 'varchar') {
      return res.json({ 
        success: true, 
        message: 'Tabela schedules já está com schema correto (UUID)',
        alreadyMigrated: true 
      });
    }

    // 2. Fazer backup dos dados existentes
    console.log('Creating backup of existing data...');
    await db.query('CREATE TABLE IF NOT EXISTS schedules_backup AS SELECT * FROM schedules');
    const [backupCount] = await db.query('SELECT COUNT(*) as count FROM schedules_backup');
    console.log(`Backup created with ${backupCount[0].count} records`);

    // 3. Deletar a tabela antiga
    console.log('Dropping old table...');
    await db.query('DROP TABLE IF EXISTS schedules');

    // 4. Criar a nova tabela com schema correto
    console.log('Creating new table with UUID schema...');
    await db.query(`
      CREATE TABLE schedules (
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
        KEY idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('=== Migration completed successfully ===');
    
    res.json({ 
      success: true, 
      message: 'Tabela schedules migrada com sucesso para UUID',
      backupRecords: backupCount[0].count,
      alreadyMigrated: false
    });

  } catch (error) {
    console.error('Error during migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração', 
      message: error.message 
    });
  }
});

// POST /migrate/photo-urls - Atualizar URLs das fotos antigas de /api/uploads/ para /uploads/
router.post('/photo-urls', async (req, res) => {
  try {
    console.log('=== Starting photo URLs migration ===');

    // Atualizar URLs das fotos antigas
    const [result] = await db.query(`
      UPDATE report_photos 
      SET photo_url = REPLACE(photo_url, '/api/uploads/', '/uploads/')
      WHERE photo_url LIKE '/api/uploads/%'
    `);

    console.log(`Updated ${result.affectedRows} photo URLs`);

    res.json({ 
      success: true, 
      message: 'URLs das fotos atualizadas com sucesso',
      updatedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Error during photo URLs migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração de URLs de fotos', 
      message: error.message 
    });
  }
});

// POST /migrate/reports - Migrar tabela reports para adicionar colunas faltantes
router.post('/reports', async (req, res) => {
  // CORS headers para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Starting reports table migration ===');

    // Verificar quais colunas existem na tabela reports
    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports'
    `);

    console.log('Existing columns:', existingColumns.map(c => c.COLUMN_NAME));

    const columnNames = existingColumns.map(c => c.COLUMN_NAME);
    const migrations = [];

    // Lista de colunas que devem existir no schema atual
    const requiredColumns = [
      { name: 'service_order_number', type: 'varchar(50) DEFAULT NULL' },
      { name: 'report_number', type: 'varchar(50) DEFAULT NULL' },
      { name: 'service_type', type: 'varchar(100) DEFAULT NULL' },
      { name: 'attendance_date_time', type: 'datetime DEFAULT NULL' },
      { name: 'technician_edit_count', type: 'int(11) DEFAULT 0' },
      { name: 'responsible_person', type: 'varchar(255) DEFAULT NULL' },
      { name: 'installation_location', type: 'varchar(100) DEFAULT NULL' },
      { name: 'installation_location_explanation', type: 'text DEFAULT NULL' },
      { name: 'local', type: 'varchar(100) DEFAULT NULL' },
      { name: 'inadequate_location_reason', type: 'text DEFAULT NULL' },
      { name: 'equipment_type', type: 'varchar(100) DEFAULT NULL' },
      { name: 'manufacturer', type: 'varchar(100) DEFAULT NULL' },
      { name: 'model', type: 'varchar(100) DEFAULT NULL' },
      { name: 'serial_number', type: 'varchar(100) DEFAULT NULL' },
      { name: 'capacity', type: 'varchar(100) DEFAULT NULL' },
      { name: 'installation_date', type: 'date DEFAULT NULL' },
      { name: 'installation_type', type: 'varchar(100) DEFAULT NULL' },
      { name: 'location_details', type: 'text DEFAULT NULL' },
      { name: 'environment', type: 'varchar(100) DEFAULT NULL' },
      { name: 'access', type: 'varchar(100) DEFAULT NULL' },
      { name: 'power_supply_type', type: 'varchar(100) DEFAULT NULL' },
      { name: 'breaker', type: 'varchar(100) DEFAULT NULL' },
      { name: 'cable_entry_phase', type: 'varchar(100) DEFAULT NULL' },
      { name: 'cable_entry_neutral', type: 'varchar(100) DEFAULT NULL' },
      { name: 'cable_entry_ground', type: 'varchar(100) DEFAULT NULL' },
      { name: 'cable_exit_phase', type: 'varchar(100) DEFAULT NULL' },
      { name: 'cable_exit_neutral', type: 'varchar(100) DEFAULT NULL' },
      { name: 'external_battery_positive_cable', type: 'varchar(100) DEFAULT NULL' },
      { name: 'external_battery_negative_cable', type: 'varchar(100) DEFAULT NULL' },
      { name: 'external_battery_neutral_cable', type: 'varchar(100) DEFAULT NULL' },
      { name: 'external_battery_connection', type: 'varchar(100) DEFAULT NULL' },
      { name: 'external_battery_nobreak_connection', type: 'varchar(100) DEFAULT NULL' },
      { name: 'electrical_measurements', type: 'text DEFAULT NULL' },
      { name: 'battery_bank', type: 'text DEFAULT NULL' },
      { name: 'cooled_environment', type: 'varchar(10) DEFAULT NULL' },
      { name: 'external_inspection', type: 'text DEFAULT NULL' },
      { name: 'internal_inspection', type: 'text DEFAULT NULL' },
      { name: 'attendance_description', type: 'text DEFAULT NULL' },
      { name: 'diagnosis', type: 'text DEFAULT NULL' },
      { name: 'conclusion', type: 'text DEFAULT NULL' },
      { name: 'reported_problems', type: 'text DEFAULT NULL' },
      { name: 'identified_defects', type: 'text DEFAULT NULL' },
      { name: 'procedures_performed', type: 'text DEFAULT NULL' },
      { name: 'replaced_parts', type: 'text DEFAULT NULL' },
      { name: 'parts_request', type: 'text DEFAULT NULL' },
      { name: 'observations', type: 'text DEFAULT NULL' },
      { name: 'problems_reported', type: 'text DEFAULT NULL' },
      { name: 'technical_description', type: 'text DEFAULT NULL' },
      { name: 'client_signature', type: 'text DEFAULT NULL' },
      { name: 'technician_signature', type: 'text DEFAULT NULL' },
      { name: 'photos', type: 'text DEFAULT NULL' }
    ];

    // Adicionar colunas faltantes
    for (const column of requiredColumns) {
      if (!columnNames.includes(column.name)) {
        console.log(`Adding column: ${column.name}`);
        await db.query(`ALTER TABLE reports ADD COLUMN ${column.name} ${column.type}`);
        migrations.push(column.name);
      }
    }

    console.log(`Added ${migrations.length} columns:`, migrations);

    res.json({ 
      success: true, 
      message: 'Tabela reports migrada com sucesso',
      addedColumns: migrations,
      totalColumns: columnNames.length + migrations.length
    });

  } catch (error) {
    console.error('Error during reports migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração de reports', 
      message: error.message 
    });
  }
});

// POST /migrate/clients - Migrar tabela clients para adicionar coluna cnpj_cpf
router.post('/clients', async (req, res) => {
  // CORS headers para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Starting clients table migration ===');

    // Verificar quais colunas existem na tabela clients
    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients'
    `);

    console.log('Existing columns:', existingColumns.map(c => c.COLUMN_NAME));

    const columnNames = existingColumns.map(c => c.COLUMN_NAME);
    const migrations = [];

    // Adicionar coluna cnpj_cpf se não existir
    if (!columnNames.includes('cnpj_cpf')) {
      console.log('Adding column: cnpj_cpf');
      await db.query(`ALTER TABLE clients ADD COLUMN cnpj_cpf varchar(20) DEFAULT NULL`);
      migrations.push('cnpj_cpf');
    }

    // Migrar dados de cnpj para cnpj_cpf se existir
    if (columnNames.includes('cnpj') && !columnNames.includes('cnpj_cpf_migrated')) {
      console.log('Migrating data from cnpj to cnpj_cpf');
      await db.query(`UPDATE clients SET cnpj_cpf = cnpj WHERE cnpj IS NOT NULL`);
      migrations.push('migrated cnpj data');
    }

    // Migrar dados de cpf para cnpj_cpf se existir
    if (columnNames.includes('cpf') && !columnNames.includes('cpf_migrated')) {
      console.log('Migrating data from cpf to cnpj_cpf');
      await db.query(`UPDATE clients SET cnpj_cpf = cpf WHERE cnpj_cpf IS NULL AND cpf IS NOT NULL`);
      migrations.push('migrated cpf data');
    }

    console.log(`Migration completed: ${migrations.join(', ')}`);

    res.json({ 
      success: true, 
      message: 'Tabela clients migrada com sucesso',
      migrations: migrations
    });

  } catch (error) {
    console.error('Error during clients migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração de clients', 
      message: error.message 
    });
  }
});

// POST /migrate/schedules-add-time - Adicionar coluna scheduled_time na tabela schedules
router.post('/schedules-add-time', async (req, res) => {
  // CORS headers para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Starting schedules add scheduled_time migration ===');

    // Verificar quais colunas existem na tabela schedules
    const [existingColumns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schedules'
    `);

    console.log('Existing columns:', existingColumns.map(c => c.COLUMN_NAME));

    const columnNames = existingColumns.map(c => c.COLUMN_NAME);
    const migrations = [];

    // Adicionar coluna scheduled_time se não existir
    if (!columnNames.includes('scheduled_time')) {
      console.log('Adding column: scheduled_time');
      await db.query(`ALTER TABLE schedules ADD COLUMN scheduled_time time DEFAULT NULL`);
      migrations.push('scheduled_time');
    }

    console.log(`Migration completed: ${migrations.join(', ')}`);

    res.json({ 
      success: true, 
      message: 'Coluna scheduled_time adicionada com sucesso',
      migrations: migrations
    });

  } catch (error) {
    console.error('Error during schedules add scheduled_time migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração de schedules', 
      message: error.message 
    });
  }
});

// POST /migrate/reports-uuid - Migrar tabela reports para UUID
router.post('/reports-uuid', async (req, res) => {
  // CORS headers para permitir requisições de qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== Starting reports UUID migration ===');

    // Verificar o tipo atual da coluna id
    const [columnInfo] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reports' AND COLUMN_NAME = 'id'
    `);

    if (columnInfo.length === 0) {
      return res.status(404).json({ error: 'Tabela reports não encontrada' });
    }

    console.log('Current id column type:', columnInfo[0].COLUMN_TYPE);

    // Verificar se já é varchar(36)
    if (columnInfo[0].DATA_TYPE === 'varchar') {
      return res.json({ 
        success: true, 
        message: 'Tabela reports já está com UUID',
        alreadyMigrated: true 
      });
    }

    // Fazer backup dos dados existentes
    console.log('Creating backup of existing data...');
    await db.query('CREATE TABLE IF NOT EXISTS reports_backup AS SELECT * FROM reports');
    const [backupCount] = await db.query('SELECT COUNT(*) as count FROM reports_backup');
    console.log(`Backup created with ${backupCount[0].count} records`);

    // Converter id de INT para VARCHAR(36)
    console.log('Converting id column to VARCHAR(36)...');
    await db.query(`
      ALTER TABLE reports 
      MODIFY COLUMN id varchar(36) NOT NULL,
      DROP PRIMARY KEY,
      ADD PRIMARY KEY (id)
    `);

    console.log('=== Migration completed successfully ===');
    
    res.json({ 
      success: true, 
      message: 'Tabela reports migrada para UUID com sucesso',
      backupRecords: backupCount[0].count,
      alreadyMigrated: false
    });

  } catch (error) {
    console.error('Error during reports UUID migration:', error);
    res.status(500).json({ 
      error: 'Erro durante migração de reports para UUID', 
      message: error.message 
    });
  }
});

export default router;
