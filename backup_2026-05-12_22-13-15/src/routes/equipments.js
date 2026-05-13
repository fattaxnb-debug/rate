import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /equipments - Listar todos os equipamentos
router.get('/', async (req, res) => {
  try {
    const [equipments] = await db.query(`
      SELECT e.*, c.name as client_name 
      FROM equipments e 
      LEFT JOIN clients c ON e.client_id = c.id 
      ORDER BY e.created_at DESC
    `);
    res.json({ data: equipments });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamentos' });
  }
});

// GET /equipments/by-client/:client_id - Listar equipamentos por cliente
router.get('/by-client/:client_id', async (req, res) => {
  try {
    const [equipments] = await db.query(`
      SELECT e.*, c.name as client_name 
      FROM equipments e 
      LEFT JOIN clients c ON e.client_id = c.id 
      WHERE e.client_id = ?
      ORDER BY e.created_at DESC
    `, [req.params.client_id]);
    res.json({ data: equipments });
  } catch (error) {
    console.error('Error fetching equipments by client:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamentos' });
  }
});

// GET /equipments/:id - Buscar equipamento por ID
router.get('/:id', async (req, res) => {
  try {
    const [equipments] = await db.query('SELECT * FROM equipments WHERE id = ?', [req.params.id]);
    if (equipments.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    res.json({ data: equipments[0] });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    res.status(500).json({ error: 'Erro ao buscar equipamento' });
  }
});

// POST /equipments - Criar novo equipamento
router.post('/', async (req, res) => {
  console.log('POST /equipments called');
  console.log('Request body:', req.body);
  try {
    const allowedFields = ['client_id', 'type', 'brand', 'model', 'serial_number', 'power_va', 'voltage_in', 'voltage_out', 'voltage_battery', 'voltage_type', 'battery_type', 'battery_quantity', 'battery_volts', 'battery_bank_voltage', 'battery_current', 'battery_connection', 'battery_terminal', 'battery_brand', 'battery_model', 'capacity_ah', 'symmetric', 'isolated', 'signalizers_quantity', 'ihm', 'localizadores', 'communication_cable_type', 'fixation', 'quantity', 'installation_date'];
    
    const fields = [];
    const values = [];
    const placeholders = [];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        fields.push(field);
        values.push(req.body[field]);
        placeholders.push('?');
      }
    }
    
    // client_id e type são obrigatórios
    if (!req.body.client_id || !req.body.type) {
      return res.status(400).json({ error: 'client_id e type são obrigatórios' });
    }
    
    const sql = `INSERT INTO equipments (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    console.log('SQL:', sql);
    console.log('Values:', values);
    
    const [result] = await db.query(sql, values);

    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating equipment:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Erro ao criar equipamento', message: error.message });
  }
});

// PUT /equipments/:id - Atualizar equipamento
router.put('/:id', async (req, res) => {
  try {
    const { client_id, type, brand, model, serial_number, power_va, voltage_in, voltage_out, voltage_battery, voltage_type, battery_type, battery_quantity, battery_volts, battery_bank_voltage, battery_current, battery_connection, battery_terminal, battery_brand, battery_model, capacity_ah, symmetric, isolated, signalizers_quantity, ihm, localizadores, communication_cable_type, fixation, quantity, installation_date } = req.body;
    
    await db.query(
      `UPDATE equipments SET client_id = ?, type = ?, brand = ?, model = ?, serial_number = ?, power_va = ?, voltage_in = ?, voltage_out = ?, voltage_battery = ?, voltage_type = ?, battery_type = ?, battery_quantity = ?, battery_volts = ?, battery_bank_voltage = ?, battery_current = ?, battery_connection = ?, battery_terminal = ?, battery_brand = ?, battery_model = ?, capacity_ah = ?, symmetric = ?, isolated = ?, signalizers_quantity = ?, ihm = ?, localizadores = ?, communication_cable_type = ?, fixation = ?, quantity = ?, installation_date = ?
       WHERE id = ?`,
      [client_id, type, brand, model, serial_number, power_va, voltage_in, voltage_out, voltage_battery, voltage_type, battery_type, battery_quantity, battery_volts, battery_bank_voltage, battery_current, battery_connection, battery_terminal, battery_brand, battery_model, capacity_ah, symmetric, isolated, signalizers_quantity, ihm, localizadores, communication_cable_type, fixation, quantity, installation_date, req.params.id]
    );

    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (error) {
    console.error('Error updating equipment:', error);
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

// DELETE /equipments/:id - Deletar equipamento
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM equipments WHERE id = ?', [req.params.id]);
    res.json({ data: { message: 'Equipamento deletado com sucesso' } });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
});

export default router;
