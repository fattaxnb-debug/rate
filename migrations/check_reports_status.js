import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fattax',
  port: process.env.DB_PORT || 3306,
});

console.log('Conectado ao banco:', process.env.DB_NAME || 'fattax');

try {
  // Verificar estrutura da tabela reports
  const [structure] = await conn.query('DESCRIBE reports');
  console.log('\nEstrutura da tabela reports:');
  structure.forEach(col => {
    if (col.Field === 'status') {
      console.log('Campo status:', col);
    }
  });

  // Verificar status atuais
  const [reports] = await conn.query('SELECT id, status FROM reports LIMIT 10');
  console.log('\nStatus dos relatórios:');
  reports.forEach(r => {
    console.log(`ID: ${r.id}, Status: "${r.status}"`);
  });

} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
