import express from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /reports - Listar todos os relatórios
router.get('/', async (req, res) => {
  try {
    console.log('[REPORTS DEBUG] Fetching reports');
    const [reports] = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    console.log('[REPORTS DEBUG] Reports fetched successfully:', reports.length);
    res.json({ data: reports });
  } catch (error) {
    console.error('[REPORTS DEBUG] Error fetching reports:', error);
    console.error('[REPORTS DEBUG] Error message:', error.message);
    res.status(500).json({ error: 'Erro ao buscar relatórios', message: error.message });
  }
});

// GET /reports/:id - Buscar relatório por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('[REPORTS DEBUG] Fetching report with ID:', req.params.id);
    console.log('[REPORTS DEBUG] Querying database...');
    
    const [reports] = await db.query(
      `SELECT r.*, 
              c.name as client_name, 
              c.fantasy_name as client_fantasy_name, 
              c.cnpj_cpf as client_cnpj, 
              c.rg as client_rg, 
              c.ie as client_ie, 
              c.address as client_address, 
              c.number as client_number, 
              c.complement as client_complement, 
              c.neighborhood as client_neighborhood, 
              c.city as client_city, 
              c.state as client_state, 
              c.zip_code as client_zip_code, 
              c.phone as client_phone, 
              c.mobile as client_mobile, 
              c.email as client_email, 
              c.technical_contact as client_technical_contact,
              u.name as technician_name,
              u.email as technician_email,
              u.signature as technician_signature_file
       FROM reports r 
       LEFT JOIN clients c ON r.client_id = c.id 
       LEFT JOIN users u ON r.technician_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    console.log('[REPORTS DEBUG] Reports fetched:', reports.length);
    
    if (reports.length === 0) {
      console.log('[REPORTS DEBUG] Report not found');
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    
    const report = reports[0];
    console.log('[REPORTS DEBUG] Report data keys:', Object.keys(report));
    
    // Parse campos JSON
    console.log('[REPORTS DEBUG] Parsing JSON fields...');
    if (report.electrical_measurements && typeof report.electrical_measurements === 'string') {
      try {
        report.electrical_measurements = JSON.parse(report.electrical_measurements);
        console.log('[REPORTS DEBUG] electrical_measurements parsed successfully');
      } catch (e) {
        console.error('[REPORTS DEBUG] Error parsing electrical_measurements:', e.message);
        report.electrical_measurements = { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } };
      }
    } else if (!report.electrical_measurements) {
      console.log('[REPORTS DEBUG] electrical_measurements is null, using default');
      report.electrical_measurements = { entrada: { tensions: {}, currents: {} }, saida: { tensions: {}, currents: {} } };
    }
    
    if (report.battery_bank && typeof report.battery_bank === 'string') {
      try {
        report.battery_bank = JSON.parse(report.battery_bank);
        console.log('[REPORTS DEBUG] battery_bank parsed successfully');
      } catch (e) {
        console.error('[REPORTS DEBUG] Error parsing battery_bank:', e.message);
        report.battery_bank = {};
      }
    } else if (!report.battery_bank) {
      console.log('[REPORTS DEBUG] battery_bank is null, using default');
      report.battery_bank = {};
    }
    
    // Buscar fotos da tabela report_photos
    console.log('[REPORTS DEBUG] Fetching photos for report:', req.params.id);
    const [photos] = await db.query(
      `SELECT * FROM report_photos WHERE report_id = ? ORDER BY sequence ASC, created_at ASC`,
      [req.params.id]
    );
    console.log('[REPORTS DEBUG] Photos fetched:', photos.length);
    
    report.photos = photos;
    
    res.json({ data: report });
    console.log('[REPORTS DEBUG] Report fetched successfully:', req.params.id);
  } catch (error) {
    console.error('[REPORTS DEBUG] Error fetching report:', error);
    console.error('[REPORTS DEBUG] Error message:', error.message);
    console.error('[REPORTS DEBUG] Error stack:', error.stack);
    res.status(500).json({ error: 'Erro ao buscar relatório', message: error.message });
  }
});

// POST /reports - Criar novo relatório
router.post('/', async (req, res) => {
  try {
    console.log('[REPORTS DEBUG] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[REPORTS DEBUG] Request body keys:', Object.keys(req.body));
    console.log('[REPORTS DEBUG] created_date received:', req.body.created_date);
    console.log('[REPORTS DEBUG] created_date type:', typeof req.body.created_date);
    
    const { 
      schedule_id, 
      client_id, 
      equipment_id, 
      technician_id, 
      report_number, 
      service_order_number, 
      attendance_date_time, 
      created_date,
      service_type,
      status,
      technician_edit_count,
      responsible_person,
      installation_location,
      installation_location_explanation,
      power_supply_type,
      breaker,
      cable_entry_phase,
      cable_entry_neutral,
      cable_entry_ground,
      cable_exit_phase,
      cable_exit_neutral,
      external_battery_positive_cable,
      external_battery_negative_cable,
      external_battery_neutral_cable,
      external_battery_connection,
      external_battery_nobreak_connection,
      electrical_measurements,
      battery_bank,
      cooled_environment,
      external_inspection,
      internal_inspection,
      attendance_description,
      diagnosis,
      conclusion,
      reported_problems,
      identified_defects,
      procedures_performed,
      replaced_parts,
      parts_request,
      observations,
      client_signature,
      technician_signature
    } = req.body;
    
    console.log('[REPORTS DEBUG] Extracted basic fields:', {
      client_id, equipment_id, technician_id, service_order_number, created_date, service_type, status
    });
    
    console.log('[REPORTS DEBUG] Validating required fields...');
    if (!client_id) {
      console.error('[REPORTS DEBUG] Missing client_id');
      return res.status(400).json({ error: 'client_id is required' });
    }
    if (!equipment_id) {
      console.error('[REPORTS DEBUG] Missing equipment_id');
      return res.status(400).json({ error: 'equipment_id is required' });
    }
    if (!technician_id) {
      console.error('[REPORTS DEBUG] Missing technician_id');
      return res.status(400).json({ error: 'technician_id is required' });
    }
    
    console.log('[REPORTS DEBUG] All required fields present');
    
    console.log('[REPORTS DEBUG] technician_id:', technician_id);
    console.log('[REPORTS DEBUG] technician_id type:', typeof technician_id);
    
    const id = uuidv4();
    console.log('[REPORTS DEBUG] Generated UUID:', id);
    
    console.log('[REPORTS DEBUG] Preparing to insert into database...');
    
    // Inserir todos os campos
    const [result] = await db.query(
      `INSERT INTO reports (
        id, schedule_id, client_id, equipment_id, technician_id, created_date, service_order_number, 
        report_number, service_type, attendance_date_time, status, technician_edit_count, responsible_person, installation_location,
        installation_location_explanation, local, inadequate_location_reason, equipment_type, manufacturer, model, serial_number, capacity, installation_date,
        installation_type, location_details, environment, access, power_supply_type, breaker, cable_entry_phase,
        cable_entry_neutral, cable_entry_ground, cable_exit_phase, cable_exit_neutral,
        external_battery_positive_cable, external_battery_negative_cable, external_battery_neutral_cable,
        external_battery_connection, external_battery_nobreak_connection, electrical_measurements,
        battery_bank, cooled_environment, external_inspection, internal_inspection,
        attendance_description, diagnosis, conclusion, reported_problems, identified_defects,
        procedures_performed, replaced_parts, parts_request, observations, problems_reported, technical_description,
        client_signature, technician_signature, photos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        schedule_id || null,
        client_id, 
        equipment_id, 
        technician_id, 
        created_date || null,
        service_order_number || null,
        report_number || null,
        service_type || null,
        attendance_date_time || null,
        status || 'draft',
        technician_edit_count || 0,
        responsible_person || '',
        installation_location || '',
        installation_location_explanation || '',
        req.body.local || '',
        req.body.inadequate_location_reason || '',
        req.body.equipment_type || '',
        req.body.manufacturer || '',
        req.body.model || '',
        req.body.serial_number || '',
        req.body.capacity || '',
        req.body.installation_date || null,
        req.body.installation_type || '',
        req.body.location_details || '',
        req.body.environment || '',
        req.body.access || '',
        power_supply_type || '',
        breaker || '',
        cable_entry_phase || '',
        cable_entry_neutral || '',
        cable_entry_ground || '',
        cable_exit_phase || '',
        cable_exit_neutral || '',
        external_battery_positive_cable || '',
        external_battery_negative_cable || '',
        external_battery_neutral_cable || '',
        external_battery_connection || '',
        external_battery_nobreak_connection || '',
        JSON.stringify(electrical_measurements || {}),
        JSON.stringify(battery_bank || {}),
        cooled_environment || '',
        external_inspection || '',
        internal_inspection || '',
        attendance_description || '',
        diagnosis || '',
        conclusion || '',
        reported_problems || '',
        identified_defects || '',
        procedures_performed || '',
        replaced_parts || '',
        parts_request || '',
        observations || '',
        req.body.problems_reported || '',
        req.body.technical_description || '',
        client_signature || '',
        technician_signature || '',
        req.body.photos ? JSON.stringify(req.body.photos) : null
      ]
    );

    console.log('[REPORTS DEBUG] Insert result:', result);
    res.json({ data: { id, ...req.body } });
  } catch (error) {
    console.error('[REPORTS DEBUG] Error creating report:', error);
    console.error('[REPORTS DEBUG] Error message:', error.message);
    console.error('[REPORTS DEBUG] Error code:', error.code);
    console.error('[REPORTS DEBUG] Error stack:', error.stack);
    res.status(500).json({ error: 'Erro ao criar relatório', message: error.message });
  }
});

