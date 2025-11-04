const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rota de login
router.post('/login', login);

// Rota para obter dados do usuário logado
router.get('/me', protect, getMe);

module.exports = router;
