import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fattax',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkSchedulesTable() {
  try {
    console.log('=== VERIFICANDO ESTRUTURA DA TABELA SCHEDULES ===\n');
    
    const [columns] = await pool.query('DESCRIBE schedules');
    
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchedulesTable();
