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
  const [reports] = await conn.query('SELECT id, report_number, status FROM reports ORDER BY created_at DESC LIMIT 5');
  console.log('\nÚltimos relatórios:');
  reports.forEach(r => {
    console.log(`ID: ${r.id.substring(0, 8)}... | Número: ${r.report_number} | Status: "${r.status}"`);
  });
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
