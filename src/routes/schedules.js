import express from 'express';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('=== GET /schedules called ===');
  try {
    const [schedules] = await db.query(`
      SELECT s.*, 
             c.name as client_name,
             u.name as technician_name,
             e.type as equipment_type,
             e.brand as equipment_brand,
             e.model as equipment_model,
             e.serial_number as equipment_serial,
             e.power_va as equipment_power,
             e.voltage_in as equipment_voltage_in,
             e.voltage_out as equipment_voltage_out
      FROM schedules s 
      LEFT JOIN clients c ON s.client_id = c.id 
      LEFT JOIN users u ON s.technician_id = u.id
      LEFT JOIN equipments e ON s.equipment_id = e.id
      ORDER BY s.scheduled_date DESC
    `);
    console.log('=== Schedules fetched successfully ===');
    console.log('=== Schedules count:', schedules.length, '===');
    console.log('=== Raw schedules data:', JSON.stringify(schedules, null, 2));
    
    // Formatar data_hora_agendamento para o frontend
    const formattedSchedules = schedules.map(schedule => {
      let scheduled_date = null;
      let scheduled_time = null;
      
      console.log('Processing schedule:', schedule.id, 'scheduled_date raw:', schedule.scheduled_date, 'scheduled_time raw:', schedule.scheduled_time, 'type:', typeof schedule.scheduled_time);
      
      // Usar scheduled_time diretamente se estiver disponível
      if (schedule.scheduled_time) {
        scheduled_time = schedule.scheduled_time.substring(0, 5); // HH:MM
        console.log('Using scheduled_time from DB:', scheduled_time);
      }
      
      if (schedule.scheduled_date) {
        // Converter datetime do MySQL (YYYY-MM-DD) para formato correto
        let dateStr = schedule.scheduled_date;
        
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          scheduled_date = `${year}-${month}-${day}`;
        } else if (typeof dateStr !== 'string') {
          dateStr = String(dateStr);
        }
        
        // Se for datetime MySQL (YYYY-MM-DD HH:mm:ss), separar data e hora
        if (typeof dateStr === 'string' && dateStr.includes(' ')) {
          const [datePart, timePart] = dateStr.split(' ');
          scheduled_date = datePart;
          if (!scheduled_time && timePart) {
            const [hour, minute] = timePart.split(':').slice(0, 2);
            scheduled_time = `${hour}:${minute}`;
            console.log('Extracted time from datetime:', scheduled_time);
          }
        } else if (typeof dateStr === 'string' && !dateStr.includes('T')) {
          // Se for apenas data (YYYY-MM-DD)
          scheduled_date = dateStr;
        }
      }
      
      console.log('Final scheduled_time:', scheduled_time);
      
      console.log('Processed schedule:', schedule.id, 'scheduled_date:', scheduled_date, 'scheduled_time:', scheduled_time, 'status:', schedule.status, 'technician_id:', schedule.technician_id);
      
      // Garantir que status tenha um valor padrão
      const status = schedule.status || 'pending';
      
      return {
        ...schedule,
        scheduled_date,
        scheduled_time,
        status
      };
    });
    
    console.log('=== Formatted schedules data:', JSON.stringify(formattedSchedules, null, 2));
    
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
             u.name as technician_name,
             e.type as equipment_type,
             e.brand as equipment_brand,
             e.model as equipment_model,
             e.serial_number as equipment_serial,
             e.power_va as equipment_power,
             e.voltage_in as equipment_voltage_in,
             e.voltage_out as equipment_voltage_out
      FROM schedules s 
      LEFT JOIN clients c ON s.client_id = c.id 
      LEFT JOIN users u ON s.technician_id = u.id
      LEFT JOIN equipments e ON s.equipment_id = e.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (schedules.length === 0) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const schedule = schedules[0];
    
    // Formatar data_hora_agendamento para o frontend
    const formattedSchedules = schedules.map(schedule => {
      let scheduled_date = null;
      let scheduled_time = null;
      
      console.log('Processing schedule:', schedule.id, 'scheduled_date raw:', schedule.scheduled_date, 'scheduled_time raw:', schedule.scheduled_time);
      
      // Usar scheduled_time diretamente se estiver disponível
      if (schedule.scheduled_time) {
        scheduled_time = schedule.scheduled_time.substring(0, 5); // HH:MM
      }
      
      if (schedule.scheduled_date) {
        // Converter datetime do MySQL (YYYY-MM-DD) para formato correto
        let dateStr = schedule.scheduled_date;
        
        if (dateStr instanceof Date) {
          const year = dateStr.getFullYear();
          const month = String(dateStr.getMonth() + 1).padStart(2, '0');
          const day = String(dateStr.getDate()).padStart(2, '0');
          scheduled_date = `${year}-${month}-${day}`;
        } else if (typeof dateStr !== 'string') {
          dateStr = String(dateStr);
        }
        
        // Se for datetime MySQL (YYYY-MM-DD HH:mm:ss), separar data e hora
        if (typeof dateStr === 'string' && dateStr.includes(' ')) {
          const [datePart, timePart] = dateStr.split(' ');
          scheduled_date = datePart;
          if (!scheduled_time && timePart) {
            const [hour, minute] = timePart.split(':').slice(0, 2);
            scheduled_time = `${hour}:${minute}`;
          }
        } else if (typeof dateStr === 'string' && !dateStr.includes('T')) {
          // Se for apenas data (YYYY-MM-DD)
          scheduled_date = dateStr;
        }
      }
      
      console.log('Processed schedule:', schedule.id, 'scheduled_date:', scheduled_date, 'scheduled_time:', scheduled_time, 'status:', schedule.status, 'technician_id:', schedule.technician_id);
      
      // Garantir que status tenha um valor padrão
      const status = schedule.status || 'pending';
      
      return {
        ...schedule,
        scheduled_date,
        scheduled_time,
        status
      };
    });
    
    console.log('=== Formatted schedules data:', JSON.stringify(formattedSchedules, null, 2));
    
    res.json({ data: formattedSchedules[0] });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Erro ao buscar agendamento' });
  }
});

