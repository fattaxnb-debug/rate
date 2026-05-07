import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ScheduleViewPageSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:5000/api/schedules/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSchedule(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
      toast.error('Erro ao carregar agendamento');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#10b981',
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <div>Carregando agendamento...</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <div>Agendamento não encontrado</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/schedules')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer'
              }}
            >
              ←
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              Visualizar Agendamento
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente') && (
              <button
                onClick={() => navigate(`/schedules/${id}/edit`)}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
          {/* Informações Principais */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Data e Hora</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>
                  {formatDate(schedule.data_hora_agendamento)}
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</h3>
                <div>{getStatusBadge(schedule.status)}</div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Técnico</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>
                  {schedule.technician_name || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Informações do Cliente</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Nome</h3>
                <p style={{ margin: 0 }}>{schedule.client_name || 'N/A'}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Contato</h3>
                <p style={{ margin: 0 }}>{schedule.client_phone || 'N/A'}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</h3>
                <p style={{ margin: 0 }}>{schedule.client_email || 'N/A'}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>CNPJ/CPF</h3>
                <p style={{ margin: 0 }}>{schedule.client_cnpj_cpf || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Informações do Equipamento */}
          {schedule.equipment_name && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Informações do Equipamento</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Equipamento</h3>
                  <p style={{ margin: 0 }}>{schedule.equipment_name || 'N/A'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Marca</h3>
                  <p style={{ margin: 0 }}>{schedule.equipment_brand || 'N/A'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Modelo</h3>
                  <p style={{ margin: 0 }}>{schedule.equipment_model || 'N/A'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Número de Série</h3>
                  <p style={{ margin: 0 }}>{schedule.equipment_serial_number || 'N/A'}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tipo</h3>
                  <p style={{ margin: 0 }}>{schedule.equipment_type || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Observações */}
          {schedule.observacoes && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Observações</h2>
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{schedule.observacoes}</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'flex-end', 
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => navigate('/schedules')}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Voltar
            </button>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente') && (
              <>
                <button
                  onClick={() => navigate(`/reports/new?scheduleId=${id}`)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Criar Relatório
                </button>
                <button
                  onClick={() => navigate(`/schedules/${id}/edit`)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Editar Agendamento
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
