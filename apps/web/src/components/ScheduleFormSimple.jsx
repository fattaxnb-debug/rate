import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function ScheduleFormSimple({ schedule, onSave, onCancel }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    client_id: '',
    equipment_id: '',
    technician_id: currentUser?.id || '',
    data_hora_agendamento: '',
    status: 'pending',
    observacoes: ''
  });
  
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (schedule) {
      setFormData({
        client_id: schedule.client_id || '',
        equipment_id: schedule.equipment_id || '',
        technician_id: schedule.technician_id || currentUser?.id || '',
        data_hora_agendamento: schedule.data_hora_agendamento ? new Date(schedule.data_hora_agendamento).toISOString().slice(0, 16) : '',
        status: schedule.status || 'pending',
        observacoes: schedule.observacoes || ''
      });
    }
  }, [schedule, currentUser]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      console.log('Carregando dados...');
      
      const [clientsResponse, equipmentsResponse, techniciansResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/equipments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      console.log('Clientes:', clientsResponse.data.data);
      console.log('Equipamentos:', equipmentsResponse.data.data);
      console.log('Técnicos:', techniciansResponse.data.data);
      
      setClients(clientsResponse.data.data);
      setEquipments(equipmentsResponse.data.data);
      setTechnicians(techniciansResponse.data.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do formulário');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const data = {
        client_id: formData.client_id,
        equipment_id: formData.equipment_id,
        technician_id: formData.technician_id,
        scheduled_date: formData.data_hora_agendamento ? new Date(formData.data_hora_agendamento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        scheduled_time: formData.data_hora_agendamento ? new Date(formData.data_hora_agendamento).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5),
        service_type: 'Manutenção',
        status: formData.status,
        observacoes: formData.observacoes
      };

      if (schedule) {
        await axios.put(`http://localhost:5000/api/schedules/${schedule.id}`, data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Agendamento atualizado com sucesso');
      } else {
        await axios.post('http://localhost:5000/api/schedules', data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Agendamento criado com sucesso');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Cliente*</label>
            <select
              value={formData.client_id}
              onChange={(e) => handleChange('client_id', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            >
              <option value="">Selecione...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Equipamento*</label>
            <select
              value={formData.equipment_id}
              onChange={(e) => handleChange('equipment_id', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            >
              <option value="">Selecione...</option>
              {equipments.map(equipment => (
                <option key={equipment.id} value={equipment.id}>
                  {equipment.brand} {equipment.model} - {equipment.serial_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Técnico Responsável*</label>
            <select
              value={formData.technician_id}
              onChange={(e) => handleChange('technician_id', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            >
              <option value="">Selecione...</option>
              {technicians.map(technician => (
                <option key={technician.id} value={technician.id}>{technician.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Status*</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              required
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status === 'pending' ? 'Pendente' : 
                   status === 'confirmed' ? 'Confirmado' : 
                   status === 'completed' ? 'Concluído' : 'Cancelado'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Observações</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
            placeholder="Observações sobre o agendamento..."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Salvando...' : (schedule ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </form>
    </div>
  );
}
