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
  const [photos] = await conn.query('SELECT id, photo_url FROM report_photos WHERE photo_url LIKE "%photo-1779635371379-686599875%"');
  console.log('\nFoto específica encontrada:');
  if (photos.length > 0) {
    photos.forEach(p => {
      console.log(`ID: ${p.id} | URL: "${p.photo_url}"`);
    });
  } else {
    console.log('Foto não encontrada no banco');
  }
  
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
