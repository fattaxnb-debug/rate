import mysql from 'mysql2/promise';

async function checkAndCreateTable() {
  const connection = await mysql.createConnection({
    host: 'faturamento.mysql.uhserver.com',
    user: 'fat_tax_nb',
    password: 'Fattax@2024',
    database: 'faturamento'
  });

  try {
    // Verificar se a tabela existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'push_subscriptions'");

    if (tables.length === 0) {
      console.log('Tabela push_subscriptions não existe. Criando...');

      await connection.query(`
        CREATE TABLE push_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          endpoint VARCHAR(500) NOT NULL,
          p256dh VARCHAR(255) NOT NULL,
          auth VARCHAR(255) NOT NULL,
          user_id INT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_subscription (user_id)
        )
      `);

      await connection.query('CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id)');

      console.log('Tabela push_subscriptions criada com sucesso!');
    } else {
      console.log('Tabela push_subscriptions já existe.');

      // Verificar estrutura da tabela
      const [columns] = await connection.query('DESCRIBE push_subscriptions');
      console.log('Estrutura da tabela:', columns);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkAndCreateTable();
