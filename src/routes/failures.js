import express from 'express';
import db from '../config/database.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /failures - Listar todas as falhas com filtros
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[FAILURES BACKEND] GET /failures called');
    const { brand, model, category, frequency, search } = req.query;
    
    let sql = `
      SELECT 
        f.id,
        f.brand,
        f.model,
        f.power,
        f.board_reference,
        f.input_voltage,
        f.output_voltage,
        f.battery_voltage,
        f.failure_description,
        f.initial_symptoms,
        f.tests_performed,
        f.tools_used,
        f.components,
        f.photo_urls,
        f.suggested_solution,
        f.parts_used,
        f.category,
        f.frequency,
        f.tags,
        f.created_at,
        u.name as created_by_name
      FROM failures f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (brand) {
      sql += ' AND f.brand LIKE ?';
      params.push(`%${brand}%`);
    }
    
    if (model) {
      sql += ' AND f.model LIKE ?';
      params.push(`%${model}%`);
    }
    
    if (category) {
      sql += ' AND f.category = ?';
      params.push(category);
    }
    
    if (frequency) {
      sql += ' AND f.frequency = ?';
      params.push(frequency);
    }
    
    if (search) {
      sql += ' AND (f.failure_description LIKE ? OR f.components LIKE ? OR f.suggested_solution LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    sql += ' ORDER BY f.created_at DESC';
    
    const [failures] = await db.query(sql, params);
    
    res.json({ data: failures });
  } catch (error) {
    console.error('Error fetching failures:', error);
    res.status(500).json({ error: 'Erro ao buscar falhas' });
  }
});

// GET /failures/:id - Buscar falha por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [failures] = await db.query(
      `SELECT 
        f.*,
        u.name as created_by_name
      FROM failures f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.id = ?`,
      [id]
    );
    
    if (failures.length === 0) {
      return res.status(404).json({ error: 'Falha não encontrada' });
    }
    
    res.json({ data: failures[0] });
  } catch (error) {
    console.error('Error fetching failure:', error);
    res.status(500).json({ error: 'Erro ao buscar falha' });
  }
});

// POST /failures - Criar nova falha
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('[FAILURES BACKEND] POST /failures called');
    console.log('[FAILURES BACKEND] Request body keys:', Object.keys(req.body));
    
    const {
      brand,
      model,
      power,
      board_reference,
      input_voltage,
      output_voltage,
      battery_voltage,
      failure_description,
      initial_symptoms,
      tests_performed,
      tools_used,
      components,
      photo_urls,
      suggested_solution,
      parts_used,
      category,
      frequency,
      tags
    } = req.body;
    
    const id = uuidv4();
    const created_by = req.user?.userId || req.user?.id;
    
    const [result] = await db.query(
      `INSERT INTO failures (
        id, brand, model, power, board_reference, input_voltage, output_voltage, battery_voltage,
        failure_description, initial_symptoms, tests_performed, tools_used, components, photo_urls,
        suggested_solution, parts_used, category, frequency, tags, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        brand || null,
        model || null,
        power || null,
        board_reference || null,
        input_voltage || null,
        output_voltage || null,
        battery_voltage || null,
        failure_description || null,
        initial_symptoms || null,
        tests_performed || null,
        tools_used || null,
        components || null,
        photo_urls || null,
        suggested_solution || null,
        parts_used || null,
        category || null,
        frequency || null,
        tags || null,
        created_by || null
      ]
    );
    
    res.status(201).json({ 
      message: 'Falha registrada com sucesso',
      id: id
    });
  } catch (error) {
    console.error('Error creating failure:', error);
    res.status(500).json({ error: 'Erro ao criar falha' });
  }
});

// PUT /failures/:id - Atualizar falha
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand,
      model,
      power,
      board_reference,
      input_voltage,
      output_voltage,
      battery_voltage,
      failure_description,
      initial_symptoms,
      tests_performed,
      tools_used,
      components,
      photo_urls,
      suggested_solution,
      parts_used,
      category,
      frequency,
      tags
    } = req.body;
    
    const [existing] = await db.query('SELECT id FROM failures WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Falha não encontrada' });
    }
    
    await db.query(
      `UPDATE failures SET
        brand = ?, model = ?, power = ?, board_reference = ?,
        input_voltage = ?, output_voltage = ?, battery_voltage = ?,
        failure_description = ?, initial_symptoms = ?, tests_performed = ?,
        tools_used = ?, components = ?, photo_urls = ?,
        suggested_solution = ?, parts_used = ?, category = ?, frequency = ?, tags = ?
      WHERE id = ?`,
      [
        brand || null,
        model || null,
        power || null,
        board_reference || null,
        input_voltage || null,
        output_voltage || null,
        battery_voltage || null,
        failure_description || null,
        initial_symptoms || null,
        tests_performed || null,
        tools_used || null,
        components || null,
        photo_urls || null,
        suggested_solution || null,
        parts_used || null,
        category || null,
        frequency || null,
        tags || null,
        id
      ]
    );
    
    res.json({ message: 'Falha atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating failure:', error);
    res.status(500).json({ error: 'Erro ao atualizar falha' });
  }
});

// DELETE /failures/:id - Excluir falha
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT id FROM failures WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Falha não encontrada' });
    }
    
    await db.query('DELETE FROM failures WHERE id = ?', [id]);
    
    res.json({ message: 'Falha excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting failure:', error);
    res.status(500).json({ error: 'Erro ao excluir falha' });
  }
});

// GET /failures/stats/summary - Estatísticas de falhas
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    // Total de falhas por categoria
    const [byCategory] = await db.query(`
      SELECT category, COUNT(*) as count
      FROM failures
      WHERE category IS NOT NULL
      GROUP BY category
    `);
    
    // Total de falhas por frequência
    const [byFrequency] = await db.query(`
      SELECT frequency, COUNT(*) as count
      FROM failures
      WHERE frequency IS NOT NULL
      GROUP BY frequency
    `);
    
    // Top 5 marcas com mais falhas
    const [topBrands] = await db.query(`
      SELECT brand, COUNT(*) as count
      FROM failures
      WHERE brand IS NOT NULL
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 5
    `);
    
    // Total de falhas registradas
    const [total] = await db.query('SELECT COUNT(*) as count FROM failures');
    
    res.json({
      data: {
        total: total[0].count,
        by_category: byCategory,
        by_frequency: byFrequency,
        top_brands: topBrands
      }
    });
  } catch (error) {
    console.error('Error fetching failure stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;
