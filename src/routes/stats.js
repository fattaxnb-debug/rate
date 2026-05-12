import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /stats/clients - Contar clientes
router.get('/clients', async (req, res) => {
  try {
    const [result] = await db.query('SELECT COUNT(*) as count FROM clients');
    res.json({ data: { count: result[0].count } });
  } catch (error) {
    console.error('Error fetching clients stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de clientes' });
  }
});

// GET /stats/equipments - Contar equipamentos
router.get('/equipments', async (req, res) => {
  try {
    const [result] = await db.query('SELECT COUNT(*) as count FROM equipments');
    res.json({ data: { count: result[0].count } });
  } catch (error) {
    console.error('Error fetching equipments stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de equipamentos' });
  }
});

// GET /stats/schedules - Contar agendamentos e por status
router.get('/schedules', async (req, res) => {
  try {
    const [countResult] = await db.query('SELECT COUNT(*) as count FROM schedules');
    const [statusResult] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM schedules 
      GROUP BY status
    `);
    res.json({ 
      data: { 
        count: countResult[0].count,
        byStatus: statusResult
      } 
    });
  } catch (error) {
    console.error('Error fetching schedules stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de agendamentos' });
  }
});

export default router;
