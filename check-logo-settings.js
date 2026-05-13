import db from './src/config/database.js';

async function checkSettings() {
  try {
    console.log('Verificando configurações no banco de dados...');
    const [settings] = await db.query('SELECT * FROM company_settings LIMIT 1');
    console.log('Configurações:', JSON.stringify(settings, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
    process.exit(1);
  }
}

checkSettings();
