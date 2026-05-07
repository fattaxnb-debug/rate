import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ReportFormSimple({ isEdit = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    service_order_number: '',
    client_id: '',
    technician_id: currentUser?.id || '',
    created_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    observations: '',
    equipment_reports: []
  });
  
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    if (isEdit && id) {
      fetchReport();
    }
  }, [isEdit, id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [clientsResponse, equipmentsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/api/equipments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      setClients(clientsResponse.data.data);
      setEquipments(equipmentsResponse.data.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:5000/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const report = response.data.data;
      setFormData({
        service_order_number: report.service_order_number || '',
        client_id: report.client_id || '',
        technician_id: report.technician_id || currentUser?.id || '',
        created_date: report.created_date ? new Date(report.created_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: report.status || 'draft',
        observations: report.observations || '',
        equipment_reports: report.equipment_reports || []
      });
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      const data = {
        ...formData,
        created_date: new Date(formData.created_date).toISOString()
      };

      if (isEdit && id) {
        await axios.put(`http://localhost:5000/api/reports/${id}`, data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Relatório atualizado com sucesso');
      } else {
        await axios.post('http://localhost:5000/api/reports', data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Relatório criado com sucesso');
      }

      navigate('/reports');
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      toast.error('Erro ao salvar relatório');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addEquipmentReport = () => {
    setFormData(prev => ({
      ...prev,
      equipment_reports: [...prev.equipment_reports, {
        equipment_id: '',
        type: '',
        brand: '',
        model: '',
        serial_number: '',
        observations: ''
      }]
    }));
  };

  const updateEquipmentReport = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      equipment_reports: prev.equipment_reports.map((eq, i) =>
        i === index ? { ...eq, [field]: value } : eq
      )
    }));
  };

  const removeEquipmentReport = (index) => {
    setFormData(prev => ({
      ...prev,
      equipment_reports: prev.equipment_reports.filter((_, i) => i !== index)
    }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {isEdit ? 'Editar Relatório' : 'Novo Relatório'}
          </h1>
          <button
            onClick={() => navigate('/reports')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Voltar
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Informações Básicas */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Informações Básicas</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Número OS*</label>
                <input
                  type="text"
                  value={formData.service_order_number}
                  onChange={(e) => handleChange('service_order_number', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  required
                />
              </div>

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
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Data*</label>
                <input
                  type="date"
                  value={formData.created_date}
                  onChange={(e) => handleChange('created_date', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Status*</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                required
              >
                <option value="draft">Rascunho</option>
                <option value="submitted">Enviado</option>
              </select>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Observações</label>
              <textarea
                value={formData.observations}
                onChange={(e) => handleChange('observations', e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                placeholder="Observações gerais sobre o relatório..."
              />
            </div>
          </div>

          {/* Equipamentos */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Equipamentos</h2>
              <button
                type="button"
                onClick={addEquipmentReport}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Adicionar Equipamento
              </button>
            </div>

            {formData.equipment_reports.map((eq, index) => (
              <div key={index} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Equipamento</label>
                    <select
                      value={eq.equipment_id}
                      onChange={(e) => updateEquipmentReport(index, 'equipment_id', e.target.value)}
                      style={{ width: '100%', padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                    >
                      <option value="">Selecione...</option>
                      {equipments.map(equipment => (
                        <option key={equipment.id} value={equipment.id}>
                          {equipment.brand} {equipment.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Tipo</label>
                    <input
                      type="text"
                      value={eq.type}
                      onChange={(e) => updateEquipmentReport(index, 'type', e.target.value)}
                      style={{ width: '100%', padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      placeholder="Tipo"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Marca</label>
                    <input
                      type="text"
                      value={eq.brand}
                      onChange={(e) => updateEquipmentReport(index, 'brand', e.target.value)}
                      style={{ width: '100%', padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      placeholder="Marca"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Modelo</label>
                    <input
                      type="text"
                      value={eq.model}
                      onChange={(e) => updateEquipmentReport(index, 'model', e.target.value)}
                      style={{ width: '100%', padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                      placeholder="Modelo"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeEquipmentReport(index)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.375rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Remover
                  </button>
                </div>

                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Observações do Equipamento</label>
                  <textarea
                    value={eq.observations}
                    onChange={(e) => updateEquipmentReport(index, 'observations', e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: '0.375rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', fontSize: '0.875rem' }}
                    placeholder="Observações sobre este equipamento..."
                  />
                </div>
              </div>
            ))}

            {formData.equipment_reports.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                Nenhum equipamento adicionado. Clique em "Adicionar Equipamento" para começar.
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              style={{
                padding: '0.75rem 1.5rem',
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
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
