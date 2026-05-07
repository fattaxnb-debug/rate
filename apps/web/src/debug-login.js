// Debug do login
import axios from 'axios';

const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fattax.com',
      password: 'admin123'
    });
    
    console.log('Response:', response);
    console.log('Data:', response.data);
    console.log('Data.data:', response.data.data);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error response:', error.response);
  }
};

testLogin();
