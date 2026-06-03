import express from 'express';
import db from '../config/database.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Salvar subscription de push
router.post('/', async (req, res) => {
  try {
    const { endpoint, keys, user_id } = req.body;

    if (!endpoint || !keys || !user_id) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Verificar se já existe subscription para este usuário
    const [existing] = await db.query(
      'SELECT id FROM push_subscriptions WHERE user_id = ?',
      [user_id]
    );

    if (existing.length > 0) {
      // Atualizar subscription existente
      await db.query(
        `UPDATE push_subscriptions SET 
         endpoint = ?, 
         p256dh = ?, 
         auth = ?, 
         updated_at = NOW() 
         WHERE user_id = ?`,
        [endpoint, keys.p256dh, keys.auth, user_id]
      );
      logger.info(`Push subscription atualizada para usuário ${user_id}`);
    } else {
      // Criar nova subscription
      await db.query(
        `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [endpoint, keys.p256dh, keys.auth, user_id]
      );
      logger.info(`Push subscription criada para usuário ${user_id}`);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao salvar push subscription:', error);
    res.status(500).json({ error: 'Erro ao salvar subscription' });
  }
});

// Obter subscription de um usuário
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [subscriptions] = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'Subscription não encontrada' });
    }

    res.json(subscriptions[0]);
  } catch (error) {
    logger.error('Erro ao obter push subscription:', error);
    res.status(500).json({ error: 'Erro ao obter subscription' });
  }
});

// Deletar subscription
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM push_subscriptions WHERE id = ?', [id]);

    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao deletar push subscription:', error);
    res.status(500).json({ error: 'Erro ao deletar subscription' });
  }
});

// Verificar e criar tabela push_subscriptions se não existir
router.post('/setup-table', async (req, res) => {
  try {
    // Verificar se a tabela existe
    const [tables] = await db.query("SHOW TABLES LIKE 'push_subscriptions'");

    if (tables.length === 0) {
      // Criar tabela
      await db.query(`
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

      await db.query('CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id)');

      logger.info('Tabela push_subscriptions criada com sucesso');
      res.json({ success: true, message: 'Tabela criada com sucesso' });
    } else {
      logger.info('Tabela push_subscriptions já existe');
      res.json({ success: true, message: 'Tabela já existe' });
    }
  } catch (error) {
    logger.error('Erro ao verificar/criar tabela push_subscriptions:', error);
    res.status(500).json({ error: 'Erro ao configurar tabela' });
  }
});

export default router;
