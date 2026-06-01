import express from 'express';
import db from '../config/database.js';
import { authenticateToken as authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /proposals - Listar todas as propostas
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('[PROPOSALS BACKEND DEBUG] GET /proposals called');
    console.log('[PROPOSALS BACKEND DEBUG] Auth header:', req.headers['authorization'] ? 'Present' : 'Missing');
    console.log('[PROPOSALS BACKEND DEBUG] User from auth:', req.user);
    const { client_name } = req.query;
    
    let sql = `
      SELECT 
        id,
        proposal_number,
        status,
        DATE_FORMAT(created_at, '%d/%m/%Y') as proposal_date,
        client_name,
        client_cnpj,
        total_amount,
        motivo,
        created_at
      FROM proposals 
      WHERE 1=1
    `;
    const params = [];
    
    if (client_name) {
      sql += ' AND client_name LIKE ?';
      params.push(`%${client_name}%`);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const [proposals] = await db.query(sql, params);
    
    res.json({ data: proposals });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Erro ao buscar propostas' });
  }
});

// GET /proposals/:id - Buscar proposta por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar proposta principal com dados do usuário criador
    const [proposals] = await db.query(
      `SELECT 
        p.id,
        p.proposal_number,
        p.status,
        DATE_FORMAT(p.created_at, '%d/%m/%Y') as proposal_date,
        p.client_name,
        p.client_cnpj,
        p.client_phone,
        p.client_mobile,
        p.client_email,
        p.client_contact,
        p.brand,
        p.line,
        p.model,
        p.code,
        p.power,
        p.input_voltage,
        p.output_voltage,
        p.battery_bank_type,
        p.battery_quantity,
        p.battery_voltage,
        p.battery_amperage,
        p.power_supply,
        p.nobreak_output,
        p.monitoring,
        p.installation_activation,
        p.payment_terms,
        p.delivery_time,
        p.warranty,
        p.shipping_terms,
        DATE_FORMAT(p.proposal_validity, '%d/%m/%Y') as proposal_validity,
        p.observations,
        p.motivo,
        p.total_amount,
        p.created_by,
        u.name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?`,
      [id]
    );
    
    if (proposals.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    // Buscar itens da proposta
    const [items] = await db.query(
      `SELECT 
        id,
        product_code,
        product_description,
        quantity,
        unit_price,
        total_price
      FROM proposal_items 
      WHERE proposal_id = ? 
      ORDER BY id`,
      [id]
    );
    
    const proposal = proposals[0];
    proposal.items = items || [];
    
    res.json({ data: proposal });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Erro ao buscar proposta' });
  }
});

// Função para gerar número da proposta
async function generateProposalNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prevYear = String(year - 1).slice(-2);
  const currentYearShort = String(year).slice(-2);
  
  const dateKey = `${prevYear}${currentYearShort}${month}${day}`;
  
  // Atualizar ou inserir sequência
  await db.query(
    `INSERT INTO proposal_sequence (sequence_date, last_number) 
     VALUES (?, 1) 
     ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
    [dateKey]
  );
  
  // Buscar número atual
  const [sequence] = await db.query(
    'SELECT last_number FROM proposal_sequence WHERE sequence_date = ?',
    [dateKey]
  );
  
  const sequentialNumber = String(sequence[0].last_number).padStart(4, '0');
  return `${dateKey}-${sequentialNumber}`;
}

// POST /proposals - Criar nova proposta
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('[PROPOSALS BACKEND DEBUG] POST /proposals called');
    console.log('[PROPOSALS BACKEND DEBUG] Auth header:', req.headers['authorization'] ? 'Present' : 'Missing');
    console.log('[PROPOSALS BACKEND DEBUG] User from auth:', req.user);
    console.log('[BACKEND DEBUG] Request body keys:', Object.keys(req.body));
    console.log('[BACKEND DEBUG] Request body:', JSON.stringify(req.body, null, 2));

    const {
      proposal_number,
      proposal_date,
      client_name,
      client_cnpj,
      client_phone,
      client_mobile,
      client_email,
      client_contact,
      brand,
      line,
      model,
      code,
      power,
      input_voltage,
      output_voltage,
      battery_bank_type,
      battery_quantity,
      battery_voltage,
      battery_amperage,
      power_supply,
      nobreak_output,
      monitoring,
      installation_activation,
      payment_terms,
      delivery_time,
      warranty,
      shipping_terms,
      proposal_validity,
      observations,
      motivo,
      items,
      total_amount
    } = req.body;

    console.log('[BACKEND DEBUG] Extraídos do req.body');
    console.log('[BACKEND DEBUG] proposal_validity:', proposal_validity);
    console.log('[BACKEND DEBUG] proposal_date:', proposal_date);

    // Gerar proposal_number se não foi fornecido
    const finalProposalNumber = proposal_number || await generateProposalNumber();
    const created_by = req.user?.userId || req.user?.id;

    // Converter data de valididade de dd/mm/yyyy para yyyy-mm-dd
    let validityDate = proposal_validity || null;
    if (validityDate && validityDate.includes('/')) {
      const parts = validityDate.split('/');
      if (parts.length === 3) validityDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Inserir proposta
    const [result] = await db.query(
      `INSERT INTO proposals (
        proposal_number,
        status,
        client_name,
        client_cnpj,
        client_phone,
        client_mobile,
        client_email,
        client_contact,
        brand,
        line,
        model,
        code,
        power,
        input_voltage,
        output_voltage,
        monitoring,
        installation_activation,
        payment_terms,
        delivery_time,
        warranty,
        shipping_terms,
        proposal_validity,
        observations,
        motivo,
        total_amount,
        created_by,
        battery_bank_type,
        battery_quantity,
        battery_voltage,
        battery_amperage,
        power_supply,
        nobreak_output
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalProposalNumber,
        'ABERTA',
        client_name,
        client_cnpj,
        client_phone,
        client_mobile,
        client_email,
        client_contact,
        brand,
        line,
        model,
        code,
        power,
        input_voltage,
        output_voltage,
        monitoring,
        installation_activation,
        payment_terms,
        delivery_time,
        warranty,
        shipping_terms,
        validityDate,
        observations || '',
        motivo || '',
        total_amount || 0,
        created_by,
        battery_bank_type,
        battery_quantity,
        battery_voltage,
        battery_amperage,
        power_supply,
        nobreak_output
      ]
    );
    
    const proposalId = result.insertId;
    
    // Inserir itens
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO proposal_items (
            proposal_id,
            product_code,
            product_description,
            quantity,
            unit_price,
            total_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            proposalId,
            item.product_code,
            item.product_description,
            item.quantity || 1,
            item.unit_price || 0,
            item.total_price || 0
          ]
        );
      }
    }
    
    res.status(201).json({ 
      message: 'Proposta criada com sucesso',
      id: proposalId,
      proposal_number 
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Erro ao criar proposta' });
  }
});

