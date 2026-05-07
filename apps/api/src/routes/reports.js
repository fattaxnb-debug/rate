import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /reports - Listar todos os relatórios
router.get('/', async (req, res) => {
  try {
    const [reports] = await db.query('SELECT * FROM reports ORDER BY created_at DESC');
    res.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Erro ao buscar relatórios' });
  }
});

// GET /reports/:id - Buscar relatório por ID
router.get('/:id', async (req, res) => {
  try {
    const [reports] = await db.query('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }
    res.json({ data: reports[0] });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório' });
  }
});

// POST /reports - Criar novo relatório
router.post('/', async (req, res) => {
  try {
    const { schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, electrical_measurements, battery_bank, signature_client, signature_technician, photos } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO reports (schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, electrical_measurements, battery_bank, signature_client, signature_technician, photos) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, JSON.stringify(electrical_measurements), JSON.stringify(battery_bank), signature_client, signature_technician, JSON.stringify(photos)]
    );

    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Erro ao criar relatório' });
  }
});

// PUT /reports/:id - Atualizar relatório
router.put('/:id', async (req, res) => {
  try {
    const { schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, electrical_measurements, battery_bank, signature_client, signature_technician, photos } = req.body;
    
    await db.query(
      `UPDATE reports SET schedule_id = ?, client_id = ?, equipment_id = ?, technician_id = ?, report_number = ?, service_order_number = ?, attendance_date_time = ?, responsible_person = ?, cooled_environment = ?, installation_location = ?, installation_location_explanation = ?, power_supply_type = ?, breaker = ?, cable_entry_phase = ?, electrical_measurements = ?, battery_bank = ?, signature_client = ?, signature_technician = ?, photos = ?
       WHERE id = ?`,
      [schedule_id, client_id, equipment_id, technician_id, report_number, service_order_number, attendance_date_time, responsible_person, cooled_environment, installation_location, installation_location_explanation, power_supply_type, breaker, cable_entry_phase, JSON.stringify(electrical_measurements), JSON.stringify(battery_bank), signature_client, signature_technician, JSON.stringify(photos), req.params.id]
    );

    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Erro ao atualizar relatório' });
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
