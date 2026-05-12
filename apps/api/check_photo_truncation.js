import mysql from 'mysql2/promise';

async function checkPhotoTruncation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fattax'
  });

  try {
    const [photos] = await connection.query(
      `SELECT id, report_id, CHAR_LENGTH(photo_url) as url_length, LEFT(photo_url, 100) as url_start, RIGHT(photo_url, 100) as url_end 
       FROM report_photos 
       ORDER BY id`
    );

    console.log('Total de fotos:', photos.length);
    console.log('\nDetalhes das fotos:');
    
    for (const photo of photos) {
      console.log(`\nID: ${photo.id}`);
      console.log(`Report ID: ${photo.report_id}`);
      console.log(`Tamanho: ${photo.url_length} caracteres`);
      console.log(`Início da URL: ${photo.url_start}`);
      console.log(`Fim da URL: ${photo.url_end}`);
      
      // Verificar se termina corretamente (base64 deve terminar com == ou = ou caractere alfanumérico)
      const urlEnd = photo.url_end.trim();
      if (urlEnd.endsWith('==') || urlEnd.endsWith('=') || /[A-Za-z0-9]/.test(urlEnd.slice(-1))) {
        console.log('✓ URL parece estar completa');
      } else {
        console.log('✗ URL pode estar truncada (não termina com caracteres base64 válidos)');
      }
    }

  } catch (error) {
    console.error('Erro ao verificar fotos:', error);
  } finally {
    await connection.end();
  }
}

checkPhotoTruncation();
