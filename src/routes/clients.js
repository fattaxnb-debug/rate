import express from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

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
    const { type, name, fantasy_name, cnpj_cpf, rg, ie, address, number, complement, neighborhood, city, state, zip_code, phone, mobile, email, technical_contact } = req.body;

    // Converter type para o formato do banco (fisica/juridica)
    const dbType = type === 'juridica' ? 'juridica' : 'fisica';

    const id = uuidv4();

    const [result] = await db.query(
      `INSERT INTO clients (id, type, name, fantasy_name, cnpj_cpf, rg, ie, address, number, complement, neighborhood, city, state, zip_code, phone, mobile, email, technical_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dbType, name, fantasy_name, cnpj_cpf, rg, ie, address, number, complement, neighborhood, city, state, zip_code, phone, mobile, email, technical_contact]
    );

    res.json({ data: { id, ...req.body } });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// PUT /clients/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { type, name, fantasy_name, cnpj_cpf, rg, ie, address, number, complement, neighborhood, city, state, zip_code, phone, mobile, email, technical_contact } = req.body;

    // Converter type para o formato do banco (fisica/juridica)
    const dbType = type === 'juridica' ? 'juridica' : 'fisica';

    await db.query(
      `UPDATE clients SET type = ?, name = ?, fantasy_name = ?, cnpj_cpf = ?, rg = ?, ie = ?, address = ?, number = ?, complement = ?, neighborhood = ?, city = ?, state = ?, zip_code = ?, phone = ?, mobile = ?, email = ?, technical_contact = ?
       WHERE id = ?`,
      [dbType, name, fantasy_name, cnpj_cpf, rg, ie, address, number, complement, neighborhood, city, state, zip_code, phone, mobile, email, technical_contact, req.params.id]
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
