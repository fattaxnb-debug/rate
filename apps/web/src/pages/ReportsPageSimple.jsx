import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { format } from 'date-fns';
import axios from 'axios';

export default function ReportsPageSimple() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, reports]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:5000/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReports(response.data.data);
      setFilteredReports(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setLoading(false);
    }
  };

  const filterReports = () => {
    if (!searchTerm) {
      setFilteredReports(reports);
      return;
    }

    const filtered = reports.filter(report => 
      report.service_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.technician_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredReports(filtered);
  };

  const handleDelete = async (reportId) => {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`http://localhost:5000/api/reports/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      fetchReports();
      alert('Relatório excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      alert('Erro ao excluir relatório');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: '#f59e0b',
      submitted: '#10b981'
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
        {status === 'draft' ? 'Rascunho' : 'Enviado'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Relatórios</h1>
        </div>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Relatórios</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Buscar relatórios..."
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
              onClick={() => navigate('/reports/new')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Novo Relatório
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '1rem' }}>
              {searchTerm ? 'Nenhum relatório encontrado' : 'Nenhum relatório cadastrado'}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro relatório para começar'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/reports/new')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Criar Relatório
              </button>
            )}
          </div>
        ) : (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>OS</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Cliente</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Data</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Técnico</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>
                      <Link 
                        to={`/reports/${report.id}`}
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                      >
                        {report.service_order_number || 'N/A'}
                      </Link>
                    </td>
                    <td style={{ padding: '1rem' }}>{report.client_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>
                      {report.created_date ? format(new Date(report.created_date), 'dd/MM/yyyy') : 'N/A'}
                    </td>
                    <td style={{ padding: '1rem' }}>{report.technician_name || 'N/A'}</td>
                    <td style={{ padding: '1rem' }}>{getStatusBadge(report.status)}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <Link
                          to={`/reports/${report.id}`}
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
                            onClick={() => handleDelete(report.id)}
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
