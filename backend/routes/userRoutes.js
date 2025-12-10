const express = require('express');
const router = express.Router();
const {
  createPatient,
  createDoctor,
  getAllUsers,
  getAllDoctors,
  getUserById,
  updateUser,
  deleteUser,
  getMySchedule,
  updateMySchedule,
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Rota pública - listar médicos (deve vir antes das rotas com parâmetros)
router.get('/doctors/list', getAllDoctors);

// Rotas de cadastro público (self-registration)
router.post('/patients', createPatient);
router.post('/doctors', createDoctor);

// Rotas para o próprio médico gerenciar sua agenda
router.get('/me/schedule', protect, getMySchedule);
router.put('/me/schedule', protect, updateMySchedule);

// Rotas protegidas - apenas admin para gestão de usuários
router.get('/', protect, isAdmin, getAllUsers);
router.get('/:id', protect, isAdmin, getUserById);
router.put('/:id', protect, isAdmin, updateUser);
router.delete('/:id', protect, isAdmin, deleteUser);

module.exports = router;
