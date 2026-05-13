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

async function checkUsersTable() {
  try {
    console.log('=== VERIFICANDO ESTRUTURA DA TABELA USERS ===\n');
    
    const [columns] = await pool.query('DESCRIBE users');
    
    const roleColumn = columns.find(c => c.Field === 'role');
    if (roleColumn) {
      console.log(`Coluna role: ${roleColumn.Type}`);
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
