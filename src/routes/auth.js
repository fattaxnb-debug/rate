import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /auth/login
router.post('/login', async (req, res) => {
  console.log('POST /auth/login called');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco
    const [users] = await db.query(
      'SELECT id, email, password, name, role FROM users WHERE email = ?',
      [email]
    );

    console.log('Users found:', users.length);

    if (users.length === 0) {
      console.log('User not found');
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = users[0];
    console.log('User found:', user.email);

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'minha_chave_secreta_super_segura_123456789_abc',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Gerar UUID
    const id = uuidv4();

    // Inserir usuário
    const [result] = await db.query(
      'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, hashedPassword, name, role || 'Técnico']
    );

    const newUser = {
      id,
      email,
      name,
      role: role || 'Técnico'
    };

    res.json({ data: newUser });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// GET /users - Listar usuários com filtro opcional por role
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, email, name, role FROM users';
    const params = [];
    
    if (role) {
      query += ' WHERE role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY name ASC';
    
    const [users] = await db.query(query, params);
    res.json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

export default router;
