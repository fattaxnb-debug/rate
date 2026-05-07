import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

const EQUIPMENT_TYPES = ['Nobreak', 'Estabilizador', 'Transformador', 'IT Médico', 'Monitor de Bateria'];
const BATTERY_TYPES = ['Interno', 'Externo'];
const VOLTAGE_TYPES = ['TRIFÁSICA', 'TRIMONO', 'MONOFÁSICA'];
const BATTERY_CONNECTION_TYPES = ['CABOS', 'BARRAS', 'CABOS E BARRAS'];
const YES_NO = ['Sim', 'Não'];

export default function EquipmentFormSimple({
  equipment,
  onSave,
  onCancel,
  readOnly = false
}) {
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    client_id: '',
    installation_date: '',
    power_va: '',
    voltage_in: '',
    voltage_out: '',
    voltage_battery: '',
    battery_bank_voltage: '',
    battery_type: '',
    battery_quantity: '',
    battery_volts: '',
    battery_current: '',
    battery_connection: '',
    battery_terminal: '',
    battery_brand: '',
    battery_model: '',
    capacity_ah: '',
    symmetric: '',
    isolated: '',
    signalizers_quantity: '',
    ihm: '',
    localizadores: '',
    communication_cable_type: '',
    fixation: '',
    quantity: '',
    voltage_type: ''
  });
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (equipment) {
      const parsedDate = equipment.installation_date ? equipment.installation_date.split(' ')[0].split('T')[0] : '';
      setFormData({
        type: equipment.type || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        client_id: equipment.client_id || '',
        installation_date: parsedDate,
        power_va: equipment.power_va || '',
        voltage_in: equipment.voltage_in || '',
        voltage_out: equipment.voltage_out || '',
        voltage_battery: equipment.voltage_battery || '',
        battery_bank_voltage: equipment.battery_bank_voltage || '',
        battery_type: equipment.battery_type || '',
        battery_quantity: equipment.battery_quantity || '',
        battery_volts: equipment.battery_volts || '',
        battery_current: equipment.battery_current || '',
        battery_connection: equipment.battery_connection || '',
        battery_terminal: equipment.battery_terminal || '',
        battery_brand: equipment.battery_brand || '',
        battery_model: equipment.battery_model || '',
        capacity_ah: equipment.capacity_ah || '',
        symmetric: equipment.symmetric || '',
        isolated: equipment.isolated || '',
        signalizers_quantity: equipment.signalizers_quantity || '',
        ihm: equipment.ihm || '',
        localizadores: equipment.localizadores || '',
        communication_cable_type: equipment.communication_cable_type || '',
        fixation: equipment.fixation || '',
        quantity: equipment.quantity || '',
        voltage_type: equipment.voltage_type || ''
      });
    }
  }, [equipment]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:5000/api/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setClients(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const data = {
        ...formData,
        installation_date: formData.installation_date ? new Date(formData.installation_date).toISOString() : null
      };

      if (equipment) {
        await axios.put(`http://localhost:5000/api/equipments/${equipment.id}`, data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Equipamento atualizado com sucesso');
      } else {
        await axios.post('http://localhost:5000/api/equipments', data, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Equipamento criado com sucesso');
      }

      if (onSave) onSave();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast.error('Erro ao salvar equipamento');
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
        {/* Seção Equipamento - Campos básicos */}
        <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb', marginBottom: '1rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
            🏭 Dados do Equipamento
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tipo*</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                required
              >
                <option value="">Selecione...</option>
                {EQUIPMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Marca*</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Modelo*</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Número de Série*</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => handleChange('serial_number', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Cliente*</label>
              <select
                value={formData.client_id}
                onChange={(e) => handleChange('client_id', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                required
              >
                <option value="">Selecione...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Data de Instalação</label>
              <input
                type="date"
                value={formData.installation_date}
                onChange={(e) => handleChange('installation_date', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Potência (VA)</label>
              <input
                type="number"
                value={formData.power_va}
                onChange={(e) => handleChange('power_va', e.target.value)}
                disabled={readOnly}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
              />
            </div>
          </div>
        </div>

        {/* Seções reorganizadas - uma sobre a outra e alinhadas */}
        
        {/* Seção 1: Características Elétricas */}
        {(formData.type === 'Nobreak' || formData.type === 'Estabilizador' || formData.type === 'Transformador' || formData.type === 'IT Médico') && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              ⚡ Características Elétricas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>TIPO DE TENSÃO *</label>
                <select
                  value={formData.voltage_type}
                  onChange={(e) => handleChange('voltage_type', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">SELECIONE A TENSÃO</option>
                  {VOLTAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tensão de Entrada (VAC)</label>
                <input
                  type="text"
                  value={formData.voltage_in}
                  onChange={(e) => handleChange('voltage_in', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tensão de Saída (VAC)</label>
                <input
                  type="text"
                  value={formData.voltage_out}
                  onChange={(e) => handleChange('voltage_out', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Isolado</label>
                <select
                  value={formData.isolated}
                  onChange={(e) => handleChange('isolated', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Selecione...</option>
                  {YES_NO.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Seção 2: Dados Banco de Baterias */}
        {(formData.type === 'Nobreak' || formData.type === 'Monitor de Bateria') && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              🔋 Dados Banco de Baterias
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tipo de Banco</label>
                <select
                  value={formData.battery_type}
                  onChange={(e) => handleChange('battery_type', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Selecione...</option>
                  {BATTERY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Quantidade de Baterias</label>
                <input
                  type="number"
                  value={formData.battery_quantity}
                  onChange={(e) => handleChange('battery_quantity', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tensão da Bateria (VDC)</label>
                <input
                  type="text"
                  value={formData.voltage_battery}
                  onChange={(e) => handleChange('voltage_battery', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tensão do Banco de Baterias (VDC)</label>
                <input
                  type="text"
                  value={formData.battery_bank_voltage}
                  onChange={(e) => handleChange('battery_bank_voltage', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Capacidade (Ah/W)</label>
                <input
                  type="text"
                  value={formData.capacity_ah}
                  onChange={(e) => handleChange('capacity_ah', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Conexão da Bateria</label>
                <select
                  value={formData.battery_connection}
                  onChange={(e) => handleChange('battery_connection', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Selecione...</option>
                  {BATTERY_CONNECTION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Marca da Bateria</label>
                <input
                  type="text"
                  value={formData.battery_brand}
                  onChange={(e) => handleChange('battery_brand', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Modelo da Bateria</label>
                <input
                  type="text"
                  value={formData.battery_model}
                  onChange={(e) => handleChange('battery_model', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              {/* Campo Simétrico apenas para Nobreak */}
              {formData.type === 'Nobreak' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Simétrico</label>
                  <select
                    value={formData.symmetric}
                    onChange={(e) => handleChange('symmetric', e.target.value)}
                    disabled={readOnly}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                  >
                    <option value="">Selecione...</option>
                    {YES_NO.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Seção 3: Características Adicionais (IT Médico) */}
        {formData.type === 'IT Médico' && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              🏥 Características Adicionais
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>IHM</label>
                <select
                  value={formData.ihm}
                  onChange={(e) => handleChange('ihm', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                >
                  <option value="">Selecione...</option>
                  {YES_NO.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Quantidade de Sinalizadores</label>
                <input
                  type="number"
                  value={formData.signalizers_quantity}
                  onChange={(e) => handleChange('signalizers_quantity', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Seção 4: Configurações do Monitor (Monitor de Bateria) */}
        {formData.type === 'Monitor de Bateria' && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              📊 Configurações do Monitor
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Tipo de Cabo de Comunicação</label>
                <input
                  type="text"
                  value={formData.communication_cable_type}
                  onChange={(e) => handleChange('communication_cable_type', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Fixação</label>
                <input
                  type="text"
                  value={formData.fixation}
                  onChange={(e) => handleChange('fixation', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Localizadores</label>
                <input
                  type="text"
                  value={formData.localizadores}
                  onChange={(e) => handleChange('localizadores', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Seção 5: Especificações do Transformador */}
        {formData.type === 'Transformador' && (
          <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              🔧 Especificações do Transformador
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', color: '#4b5563' }}>Quantidade</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  disabled={readOnly}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: 'white' }}
                />
              </div>
            </div>
          </div>
        )}

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
          {!readOnly && (
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
              {loading ? 'Salvando...' : (equipment ? 'Atualizar' : 'Criar')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
