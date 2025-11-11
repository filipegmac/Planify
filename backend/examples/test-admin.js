/**
 * Exemplos de uso da API de Administração de Usuários
 * 
 * Para testar:
 * 1. Certifique-se de que o servidor está rodando: npm run dev
 * 2. Tenha um token JWT de admin válido
 * 3. Execute: node backend/examples/test-admin.js
 */

const API_URL = 'http://localhost:5000';

// ⚠️ Substitua pelo token JWT real de um admin
const ADMIN_TOKEN = 'seu_token_jwt_aqui';

// Função auxiliar para fazer requisições
async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    return null;
  }
}

// Exemplos de Uso

// 1. Listar todos os usuários
async function listAllUsers() {
  console.log('\n📋 LISTANDO TODOS OS USUÁRIOS');
  console.log('═'.repeat(50));
  
  const data = await apiRequest('/api/users');
  
  if (data) {
    console.log(`Total de usuários: ${data.count}\n`);
    
    // Agrupar por tipo
    const grouped = {
      admin: [],
      doctor: [],
      patient: []
    };
    
    data.users.forEach(user => {
      grouped[user.role].push(user);
    });
    
    console.log(`👑 Admins: ${grouped.admin.length}`);
    grouped.admin.forEach(u => console.log(`   - ${u.name} (${u.email})`));
    
    console.log(`\n👨‍⚕️ Médicos: ${grouped.doctor.length}`);
    grouped.doctor.forEach(u => console.log(`   - ${u.name} - ${u.specialty} (CRM: ${u.crm})`));
    
    console.log(`\n🧑 Pacientes: ${grouped.patient.length}`);
    grouped.patient.forEach(u => console.log(`   - ${u.name} (CPF: ${u.cpf || 'N/A'})`));
  }
  
  return data;
}

// 2. Cadastrar novo paciente
async function createPatient() {
  console.log('\n➕ CADASTRANDO NOVO PACIENTE');
  console.log('═'.repeat(50));
  
  const patientData = {
    name: 'João Silva Teste',
    email: `teste.paciente.${Date.now()}@email.com`, // Email único
    password: 'senha123',
    cpf: `${Math.floor(10000000000 + Math.random() * 90000000000)}`, // CPF aleatório
    phone: '(11) 98765-4321',
    birthDate: '1990-05-15',
    address: {
      street: 'Rua Teste',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    }
  };
  
  console.log('Dados do paciente:', JSON.stringify(patientData, null, 2));
  
  const data = await apiRequest('/api/users/patients', 'POST', patientData);
  
  if (data) {
    console.log('\n✅', data.message);
    console.log('Paciente criado:', data.patient);
    return data.patient;
  }
  
  return null;
}

// 3. Cadastrar novo médico
async function createDoctor() {
  console.log('\n➕ CADASTRANDO NOVO MÉDICO');
  console.log('═'.repeat(50));
  
  const doctorData = {
    name: 'Dr. Carlos Teste',
    email: `teste.medico.${Date.now()}@email.com`, // Email único
    password: 'senha123',
    crm: `${Math.floor(100000 + Math.random() * 900000)}`, // CRM aleatório
    specialty: 'Clínica Geral',
    phone: '(11) 91234-5678',
    schedule: {
      segunda: [
        { startTime: '08:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '18:00' }
      ],
      quarta: [
        { startTime: '08:00', endTime: '12:00' }
      ]
    }
  };
  
  console.log('Dados do médico:', JSON.stringify(doctorData, null, 2));
  
  const data = await apiRequest('/api/users/doctors', 'POST', doctorData);
  
  if (data) {
    console.log('\n✅', data.message);
    console.log('Médico criado:', data.doctor);
    return data.doctor;
  }
  
  return null;
}

// 4. Buscar usuário por ID
async function getUserById(userId) {
  console.log(`\n🔍 BUSCANDO USUÁRIO: ${userId}`);
  console.log('═'.repeat(50));
  
  const data = await apiRequest(`/api/users/${userId}`);
  
  if (data) {
    console.log('Usuário encontrado:');
    console.log(JSON.stringify(data, null, 2));
  }
  
  return data;
}

// 5. Editar usuário
async function updateUser(userId, updates) {
  console.log(`\n✏️ EDITANDO USUÁRIO: ${userId}`);
  console.log('═'.repeat(50));
  
  console.log('Atualizações:', JSON.stringify(updates, null, 2));
  
  const data = await apiRequest(`/api/users/${userId}`, 'PUT', updates);
  
  if (data) {
    console.log('\n✅', data.message);
    console.log('Usuário atualizado:', data.user);
  }
  
  return data;
}

// 6. Excluir usuário
async function deleteUser(userId) {
  console.log(`\n🗑️ EXCLUINDO USUÁRIO: ${userId}`);
  console.log('═'.repeat(50));
  
  const data = await apiRequest(`/api/users/${userId}`, 'DELETE');
  
  if (data) {
    console.log('\n✅', data.message);
    console.log('Usuário excluído:', data.deletedUser);
  }
  
  return data;
}

// Fluxo completo de teste
async function runFullTest() {
  console.log('\n🏥 TESTE COMPLETO DE ADMINISTRAÇÃO DE USUÁRIOS');
  console.log('═'.repeat(50));
  
  // 1. Listar usuários iniciais
  await listAllUsers();
  
  // 2. Criar novo paciente
  const newPatient = await createPatient();
  
  if (newPatient) {
    // 3. Buscar o paciente criado
    await getUserById(newPatient.id);
    
    // 4. Editar o paciente
    await updateUser(newPatient.id, {
      name: 'João Silva Teste Atualizado',
      phone: '(11) 99999-8888'
    });
    
    // 5. Buscar novamente para ver as alterações
    await getUserById(newPatient.id);
    
    // 6. Excluir o paciente de teste
    await deleteUser(newPatient.id);
  }
  
  // 7. Criar novo médico
  const newDoctor = await createDoctor();
  
  if (newDoctor) {
    // 8. Editar o médico
    await updateUser(newDoctor.id, {
      specialty: 'Cardiologia',
      schedule: {
        segunda: [{ startTime: '09:00', endTime: '17:00' }],
        terça: [{ startTime: '09:00', endTime: '17:00' }],
        quinta: [{ startTime: '09:00', endTime: '17:00' }]
      }
    });
    
    // 9. Excluir o médico de teste
    await deleteUser(newDoctor.id);
  }
  
  // 10. Listar usuários finais
  await listAllUsers();
  
  console.log('\n\n✅ TESTE COMPLETO FINALIZADO!');
  console.log('═'.repeat(50));
}

// Executar teste
console.log('⚠️  IMPORTANTE: Configure o ADMIN_TOKEN antes de executar!');
console.log('');

// Descomente a linha abaixo para executar o teste completo
// runFullTest().catch(console.error);

// Ou execute testes individuais:
// listAllUsers().catch(console.error);
