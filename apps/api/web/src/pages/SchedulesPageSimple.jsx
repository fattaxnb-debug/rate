import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { format } from 'date-fns';
import axios from 'axios';

export default function SchedulesPageSimple() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    filterSchedules();
  }, [searchTerm, schedules]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:5000/api/schedules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSchedules(response.data.data);
      setFilteredSchedules(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    if (!searchTerm) {
      setFilteredSchedules(schedules);
      return;
    }

    const filtered = schedules.filter(schedule => 
      schedule.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.technician_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSchedules(filtered);
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:5000/api/schedules/${scheduleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      fetchSchedules();
      alert('Agendamento excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      alert('Erro ao excluir agendamento');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    };
    
    const labels = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };
    
    return (
      <span style={{
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Agendamentos</h1>
        </div>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Agendamentos</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                width: '300px'
              }}
            />
            <button
              onClick={() => navigate('/schedules/new')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {filteredSchedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {searchTerm ? 'Nenhum agendamento encontrado' : 'Nenhum agendamento cadastrado'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro agendamento para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/schedules/new')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Criar Agendamento
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Equipamento</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Data/Hora</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Técnico</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule) => (
                  <tr key={schedule.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>{schedule.client_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{schedule.equipment_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      {schedule.data_hora_agendamento ? 
                        format(new Date(schedule.data_hora_agendamento), 'dd/MM/yyyy HH:mm') : 
                        'N/A'
                      }
                    </td>
                    <td style={{ padding: '1rem' }}>{schedule.technician_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(schedule.status)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Link
                          to={`/schedules/${schedule.id}`}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            fontSize: '0.75rem'
                          }}
                        >
                          Ver
                        </Link>
                        {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente') && (
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
