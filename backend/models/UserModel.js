const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient',
  },
  
  // Campos para Pacientes
  cpf: { type: String, unique: true, sparse: true },
  phone: { type: String },
  birthDate: { type: Date },
  address: {
    street: { type: String },
    number: { type: String },
    complement: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
  },
  
  // Campos para Médicos
  crm: { type: String, unique: true, sparse: true },
  specialty: { type: String },
  schedule: {
    type: Map,
    of: [{
      startTime: String,
      endTime: String,
    }],
  },
}, { timestamps: true });

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;