// PUT /reports/:id - Atualizar relatório (apenas campos enviados)
router.put('/:id', async (req, res) => {
  try {
    console.log('[REPORTS BACKEND DEBUG] PUT /reports/:id called');
    console.log('[REPORTS BACKEND DEBUG] Request params:', req.params);
    console.log('[REPORTS BACKEND DEBUG] Request body keys:', Object.keys(req.body));
    
    // Buscar relatório atual para preservar campos não enviados
    const [existing] = await db.query(`SELECT * FROM reports WHERE id = ?`, [req.params.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    
    const currentReport = existing[0];
    console.log('[REPORTS BACKEND DEBUG] Current report signature fields:', { 
      client_signature: currentReport.client_signature ? 'EXISTS' : 'NULL', 
      technician_signature: currentReport.technician_signature ? 'EXISTS' : 'NULL' 
    });
    
    // Campos que podem ser atualizados
    const updateableFields = [
      'client_id', 'equipment_id', 'technician_id', 
      'client_signature', 'technician_signature',
      'status', 'service_type', 'responsible_person',
      'installation_location', 'installation_location_explanation',
      'power_supply_type', 'breaker',
      'cable_entry_phase', 'cable_entry_neutral', 'cable_entry_ground',
      'cable_exit_phase', 'cable_exit_neutral',
      'external_battery_positive_cable', 'external_battery_negative_cable', 
      'external_battery_neutral_cable', 'external_battery_connection', 
      'external_battery_nobreak_connection',
      'electrical_measurements', 'battery_bank',
      'cooled_environment', 'external_inspection', 'internal_inspection',
      'attendance_description', 'diagnosis', 'conclusion',
      'reported_problems', 'identified_defects', 'procedures_performed',
      'replaced_parts', 'parts_request', 'observations',
      'technician_edit_count'
    ];
    
    // Construir UPDATE dinâmico apenas para campos enviados
    const updates = [];
    const values = [];
    
    for (const field of updateableFields) {
      if (req.body.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        
        // Tratar campos JSON
        if (field === 'electrical_measurements' || field === 'battery_bank') {
          values.push(JSON.stringify(req.body[field] || {}));
        } else if (field === 'status') {
          // Status nunca deve ser null - sempre preservar o valor enviado
          values.push(req.body[field] || 'draft');
        } else {
          // Para assinaturas, se for string vazia, enviar NULL para limpar
          if ((field === 'client_signature' || field === 'technician_signature') && req.body[field] === '') {
            values.push(null);
          } else {
            values.push(req.body[field] || null);
          }
        }
      }
    }
    
    // Se status atual é PENDENTE e não está sendo enviado um novo status, mudar automaticamente para CONCLUIDO
    const hasStatusUpdate = req.body.status === 'CONCLUIDO';
    const currentStatus = (currentReport.status || '').toUpperCase();
    
    console.log('[REPORTS BACKEND DEBUG] Current status:', currentReport.status, 'UPPER:', currentStatus);
    console.log('[REPORTS BACKEND DEBUG] Has status update:', hasStatusUpdate);
    console.log('[REPORTS BACKEND DEBUG] Request body status:', req.body.status);
    
    if (!hasStatusUpdate && currentStatus === 'PENDENTE') {
      updates.push('status = ?');
      values.push('CONCLUIDO');
      console.log('[REPORTS BACKEND DEBUG] Auto-updating status to CONCLUIDO');
    }
    
    if (updates.length === 0) {
      return res.json({ message: 'Nenhum campo para atualizar', data: currentReport });
    }
    
    const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`;
    values.push(req.params.id);
    
    console.log('[REPORTS BACKEND DEBUG] Update query:', query);
    console.log('[REPORTS BACKEND DEBUG] Update values:', values);
    
    await db.query(query, values);
    
    // Buscar relatório atualizado
    const [updated] = await db.query(`SELECT * FROM reports WHERE id = ?`, [req.params.id]);
    
    console.log('[REPORTS BACKEND DEBUG] Updated report signature fields:', { 
      client_signature: updated[0].client_signature ? 'EXISTS' : 'NULL', 
      technician_signature: updated[0].technician_signature ? 'EXISTS' : 'NULL' 
    });
    
    res.json({ data: updated[0] });
  } catch (error) {
    console.error('[REPORTS BACKEND DEBUG] Error updating report:', error);
    res.status(500).json({ error: 'Erro ao atualizar relatório', message: error.message });
  }
});

// PUT /reports/:id/finalize - Finalizar relatório
router.put('/:id/finalize', async (req, res) => {
  try {
    await db.query('UPDATE reports SET status = ? WHERE id = ?', ['CONCLUIDO', req.params.id]);
    res.json({ data: { id: req.params.id, status: 'CONCLUIDO' } });
  } catch (error) {
    console.error('Error finalizing report:', error);
    res.status(500).json({ error: 'Erro ao finalizar relatório' });
  }
});

// DELETE /reports/:id - Deletar relatório
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reports WHERE id = ?', [req.params.id]);
    res.json({ data: { message: 'Relatório deletado com sucesso' } });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Erro ao deletar relatório' });
  }
});

export default router;
