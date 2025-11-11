const express = require('express');
const router = express.Router();
const {
  getDoctorsBySpecialty,
  getDoctorAvailability,
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getDoctorSchedule,
  cancelAppointment,
  getAppointmentById,
  getAllAppointments,
} = require('../controllers/appointmentController');
const { protect, isAdmin, isDoctor, isPatient } = require('../middleware/authMiddleware');

// Rotas públicas (qualquer usuário autenticado)
router.get('/doctors', protect, getDoctorsBySpecialty); // Listar médicos por especialidade
router.get('/doctors/:doctorId/availability', protect, getDoctorAvailability); // Ver disponibilidade

// Rotas de paciente
router.post('/', protect, isPatient, createAppointment); // Criar agendamento
router.get('/my-appointments', protect, isPatient, getPatientAppointments); // Ver minhas consultas

// Rotas de médico
router.get('/my-schedule', protect, isDoctor, getDoctorAppointments); // Ver agenda do médico (simples)
router.get('/schedule', protect, isDoctor, getDoctorSchedule); // Ver agenda com filtros e estatísticas

// Rotas compartilhadas (paciente e médico)
router.get('/:appointmentId', protect, getAppointmentById); // Ver consulta específica
router.patch('/:appointmentId/cancel', protect, cancelAppointment); // Cancelar consulta

// Rotas de admin
router.get('/all/appointments', protect, isAdmin, getAllAppointments); // Listar todas as consultas

module.exports = router;
