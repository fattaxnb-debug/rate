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
  const [reports] = await conn.query('SELECT id, status, created_at, updated_at FROM reports ORDER BY updated_at DESC LIMIT 5');
  console.log('\nÚltimos relatórios (status e timestamps):');
  reports.forEach(r => {
    console.log(`ID: ${r.id.substring(0, 8)}... | Status: "${r.status}" | Updated: ${r.updated_at}`);
  });

} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
