import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ImportClientsDialogSimple({ open, onOpenChange, onSuccess }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    try {
      // Simulação de processamento de Excel
      // Na implementação real, você usaria uma biblioteca como xlsx
      const mockData = [
        { name: 'Cliente Teste 1', cnpj_cpf: '12345678901', email: 'cliente1@teste.com', phone: '11999999999' },
        { name: 'Cliente Teste 2', cnpj_cpf: '98765432109', email: 'cliente2@teste.com', phone: '11888888888' }
      ];
      setRows(mockData);
      toast.success('Arquivo processado com sucesso');
    } catch (error) {
      toast.error('Erro ao processar arquivo');
      console.error('Erro ao processar arquivo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error('Nenhum dado para importar');
      return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const promises = rows.map(async (row) => {
        await axios.post('http://localhost:5000/api/clients', row, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      });

      await Promise.all(promises);
      toast.success(`${rows.length} clientes importados com sucesso`);
      
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      toast.error('Erro ao importar clientes');
      console.error('Erro ao importar:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setRows([]);
    if (onOpenChange) onOpenChange(false);
  };

  if (!open) return null;

  return (
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
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Importar Clientes</h2>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0 0' }}>
              Importe clientes de um arquivo Excel
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', flex: 1, overflow: 'auto' }}>
          {!file ? (
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '0.5rem',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Selecione um arquivo Excel
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Arraste um arquivo ou clique para selecionar
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                Selecionar Arquivo
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Arquivo selecionado:</h4>
                <p style={{ color: '#6b7280', margin: 0 }}>{file.name}</p>
              </div>

              {isProcessing ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div>Processando arquivo...</div>
                </div>
              ) : (
                <>
                  {rows.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0' }}>
                        {rows.length} clientes encontrados:
                      </h4>
                      <div style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        overflow: 'hidden'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ backgroundColor: '#f9fafb' }}>
                            <tr>
                              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Nome</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>CNPJ/CPF</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Telefone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row, index) => (
                              <tr key={index}>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{row.name}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{row.cnpj_cpf}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{row.email}</td>
                                <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{row.phone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem'
        }}>
          <button
            onClick={handleClose}
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
          {file && rows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isImporting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: isImporting ? 'not-allowed' : 'pointer'
              }}
            >
              {isImporting ? 'Importando...' : `Importar ${rows.length} clientes`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
