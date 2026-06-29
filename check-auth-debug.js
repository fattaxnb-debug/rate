import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== JWT Authentication Debug Script ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (length: ' + process.env.JWT_SECRET.length + ')' : 'NOT SET');
console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || 'Not set (default: 7d)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');

// Test token generation
const testUser = {
  userId: 'test-user-id',
  email: 'test@example.com',
  role: 'Técnico'
};

const secret = process.env.JWT_SECRET || 'minha_chave_secreta_super_segura_123456789_abc';
console.log('\nUsing secret:', secret.substring(0, 10) + '...' + secret.substring(secret.length - 5));

try {
  const token = jwt.sign(testUser, secret, { expiresIn: '7d' });
  console.log('\nGenerated token (first 50 chars):', token.substring(0, 50) + '...');
  console.log('Token length:', token.length);
  
  // Test token verification
  console.log('\nVerifying token...');
  const decoded = jwt.verify(token, secret);
  console.log('Token verified successfully!');
  console.log('Decoded user:', decoded);
  
  // Test expired token
  console.log('\nTesting expired token...');
  const expiredToken = jwt.sign(testUser, secret, { expiresIn: '-1s' });
  try {
    jwt.verify(expiredToken, secret);
    console.log('ERROR: Expired token should have failed verification');
  } catch (err) {
    console.log('Expired token correctly rejected:', err.message);
  }
  
  // Test wrong secret
  console.log('\nTesting wrong secret...');
  try {
    jwt.verify(token, 'wrong_secret');
    console.log('ERROR: Token with wrong secret should have failed verification');
  } catch (err) {
    console.log('Token with wrong secret correctly rejected:', err.message);
  }
  
} catch (error) {
  console.error('Error during token test:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n=== Debug Script Complete ===');
