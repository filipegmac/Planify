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

module.exports = {
  createPatient,
  createDoctor,
  getAllUsers,
  getAllDoctors,
  getUserById,
};
