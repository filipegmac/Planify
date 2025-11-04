const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/UserModel');

// Carregar variáveis de ambiente do arquivo .env na pasta backend
dotenv.config({ path: path.join(__dirname, '../.env') });

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Criar usuário admin
const createAdmin = async () => {
  try {
    // Verificar se já existe um admin
    const adminExists = await User.findOne({ email: 'admin@planify.com' });
    
    if (adminExists) {
      console.log('❌ Admin já existe!');
      process.exit(0);
    }

    // Criar novo admin
    const admin = await User.create({
      name: 'Administrador',
      email: 'admin@planify.com',
      password: 'admin123',
      role: 'admin',
      phone: '(11) 99999-9999',
    });

    console.log('✅ Admin criado com sucesso!');
    console.log('\nCredenciais:');
    console.log('Email: admin@planify.com');
    console.log('Senha: admin123');
    console.log('\n⚠️  Não esqueça de alterar a senha após o primeiro login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  }
};

createAdmin();
