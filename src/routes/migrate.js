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

export default router;
