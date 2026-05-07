import React, { useState } from 'react';
import axios from 'axios';

export default function TestLoginSimple() {
  const [email, setEmail] = useState('admin@fattax.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Testando login com:', { email, password });
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      });
      
      console.log('Login response:', response.data);
      setResult(response.data);
    } catch (err) {
      console.error('Login error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '28rem', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Teste de Login (Simplificado)</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
          />
        </div>
        
        <div>
          <label>Senha:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.25rem' }}
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '0.5rem', 
            backgroundColor: loading ? '#ccc' : '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '0.25rem',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testando...' : 'Testar Login'}
        </button>
        
        {result && (
          <div style={{ padding: '1rem', backgroundColor: '#dcfce7', borderRadius: '0.25rem' }}>
            <h3 style={{ fontWeight: 'bold' }}>✅ Sucesso:</h3>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        {error && (
          <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.25rem' }}>
            <h3 style={{ fontWeight: 'bold' }}>❌ Erro:</h3>
            <pre style={{ fontSize: '0.75rem', overflow: 'auto' }}>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
