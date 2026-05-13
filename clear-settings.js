import db from './src/config/database.js';

async function clearSettings() {
  try {
    console.log('Limpando configurações antigas...');
    
    await db.query("UPDATE company_settings SET company_logo = '' WHERE company_logo LIKE 'data:%'");
    await db.query("UPDATE company_settings SET signature_tiago_viana = '' WHERE signature_tiago_viana LIKE 'data:%'");
    await db.query("UPDATE company_settings SET signature_tito_livio = '' WHERE signature_tito_livio LIKE 'data:%'");
    await db.query("UPDATE company_settings SET cover_pdf = '' WHERE cover_pdf LIKE 'data:%'");
    
    console.log('Configurações limpas com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao limpar configurações:', error);
    process.exit(1);
  }
}

clearSettings();
