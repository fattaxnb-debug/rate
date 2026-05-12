import mysql from 'mysql2/promise';

async function checkTruncatedPhotos() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fattax'
  });

  try {
    const [photos] = await connection.query(
      `SELECT id, report_id, CHAR_LENGTH(photo_url) as url_length, photo_url 
       FROM report_photos 
       ORDER BY id`
    );

    console.log('Total de fotos:', photos.length);
    console.log('\nFotos truncadas (menos de 1000 caracteres):');
    
    let truncatedCount = 0;
    for (const photo of photos) {
      if (photo.url_length < 1000) {
        console.log(`ID: ${photo.id}, Report ID: ${photo.report_id}, Tamanho: ${photo.url_length} caracteres`);
        truncatedCount++;
      }
    }

    console.log(`\nTotal de fotos truncadas: ${truncatedCount}`);
    console.log(`Total de fotos completas: ${photos.length - truncatedCount}`);

  } catch (error) {
    console.error('Erro ao verificar fotos:', error);
  } finally {
    await connection.end();
  }
}

checkTruncatedPhotos();
