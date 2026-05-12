import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// GET /technicians - Listar todos os técnicos
router.get('/technicians', async (req, res) => {
  try {
    const [technicians] = await db.query('SELECT id, name, email FROM users WHERE role IN ("Técnico", "technician") ORDER BY name ASC');
    res.json({ data: technicians });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({ error: 'Erro ao buscar técnicos' });
  }
});

// GET /schedules - Listar todos os agendamentos
router.get('/', async (req, res) => {
  try {
    const [schedules] = await db.query(`
      SELECT s.*, 
             c.name as client_name,
             u.name as technician_name
      FROM schedules s 
      LEFT JOIN clients c ON s.client_id = c.id 
      LEFT JOIN users u ON s.technician_id = u.id
      ORDER BY s.scheduled_date DESC
    `);
    
    console.log('Schedules from DB:', schedules[0]);
    
    // Formatar data_hora_agendamento para o frontend
    const formattedSchedules = schedules.map(schedule => {
      let data_hora_agendamento = null;
      if (schedule.scheduled_date) {
        let dateStr = schedule.scheduled_date;
        let timeStr = schedule.scheduled_time || '00:00';
        
        // Se dateStr for um objeto Date, converter para string YYYY-MM-DD
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr !== 'string') {
          dateStr = String(dateStr);
        }
        
        // Formatar para ISO string combinando data e hora
        const [year, month, day] = dateStr.split('-');
        const [hour, minute] = timeStr.split(':').slice(0, 2);
        data_hora_agendamento = `${year}-${month}-${day}T${hour}:${minute}:00`;
      }
      
      // Garantir que status tenha um valor padrão
      const status = schedule.status || 'pending';
      
      return {
        ...schedule,
        data_hora_agendamento,
        status
      };
    });
    
    res.json({ data: formattedSchedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// GET /schedules/:id - Buscar agendamento por ID
router.get('/:id', async (req, res) => {
  try {
    const [schedules] = await db.query(`
      SELECT s.*, 
             c.name as client_name,
             c.cnpj_cpf as client_cnpj_cpf,
             c.phone as client_phone,
             c.mobile as client_mobile,
             c.email as client_email,
             c.address as client_address,
             c.number as client_number,
             c.neighborhood as client_neighborhood,
             c.city as client_city,
             c.state as client_state,
             c.technical_contact as client_technical_contact,
             u.name as technician_name
      FROM schedules s 
      LEFT JOIN clients c ON s.client_id = c.id 
      LEFT JOIN users u ON s.technician_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (schedules.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const schedule = schedules[0];
    
    // Formatar data_hora_agendamento para o frontend
    const formattedSchedules = schedules.map(schedule => {
      let data_hora_agendamento = null;
      if (schedule.scheduled_date) {
        let dateStr = schedule.scheduled_date;
        let timeStr = schedule.scheduled_time || '00:00';
        
        // Se dateStr for um objeto Date, converter para string YYYY-MM-DD
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        } else if (typeof dateStr !== 'string') {
          dateStr = String(dateStr);
        }
        
        // Formatar para ISO string combinando data e hora
        const [year, month, day] = dateStr.split('-');
        const [hour, minute] = timeStr.split(':').slice(0, 2);
        data_hora_agendamento = `${year}-${month}-${day}T${hour}:${minute}:00`;
      }
      
      // Garantir que status tenha um valor padrão
      const status = schedule.status || 'pending';
      
      return {
        ...schedule,
        data_hora_agendamento,
        status
      };
    });
    
    res.json({ data: formattedSchedules[0] });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

// POST /schedules - Criar novo agendamento
router.post('/', async (req, res) => {
  console.log('POST /schedules called');
  console.log('Request body:', req.body);
  try {
    const { client_id, equipment_id, technician_id, data_hora_agendamento, scheduled_date, scheduled_time, service_type, status, notes, address, city, contact_name, contact_phone } = req.body;
    
    const allowedFields = ['client_id', 'equipment_id', 'technician_id', 'scheduled_date', 'scheduled_time', 'service_type', 'status', 'notes', 'address', 'city', 'contact_name', 'contact_phone'];
    
    // Se data_hora_agendamento foi enviado, extrair date e time
    let finalScheduledDate = scheduled_date;
    let finalScheduledTime = scheduled_time;
    
    if (data_hora_agendamento) {
      // Extrair date e time diretamente da string ISO para evitar problemas de timezone
      if (typeof data_hora_agendamento === 'string' && data_hora_agendamento.includes('T')) {
        const [datePart, timePart] = data_hora_agendamento.split('T');
        finalScheduledDate = datePart;
        finalScheduledTime = timePart.split(':')[0] + ':' + timePart.split(':')[1];
      } else {
        const dateObj = new Date(data_hora_agendamento);
        finalScheduledDate = dateObj.toISOString().split('T')[0];
        finalScheduledTime = dateObj.toTimeString().split(' ')[0].slice(0, 5);
      }
    }
    
    const fields = [];
    const values = [];
    const placeholders = [];
    
    const fieldValues = {
      client_id: req.body.client_id,
      equipment_id: req.body.equipment_id,
      technician_id: req.body.technician_id,
      scheduled_date: finalScheduledDate,
      scheduled_time: finalScheduledTime,
      service_type: req.body.service_type,
      status: req.body.status || 'pending',
      notes: req.body.notes,
      address: req.body.address,
      city: req.body.city,
      contact_name: req.body.contact_name,
      contact_phone: req.body.contact_phone
    };
    
    for (const field of allowedFields) {
      if (fieldValues[field] !== undefined && fieldValues[field] !== '') {
        fields.push(field);
        values.push(fieldValues[field]);
        placeholders.push('?');
      }
    }
    
    // client_id e scheduled_date são obrigatórios
    if (!req.body.client_id || !finalScheduledDate) {
      return res.status(400).json({ error: 'client_id e scheduled_date são obrigatórios' });
    }
    
    const sql = `INSERT INTO schedules (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    console.log('SQL:', sql);
    console.log('Values:', values);
    
    const [result] = await db.query(sql, values);

    res.json({ data: { id: result.insertId, ...req.body } });
  } catch (error) {
    console.error('Error creating schedule:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: 'Erro ao criar agendamento', message: error.message });
  }
});

// PUT /schedules/:id - Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { client_id, equipment_id, technician_id, scheduled_date, scheduled_time, service_type, status, notes, address, city, contact_name, contact_phone } = req.body;
    
    await db.query(
      `UPDATE schedules SET client_id = ?, equipment_id = ?, technician_id = ?, scheduled_date = ?, scheduled_time = ?, service_type = ?, status = ?, notes = ?, address = ?, city = ?, contact_name = ?, contact_phone = ?
       WHERE id = ?`,
      [client_id, equipment_id, technician_id, scheduled_date, scheduled_time, service_type, status, notes, address, city, contact_name, contact_phone, req.params.id]
    );

    res.json({ data: { id: req.params.id, ...req.body } });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// DELETE /schedules/:id - Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
    res.json({ data: { message: 'Agendamento deletado com sucesso' } });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

export default router;