// PUT /proposals/:id - Atualizar proposta
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      client_name,
      client_cnpj,
      client_phone,
      client_mobile,
      client_email,
      client_contact,
      brand,
      line,
      model,
      code,
      power,
      input_voltage,
      output_voltage,
      battery_bank_type,
      battery_quantity,
      battery_voltage,
      battery_amperage,
      power_supply,
      nobreak_output,
      monitoring,
      installation_activation,
      payment_terms,
      delivery_time,
      warranty,
      shipping_terms,
      proposal_validity,
      observations,
      motivo,
      items,
      total_amount,
      status
    } = req.body;
    
    // Verificar se proposta existe
    const [existing] = await db.query('SELECT id FROM proposals WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    // Converter data de valididade de dd/mm/yyyy para yyyy-mm-dd
    let validityDate = proposal_validity || null;
    if (validityDate && validityDate.includes('/')) {
      const parts = validityDate.split('/');
      if (parts.length === 3) validityDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // Atualizar proposta
    await db.query(
      `UPDATE proposals SET
        client_name = ?,
        client_cnpj = ?,
        client_phone = ?,
        client_mobile = ?,
        client_email = ?,
        client_contact = ?,
        brand = ?,
        line = ?,
        model = ?,
        code = ?,
        power = ?,
        input_voltage = ?,
        output_voltage = ?,
        monitoring = ?,
        installation_activation = ?,
        payment_terms = ?,
        delivery_time = ?,
        warranty = ?,
        shipping_terms = ?,
        proposal_validity = ?,
        observations = ?,
        motivo = ?,
        total_amount = ?,
        battery_bank_type = ?,
        battery_quantity = ?,
        battery_voltage = ?,
        battery_amperage = ?,
        power_supply = ?,
        nobreak_output = ?,
        status = ?
      WHERE id = ?`,
      [
        client_name,
        client_cnpj,
        client_phone,
        client_mobile,
        client_email,
        client_contact,
        brand,
        line,
        model,
        code,
        power,
        input_voltage,
        output_voltage,
        monitoring,
        installation_activation,
        payment_terms,
        delivery_time,
        warranty,
        shipping_terms,
        validityDate,
        observations || '',
        motivo || '',
        total_amount || 0,
        battery_bank_type,
        battery_quantity,
        battery_voltage,
        battery_amperage,
        power_supply,
        nobreak_output,
        status || 'ABERTA',
        id
      ]
    );
    
    // Remover itens antigos
    await db.query('DELETE FROM proposal_items WHERE proposal_id = ?', [id]);
    
    // Inserir novos itens
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO proposal_items (
            proposal_id,
            product_code,
            product_description,
            quantity,
            unit_price,
            total_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.product_code,
            item.product_description,
            item.quantity || 1,
            item.unit_price || 0,
            item.total_price || 0
          ]
        );
      }
    }
    
    res.json({ message: 'Proposta atualizada com sucesso' });
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Erro ao atualizar proposta' });
  }
});

// DELETE /proposals/:id - Excluir proposta
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se proposta existe
    const [existing] = await db.query('SELECT id FROM proposals WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }
    
    // Excluir proposta (itens serão excluídos automaticamente por CASCADE)
    await db.query('DELETE FROM proposals WHERE id = ?', [id]);
    
    res.json({ message: 'Proposta excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ error: 'Erro ao excluir proposta' });
  }
});

export default router;
