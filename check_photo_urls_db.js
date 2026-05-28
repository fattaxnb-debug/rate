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
  const [photos] = await conn.query('SELECT id, photo_url FROM report_photos ORDER BY created_at DESC LIMIT 5');
  console.log('\nÚltimas fotos no banco:');
  photos.forEach(p => {
    console.log(`ID: ${p.id.substring(0, 8)}... | URL: "${p.photo_url}"`);
  });
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
