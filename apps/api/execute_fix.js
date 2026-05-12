import db from './src/config/database.js';

async function fixPhotoUrl() {
  try {
    console.log('Alterando campo photo_url para TEXT...');
    await db.query('ALTER TABLE report_photos MODIFY COLUMN photo_url TEXT NOT NULL');
    console.log('Campo photo_url alterado com sucesso para TEXT');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao alterar campo:', error);
    process.exit(1);
  }
}

fixPhotoUrl();
