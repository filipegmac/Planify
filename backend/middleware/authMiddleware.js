const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// Middleware para verificar se o usuário está autenticado
const protect = async (req, res, next) => {
  try {
    let token;

    // Verificar se o token existe no header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Não autorizado, token não encontrado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');

    // Buscar usuário pelo ID do token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(401).json({ message: 'Não autorizado, token inválido' });
  }
};

// Middleware para verificar se o usuário é admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
};

// Middleware para verificar se o usuário é médico
const isDoctor = (req, res, next) => {
  if (req.user && req.user.role === 'doctor') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas médicos.' });
  }
};

// Middleware para verificar se o usuário é paciente
const isPatient = (req, res, next) => {
  if (req.user && req.user.role === 'patient') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas pacientes.' });
  }
};

module.exports = {
  protect,
  isAdmin,
  isDoctor,
  isPatient,
};
