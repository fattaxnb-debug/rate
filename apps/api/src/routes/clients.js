import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /clients - Listar todos os clientes
router.get('/', async (req, res) => {
  console.log('[DEBUG] GET /clients called');
  console.log('[DEBUG] Request headers:', JSON.stringify(req.headers));
  try {
    console.log('[DEBUG] Querying database...');
    const [clients] = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    console.log('[DEBUG] Clients found:', clients.length);
    res.json({ data: clients });
  } catch (error) {
    console.error('[DEBUG] Error fetching clients:', error);
    console.error('[DEBUG] Error stack:', error.stack);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// GET /clients/:id - Buscar cliente por ID
router.get('/:id', async (req, res) => {
  console.log('GET /clients/:id called with id:', req.params.id);
  try {
    const [clients] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    console.log('Client found:', clients.length);
    if (clients.length === 0) {
      console.log('Client not found');
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    console.log('Client data:', clients[0]);
    res.json({ data: clients[0] });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// POST /clients - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    const { name, cnpj_cpf, address, phone, email, contact_person } = req.body;

    const [result] = await db.query(
      `INSERT INTO clients (name, cnpj, cpf, address, phone, email, contact_person)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, cnpj_cpf, cnpj_cpf, address, phone, email, contact_person]
    );

    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /clients/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { name, cnpj_cpf, address, phone, email, contact_person } = req.body;

    await db.query(
      `UPDATE clients SET name = ?, cnpj = ?, cpf = ?, address = ?, phone = ?, email = ?, contact_person = ?
       WHERE id = ?`,
      [name, cnpj_cpf, cnpj_cpf, address, phone, email, contact_person, req.params.id]
    );

    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// DELETE /clients/:id - Deletar cliente
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ data: { message: 'Cliente deletado com sucesso' } });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

export default router;
