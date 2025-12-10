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
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayKey = daysEn[selectedDate.getDay()];
    const dayOfWeek = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });

    // Buscar horários da agenda do médico para esse dia usando chave em inglês
    const schedule = doctor.schedule ? doctor.schedule.get(dayKey) : null;

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

// Visualizar agenda médica com filtros e agrupamento
const getDoctorSchedule = async (req, res) => {
  try {
    // Verificar se o usuário é um médico
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Acesso permitido apenas para médicos' });
    }
    
    const doctorId = req.user.id;
    const { filter = 'month', startDate, endDate, status } = req.query;

    // Definir período de busca
    let dateFilter = {};

    // Função auxiliar para formatar data para o fuso horário local
    const formatDateForDB = (date) => {
      const d = new Date(date);
      // Ajustar para o fuso horário local
      const tzOffset = d.getTimezoneOffset() * 60000; // offset em milissegundos
      const localISOTime = new Date(d - tzOffset).toISOString();
      return new Date(localISOTime);
    };

    if (filter === 'today') {
      // Apenas hoje
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter = { 
        $gte: formatDateForDB(startOfDay), 
        $lte: formatDateForDB(endOfDay) 
      };
    } else if (filter === 'week') {
      // Próximos 7 dias
      const startOfWeek = new Date();
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);
      
      dateFilter = { 
        $gte: formatDateForDB(startOfWeek), 
        $lte: formatDateForDB(endOfWeek) 
      };
    } else if (filter === 'month') {
      // Próximos 30 dias
      const startOfMonth = new Date();
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date();
      endOfMonth.setDate(endOfMonth.getDate() + 30);
      endOfMonth.setHours(23, 59, 59, 999);
      
      dateFilter = { 
        $gte: formatDateForDB(startOfMonth), 
        $lte: formatDateForDB(endOfMonth) 
      };
    } else if (startDate && endDate) {
      // Período personalizado
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      dateFilter = { 
        $gte: formatDateForDB(start), 
        $lte: formatDateForDB(end) 
      };
    }

    // Montar query
    const query = { doctorId };
    if (Object.keys(dateFilter).length > 0) {
      query.appointmentDate = dateFilter;
    }
    if (status) {
      query.status = status;
    }

    // Buscar consultas
    const appointments = await Appointment.find(query)
      .populate('patientId', 'name cpf phone email')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    // Agrupar por data
    const groupedByDate = {};
    appointments.forEach(apt => {
      const dateKey = apt.appointmentDate.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(apt);
    });

    // Calcular estatísticas
    const stats = {
      total: appointments.length,
      confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
      cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
      completed: appointments.filter(apt => apt.status === 'completed').length,
    };

    res.json({
      stats,
      totalAppointments: appointments.length,
      groupedByDate,
      appointments,
    });
  } catch (error) {
    console.error('Erro ao buscar agenda do médico:', error);
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
  getDoctorSchedule,
  cancelAppointment,
  getAppointmentById,
  getAllAppointments,
};
