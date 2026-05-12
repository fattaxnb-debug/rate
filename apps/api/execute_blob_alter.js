import mysql from 'mysql2/promise';

async function alterPhotoUrlToBlob() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'fattax'
  });

  try {
    console.log('Alterando campo photo_url de TEXT para BLOB...');
    await connection.query('ALTER TABLE report_photos MODIFY COLUMN photo_url BLOB');
    console.log('✅ Campo photo_url alterado para BLOB com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao alterar campo:', error.message);
  } finally {
    await connection.end();
  }
}

alterPhotoUrlToBlob();
