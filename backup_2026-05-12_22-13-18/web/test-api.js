// Teste simples da API
import { authService } from '@/lib/api.js';

console.log('Testando API...');

// Testar login
authService.login('admin@fattax.com', 'admin123')
  .then(result => {
    console.log('Login OK:', result);
  })
  .catch(error => {
    console.error('Login erro:', error);
  });
