import db from './src/config/database.js';

async function deleteTruncatedPhotos() {
  try {
    console.log('Deletando fotos truncadas (URL length <= 255)...');
    const [result] = await db.query(
      'DELETE FROM report_photos WHERE LENGTH(photo_url) <= 255'
    );
    console.log(`Deleted ${result.affectedRows} truncated photos`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteTruncatedPhotos();
