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
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Rota pública - listar médicos (deve vir antes das rotas com parâmetros)
router.get('/doctors/list', getAllDoctors);

// Rotas protegidas - apenas admin
router.post('/patients', protect, isAdmin, createPatient);
router.post('/doctors', protect, isAdmin, createDoctor);
router.get('/', protect, isAdmin, getAllUsers);
router.get('/:id', protect, isAdmin, getUserById);
router.put('/:id', protect, isAdmin, updateUser);
router.delete('/:id', protect, isAdmin, deleteUser);

module.exports = router;
