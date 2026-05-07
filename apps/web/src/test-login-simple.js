// Teste simples de login
import axios from 'axios';

const testLogin = async () => {
  console.log('Iniciando teste de login...');
  
  try {
    console.log('Enviando requisição para:', 'http://localhost:5000/api/auth/login');
    console.log('Dados:', { email: 'admin@fattax.com', password: 'admin123' });
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fattax.com',
      password: 'admin123'
    });
    
    console.log('✅ Sucesso!');
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no login:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
};

testLogin();
