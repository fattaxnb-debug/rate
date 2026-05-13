import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  console.log('[AUTH DEBUG] authenticateToken called');
  const authHeader = req.headers['authorization'];
  console.log('[AUTH DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[AUTH DEBUG] Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('[AUTH DEBUG] No token provided, returning 401');
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'minha_chave_secreta_super_segura_123456789_abc', (err, user) => {
    if (err) {
      console.log('[AUTH DEBUG] Token verification failed:', err.message);
      return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
    console.log('[AUTH DEBUG] Token verified, user:', user);
    req.user = user;
    next();
  });
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    console.log('[AUTH DEBUG] requireRole called for roles:', roles);
    console.log('[AUTH DEBUG] User role:', req.user?.role);
    if (!req.user) {
      console.log('[AUTH DEBUG] No user in request, returning 401');
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      console.log('[AUTH DEBUG] User role not in allowed roles, returning 403');
      return res.status(403).json({ error: 'Permissão negada' });
    }
    console.log('[AUTH DEBUG] Role check passed');
    next();
  };
};
