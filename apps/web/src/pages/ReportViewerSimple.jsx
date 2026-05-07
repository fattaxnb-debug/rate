import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function ReportViewerSimple() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`http://localhost:5000/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setReport(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      toast.error('Erro ao carregar relatório');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:5000/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      toast.success('Relatório excluído com sucesso');
      navigate('/reports');
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast.error('Erro ao excluir relatório');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#f59e0b',
      submitted: '#10b981'
    };
    
    const labels = {
      draft: 'Rascunho',
      submitted: 'Enviado'
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
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <div>Carregando relatório...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <div>Relatório não encontrado</div>
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
              onClick={() => navigate('/reports')}
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
              Visualizar Relatório
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(currentUser?.role === 'Admin' || currentUser?.role === 'Gerente') && (
              <>
                <button
                  onClick={() => navigate(`/reports/${id}/edit`)}
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
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer'
                  }}
                >
                  Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
          {/* Informações Principais */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Número OS</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>
                  {report.service_order_number || 'N/A'}
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Data</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>
                  {report.created_date ? new Date(report.created_date).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Status</h3>
                <div>{getStatusBadge(report.status)}</div>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Técnico</h3>
                <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: 0 }}>
                  {report.technician_name || 'N/A'}
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
                <p style={{ margin: 0 }}>{report.client_name || 'N/A'}</p>
              </div>
              <div>
                <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Contato</h3>
                <p style={{ margin: 0 }}>{report.client_phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Equipamentos */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Equipamentos</h2>
            {report.equipment_reports && report.equipment_reports.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {report.equipment_reports.map((eq, index) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '1rem'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Equipamento</h3>
                        <p style={{ margin: 0 }}>
                          {eq.equipment_name || `${eq.brand || ''} ${eq.model || ''}`.trim() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Tipo</h3>
                        <p style={{ margin: 0 }}>{eq.type || 'N/A'}</p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Marca</h3>
                        <p style={{ margin: 0 }}>{eq.brand || 'N/A'}</p>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Modelo</h3>
                        <p style={{ margin: 0 }}>{eq.model || 'N/A'}</p>
                      </div>
                    </div>
                    {eq.observations && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Observações</h3>
                        <p style={{ margin: 0 }}>{eq.observations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>Nenhum equipamento registrado neste relatório.</p>
            )}
          </div>

          {/* Observações Gerais */}
          {report.observations && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Observações Gerais</h2>
              <div style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{report.observations}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      {deleteDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Confirmar Exclusão
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteDialogOpen(false)}
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
                onClick={handleDelete}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
