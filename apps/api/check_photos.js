import mysql from 'mysql2/promise';

async function checkPhotos() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fattax'
  });

  try {
    console.log('Buscando fotos no banco de dados...');
    const [photos] = await connection.query(
      `SELECT id, report_id, photo_url, comment FROM report_photos ORDER BY created_at DESC LIMIT 10`
    );
    
    console.log(`Total de fotos encontradas: ${photos.length}`);
    
    for (const photo of photos) {
      const urlLength = photo.photo_url ? photo.photo_url.length : 0;
      const startsWithData = photo.photo_url ? photo.photo_url.startsWith('data:') : false;
      
      console.log(`\nFoto ID: ${photo.id}`);
      console.log(`  Report ID: ${photo.report_id}`);
      console.log(`  Comment: ${photo.comment}`);
      console.log(`  Photo URL length: ${urlLength}`);
      console.log(`  Starts with data:: ${startsWithData}`);
      
      if (!photo.photo_url || urlLength < 10) {
        console.log(`  ❌ Foto vazia ou inválida - será deletada`);
        await connection.query('DELETE FROM report_photos WHERE id = ?', [photo.id]);
        console.log(`  ✅ Foto deletada`);
      } else if (!startsWithData) {
        console.log(`  ❌ Foto não está em formato base64 - será deletada`);
        await connection.query('DELETE FROM report_photos WHERE id = ?', [photo.id]);
        console.log(`  ✅ Foto deletada`);
      } else {
        console.log(`  ✅ Foto válida`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar fotos:', error.message);
  } finally {
    await connection.end();
  }
}

checkPhotos();
