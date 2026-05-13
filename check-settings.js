const db = require('./src/config/database.js');

async function checkSettings() {
  try {
    console.log('=== VERIFICANDO CONFIGURAÇÕES ===');
    
    const [settings] = await db.query('SELECT * FROM settings WHERE user_id = 2');
    
    if (settings.length === 0) {
      console.log('Nenhuma configuração encontrada para o usuário');
    } else {
      console.log('Configurações encontradas:');
      console.log(JSON.stringify(settings, null, 2));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
    process.exit(1);
  }
}

checkSettings();