// POST /schedules - Criar novo agendamento
router.post('/', async (req, res) => {
  console.log('=== POST /schedules called ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { client_id, equipment_id, technician_id, scheduled_date, scheduled_time, service_type, status, notes, address, city, contact_name, contact_phone } = req.body;
    
    console.log('Extracted fields:', { client_id, equipment_id, technician_id, scheduled_date, scheduled_time });
    
    // client_id e scheduled_date são obrigatórios
    if (!client_id || !scheduled_date) {
      return res.status(400).json({ error: 'client_id e scheduled_date são obrigatórios' });
    }
    
    const id = uuidv4();
    
    // Formatar scheduled_time para incluir segundos se necessário
    const formattedTime = scheduled_time && scheduled_time.length === 5 ? `${scheduled_time}:00` : scheduled_time;
    
    const sql = `INSERT INTO schedules (id, client_id, equipment_id, technician_id, scheduled_date, scheduled_time, service_type, status, notes, address, city, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    console.log('SQL:', sql);
    console.log('Values:', [id, client_id, equipment_id, technician_id, scheduled_date, formattedTime, service_type, status || 'pending', notes, address, city, contact_name, contact_phone]);
    
    const [result] = await db.query(sql, [id, client_id, equipment_id, technician_id, scheduled_date, formattedTime, service_type, status || 'pending', notes, address, city, contact_name, contact_phone]);

    res.json({ data: { id, ...req.body } });
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
    
    // Formatar scheduled_time para incluir segundos se necessário
    const formattedTime = scheduled_time && scheduled_time.length === 5 ? `${scheduled_time}:00` : scheduled_time;
    
    await db.query(
      `UPDATE schedules SET client_id = ?, equipment_id = ?, technician_id = ?, scheduled_date = ?, scheduled_time = ?, service_type = ?, status = ?, notes = ?, address = ?, city = ?, contact_name = ?, contact_phone = ?
       WHERE id = ?`,
      [client_id, equipment_id, technician_id, scheduled_date, formattedTime, service_type, status, notes, address, city, contact_name, contact_phone, req.params.id]
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
