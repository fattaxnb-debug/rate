import db from './src/config/database.js';
import fs from 'fs';

async function runMigration() {
  try {
    const sql = fs.readFileSync('./migrations/add_attendance_address_fields.sql', 'utf8');
    
    // Dividir o SQL em instruções separadas
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.query(statement);
      console.log('Executado:', statement.substring(0, 50) + '...');
    }

    console.log('Migração executada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();
