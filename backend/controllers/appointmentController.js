const Appointment = require('../models/AppointmentModel');
const User = require('../models/UserModel');

// Listar médicos por especialidade
const getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;

    // Buscar médicos
    const query = { role: 'doctor' };
    if (specialty) {
      query.specialty = { $regex: specialty, $options: 'i' }; // Busca case-insensitive
    }

    const doctors = await User.find(query).select('-password');

    res.json({
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter horários disponíveis de um médico em uma data específica
const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Formato: YYYY-MM-DD

    // Validar data
    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    // Buscar médico
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    // Converter data para objeto Date
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });

    // Buscar horários da agenda do médico para esse dia
    const schedule = doctor.schedule ? doctor.schedule.get(dayOfWeek) : null;

    if (!schedule || schedule.length === 0) {
      return res.json({
        message: 'Médico não atende neste dia',
        availableSlots: [],
      });
    }

    // Buscar consultas já agendadas para esse dia
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }, // Não considerar canceladas
    });

    // Criar lista de horários ocupados
    const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);

    // Gerar slots disponíveis baseado na agenda do médico
    const availableSlots = [];
    
    schedule.forEach(period => {
      const slots = generateTimeSlots(period.startTime, period.endTime, 30); // 30 minutos por consulta
      slots.forEach(slot => {
        availableSlots.push({
          time: slot,
          available: !bookedTimes.includes(slot),
        });
      });
    });

    res.json({
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialty: doctor.specialty,
      },
      date,
      dayOfWeek,
      availableSlots,
    });
  } catch (error) {
    console.error('Erro ao buscar disponibilidade:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Função auxiliar para gerar slots de horário
const generateTimeSlots = (startTime, endTime, intervalMinutes) => {
  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentHour = startHour;
  let currentMin = startMin;

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeSlot);

    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  return slots;
};

// Criar agendamento (paciente)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, notes } = req.body;
    const patientId = req.user.id;

    // Validações básicas
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ 
        message: 'Médico, data e horário são obrigatórios' 
      });
    }

    // Verificar se o médico existe
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }

    // Verificar se o horário já está ocupado
    const dateObj = new Date(appointmentDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime,
      status: { $ne: 'cancelled' },
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        message: 'Este horário já está ocupado' 
      });
    }

    // Verificar se o paciente já tem consulta neste dia/horário
    const patientConflict = await Appointment.findOne({
      patientId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime,
      status: { $ne: 'cancelled' },
    });

    if (patientConflict) {
      return res.status(400).json({ 
        message: 'Você já tem uma consulta agendada neste horário' 
      });
    }

    // Criar agendamento
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate: dateObj,
      appointmentTime,
      notes,
      status: 'confirmed',
    });

    // Buscar dados completos
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name email phone cpf')
      .populate('doctorId', 'name email specialty crm');

    res.status(201).json({
      message: 'Consulta agendada com sucesso',
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Listar consultas do paciente
const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'name specialty crm phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Erro ao buscar consultas do paciente:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Listar consultas do médico
const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const appointments = await Appointment.find({ doctorId })
      .populate('patientId', 'name cpf phone email birthDate')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Erro ao buscar consultas do médico:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Cancelar consulta (paciente)
const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    // Buscar consulta
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Consulta não encontrada' });
    }

    // Verificar se o usuário é o paciente ou o médico da consulta
    const isPatient = appointment.patientId.toString() === userId;
    const isDoctor = appointment.doctorId.toString() === userId;

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ 
        message: 'Você não tem permissão para cancelar esta consulta' 
      });
    }

    // Verificar se já está cancelada
    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Consulta já foi cancelada' });
    }

    // Cancelar consulta
    appointment.status = 'cancelled';
    await appointment.save();

    res.json({
      message: 'Consulta cancelada com sucesso',
      appointment,
    });
  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Buscar consulta por ID
const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email phone cpf birthDate')
      .populate('doctorId', 'name email specialty crm phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Consulta não encontrada' });
    }

    // Verificar permissão
    const isPatient = appointment.patientId._id.toString() === userId;
    const isDoctor = appointment.doctorId._id.toString() === userId;

    if (!isPatient && !isDoctor && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Você não tem permissão para ver esta consulta' 
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Erro ao buscar consulta:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Listar todas as consultas (admin)
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'name email phone cpf')
      .populate('doctorId', 'name email specialty crm')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.json({
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error('Erro ao listar todas as consultas:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

module.exports = {
  getDoctorsBySpecialty,
  getDoctorAvailability,
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  getAppointmentById,
  getAllAppointments,
};
