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
  // Buscar fotos com URL incorreta
  const [photos] = await conn.query('SELECT id, photo_url FROM report_photos WHERE photo_url LIKE "/api/uploads/%"');
  console.log(`\nFotos com URL incorreta: ${photos.length}`);
  
  if (photos.length > 0) {
    for (const photo of photos) {
      const newUrl = photo.photo_url.replace('/api/uploads/', '/uploads/');
      console.log(`Corrigindo: ${photo.photo_url} -> ${newUrl}`);
      await conn.query('UPDATE report_photos SET photo_url = ? WHERE id = ?', [newUrl, photo.id]);
    }
    console.log('\n✅ URLs de fotos corrigidas no banco de dados');
  } else {
    console.log('Nenhuma foto com URL incorreta encontrada');
  }
  
  // Verificar fotos corrigidas
  const [after] = await conn.query('SELECT id, photo_url FROM report_photos LIMIT 5');
  console.log('\nAmostra de URLs após correção:');
  after.forEach(p => console.log(`  ${p.photo_url}`));
  
} catch (err) {
  console.error('Erro:', err.message);
} finally {
  await conn.end();
}
