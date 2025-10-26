const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar se o usuário está logado
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar se é mestre
const masterAuth = async (req, res, next) => {
  if (req.user.role !== 'master') {
    return res.status(403).json({ message: 'Acesso negado. Apenas mestres.' });
  }
  next();
};

module.exports = { auth, masterAuth };