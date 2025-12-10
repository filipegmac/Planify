const User = require('../models/UserModel');

// Cadastrar paciente (apenas admin)
const createPatient = async (req, res) => {
  try {
    const { name, email, password, cpf, phone, birthDate, address } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
    }

    // Verificar se o email já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Verificar se CPF já existe (se fornecido)
    if (cpf) {
      const cpfExists = await User.findOne({ cpf });
      if (cpfExists) {
        return res.status(400).json({ message: 'CPF já cadastrado' });
      }
    }

    // Criar paciente
    const patient = await User.create({
      name,
      email,
      password,
      role: 'patient',
      cpf,
      phone,
      birthDate,
      address,
    });

    res.status(201).json({
      message: 'Paciente cadastrado com sucesso',
      patient: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        role: patient.role,
        cpf: patient.cpf,
        phone: patient.phone,
        birthDate: patient.birthDate,
      }
    });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Atualizar agenda do médico logado
const updateMySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { schedule } = req.body;

    if (!schedule || typeof schedule !== 'object') {
      return res.status(400).json({ message: 'Agenda inválida' });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Apenas médicos podem atualizar a própria agenda' });
    }

    // Garantir que schedule seja um Map do Mongoose
    if (!user.schedule || typeof user.schedule.set !== 'function') {
      user.schedule = new Map();
    } else {
      // Limpar agenda anterior para evitar lixo
      user.schedule.clear();
    }

    // Preencher agenda com os dias e períodos enviados
    Object.entries(schedule).forEach(([day, periods]) => {
      if (Array.isArray(periods) && periods.length > 0) {
        user.schedule.set(
          day,
          periods.map((p) => ({
            startTime: p.startTime,
            endTime: p.endTime,
          }))
        );
      }
    });

    user.markModified('schedule');
    await user.save();

    // Converter para objeto simples na resposta
    let savedSchedule = user.schedule;
    if (savedSchedule && typeof savedSchedule.toObject === 'function') {
      savedSchedule = savedSchedule.toObject();
    } else if (savedSchedule instanceof Map) {
      savedSchedule = Object.fromEntries(savedSchedule);
    }

    res.json({
      message: 'Agenda atualizada com sucesso',
      schedule: savedSchedule,
    });
  } catch (error) {
    console.error('Erro ao atualizar agenda do médico:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Obter agenda do médico logado
const getMySchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user || user.role !== 'doctor') {
      return res.status(403).json({ message: 'Apenas médicos podem ver a própria agenda' });
    }

    let schedule = user.schedule || {};

    if (schedule && typeof schedule.toObject === 'function') {
      schedule = schedule.toObject();
    } else if (schedule instanceof Map) {
      schedule = Object.fromEntries(schedule);
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Erro ao obter agenda do médico:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Cadastrar médico (apenas admin)
const createDoctor = async (req, res) => {
  try {
    const { name, email, password, crm, specialty, phone, schedule } = req.body;

    // Validação básica
    if (!name || !email || !password || !crm || !specialty) {
      return res.status(400).json({ 
        message: 'Nome, email, senha, CRM e especialidade são obrigatórios' 
      });
    }

    // Verificar se o email já existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Verificar se CRM já existe
    const crmExists = await User.findOne({ crm });
    if (crmExists) {
      return res.status(400).json({ message: 'CRM já cadastrado' });
    }

    // Criar médico
    const doctor = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      crm,
      specialty,
      phone,
      schedule,
    });

    res.status(201).json({
      message: 'Médico cadastrado com sucesso',
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        crm: doctor.crm,
        specialty: doctor.specialty,
        phone: doctor.phone,
      }
    });
  } catch (error) {
    console.error('Erro ao criar médico:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Listar todos os usuários (apenas admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Listar todos os médicos
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    
    res.json({
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error('Erro ao listar médicos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Buscar usuário por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Editar usuário (apenas admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Buscar usuário
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Validar alterações de email
    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({ email: updates.email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    // Validar alterações de CPF (para pacientes)
    if (updates.cpf && updates.cpf !== user.cpf) {
      const cpfExists = await User.findOne({ cpf: updates.cpf });
      if (cpfExists) {
        return res.status(400).json({ message: 'CPF já cadastrado' });
      }
    }

    // Validar alterações de CRM (para médicos)
    if (updates.crm && updates.crm !== user.crm) {
      const crmExists = await User.findOne({ crm: updates.crm });
      if (crmExists) {
        return res.status(400).json({ message: 'CRM já cadastrado' });
      }
    }

    // Não permitir alterar role e senha por esta rota
    delete updates.role;
    delete updates.password;

    // Atualizar usuário
    Object.assign(user, updates);
    await user.save();

    res.json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf,
        crm: user.crm,
        specialty: user.specialty,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// Excluir usuário (apenas admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar usuário
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Não permitir excluir o próprio admin logado
    if (req.user.id === id) {
      return res.status(400).json({ 
        message: 'Você não pode excluir sua própria conta' 
      });
    }

    // Excluir usuário
    await User.findByIdAndDelete(id);

    res.json({
      message: 'Usuário excluído com sucesso',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

module.exports = {
  createPatient,
  createDoctor,
  getAllUsers,
  getAllDoctors,
  getUserById,
  updateUser,
  deleteUser,
  updateMySchedule,
  getMySchedule,
};
