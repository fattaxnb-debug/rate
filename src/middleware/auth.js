import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  console.log('[AUTH DEBUG] authenticateToken called');
  console.log('[AUTH DEBUG] Request path:', req.path);
  console.log('[AUTH DEBUG] Request method:', req.method);
  const authHeader = req.headers['authorization'];
  console.log('[AUTH DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');
  console.log('[AUTH DEBUG] All headers:', JSON.stringify(req.headers, null, 2));
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('[AUTH DEBUG] Token:', token ? `Present (length: ${token.length})` : 'Missing');
  console.log('[AUTH DEBUG] JWT_SECRET from env:', process.env.JWT_SECRET ? 'Set' : 'Not set');

  if (!token) {
    console.log('[AUTH DEBUG] No token provided, returning 401');
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const secret = process.env.JWT_SECRET || 'minha_chave_secreta_super_segura_123456789_abc';
  console.log('[AUTH DEBUG] Using secret length:', secret.length);

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.log('[AUTH DEBUG] Token verification failed:', err.message);
      console.log('[AUTH DEBUG] Error name:', err.name);
      console.log('[AUTH DEBUG] Error stack:', err.stack);
      return res.status(403).json({ 
        error: 'Token inválido ou expirado',
        details: err.message 
      });
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
