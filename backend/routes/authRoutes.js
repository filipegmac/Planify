const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { createPatient, createDoctor } = require('../controllers/userController');

// Rota de login
router.post('/login', login);

// Rotas públicas de cadastro
router.post('/register/patient', createPatient);
router.post('/register/doctor', createDoctor);

// Rota para obter dados do usuário logado
router.get('/me', protect, getMe);

module.exports = router;
