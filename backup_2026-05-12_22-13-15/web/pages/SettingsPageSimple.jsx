import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function SettingsPageSimple() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    company_name: '',
    company_cnpj: '',
    company_phone: '',
    company_email: '',
    company_address: '',
    company_logo: '',
    report_header: '',
    report_footer: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:5000/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.data && response.data.data.length > 0) {
        const settingsData = response.data.data[0];
        setSettings(settingsData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (settings.id) {
        await axios.put(`http://localhost:5000/api/settings/${settings.id}`, settings, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.post('http://localhost:5000/api/settings', settings, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      toast.success('Configurações salvas com sucesso');
      fetchSettings(); // Recarregar para pegar o ID se for novo
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('company_logo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
        <div>Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
          Configurações do Sistema
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: '2rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Informações da Empresa */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Informações da Empresa
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                  Nome da Empresa*
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                  CNPJ
                </label>
                <input
                  type="text"
                  value={settings.company_cnpj}
                  onChange={(e) => handleChange('company_cnpj', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                  Telefone
                </label>
                <input
                  type="tel"
                  value={settings.company_phone}
                  onChange={(e) => handleChange('company_phone', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  placeholder="(00) 0000-0000"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={settings.company_email}
                  onChange={(e) => handleChange('company_email', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  placeholder="email@empresa.com"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Endereço
              </label>
              <input
                type="text"
                value={settings.company_address}
                onChange={(e) => handleChange('company_address', e.target.value)}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                placeholder="Rua, Número - Bairro, Cidade/UF"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Logo da Empresa
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  Selecionar Logo
                </label>
                {settings.company_logo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                      src={settings.company_logo}
                      alt="Logo"
                      style={{ height: '40px', maxWidth: '150px', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleChange('company_logo', '')}
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
                      Remover
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configurações de Relatórios */}
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Configurações de Relatórios
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Cabeçalho do Relatório
              </label>
              <textarea
                value={settings.report_header}
                onChange={(e) => handleChange('report_header', e.target.value)}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.375rem',
                  resize: 'vertical'
                }}
                placeholder="Texto que aparecerá no cabeçalho de todos os relatórios..."
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                Rodapé do Relatório
              </label>
              <textarea
                value={settings.report_footer}
                onChange={(e) => handleChange('report_footer', e.target.value)}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.375rem',
                  resize: 'vertical'
                }}
                placeholder="Texto que aparecerá no rodapé de todos os relatórios..."
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => window.history.back()}
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
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
