import db from './src/config/database.js';

async function createPushSubscriptionsTable() {
  try {
    console.log('Criando tabela push_subscriptions...');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(500) NOT NULL,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_subscription (user_id)
      )
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
      ON push_subscriptions(user_id)
    `);
    
    console.log('Tabela push_subscriptions criada com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    process.exit(1);
  }
}

createPushSubscriptionsTable();
