/**
 * Exemplos de uso da API de Gestão de Agenda Médica
 * 
 * Para testar:
 * 1. Certifique-se de que o servidor está rodando: npm run dev
 * 2. Tenha um token JWT de um médico válido
 * 3. Execute: node backend/examples/test-doctor-schedule.js
 */

const API_URL = 'http://localhost:5000';

// ⚠️ Substitua pelo token JWT real de um médico
const DOCTOR_TOKEN = 'seu_token_jwt_aqui';

// Função auxiliar para fazer requisições
async function apiRequest(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DOCTOR_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro na requisição: ${error.message}`);
    return null;
  }
}

// Função para exibir estatísticas
function displayStats(stats) {
  console.log('\n📊 ESTATÍSTICAS:');
  console.log('─────────────────────────────');
  console.log(`Total de consultas: ${stats.total}`);
  console.log(`✅ Confirmadas: ${stats.confirmed}`);
  console.log(`❌ Canceladas: ${stats.cancelled}`);
  console.log(`✔️  Concluídas: ${stats.completed}`);
  console.log('─────────────────────────────\n');
}

// Função para exibir agenda agrupada
function displayGroupedSchedule(groupedByDate) {
  console.log('📅 AGENDA AGRUPADA POR DATA:\n');
  
  const dates = Object.keys(groupedByDate).sort();
  
  if (dates.length === 0) {
    console.log('Nenhuma consulta encontrada para o período.');
    return;
  }
  
  dates.forEach(date => {
    const appointments = groupedByDate[date];
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    console.log(`\n📆 ${formattedDate}`);
    console.log('─'.repeat(50));
    
    appointments.forEach(apt => {
      const statusIcon = {
        'confirmed': '✅',
        'cancelled': '❌',
        'completed': '✔️'
      }[apt.status] || '❓';
      
      console.log(`${statusIcon} ${apt.appointmentTime} - ${apt.patientId.name}`);
      console.log(`   📞 ${apt.patientId.phone || 'Sem telefone'}`);
      console.log(`   📧 ${apt.patientId.email || 'Sem email'}`);
      if (apt.notes) {
        console.log(`   📝 ${apt.notes}`);
      }
      console.log('');
    });
  });
}

// Testes
async function runTests() {
  console.log('🏥 TESTANDO API DE GESTÃO DE AGENDA MÉDICA\n');
  console.log('═'.repeat(50));

  // Teste 1: Agenda de hoje
  console.log('\n\n🔍 TESTE 1: Agenda de Hoje');
  console.log('═'.repeat(50));
  const todayData = await apiRequest('/api/appointments/schedule?filter=today');
  if (todayData) {
    displayStats(todayData.stats);
    displayGroupedSchedule(todayData.groupedByDate);
  }

  // Teste 2: Agenda da semana
  console.log('\n\n🔍 TESTE 2: Agenda da Semana (Próximos 7 dias)');
  console.log('═'.repeat(50));
  const weekData = await apiRequest('/api/appointments/schedule?filter=week');
  if (weekData) {
    displayStats(weekData.stats);
    displayGroupedSchedule(weekData.groupedByDate);
  }

  // Teste 3: Apenas confirmadas
  console.log('\n\n🔍 TESTE 3: Apenas Consultas Confirmadas (Hoje)');
  console.log('═'.repeat(50));
  const confirmedData = await apiRequest('/api/appointments/schedule?filter=today&status=confirmed');
  if (confirmedData) {
    displayStats(confirmedData.stats);
    displayGroupedSchedule(confirmedData.groupedByDate);
  }

  // Teste 4: Agenda do mês
  console.log('\n\n🔍 TESTE 4: Agenda do Mês (Próximos 30 dias)');
  console.log('═'.repeat(50));
  const monthData = await apiRequest('/api/appointments/schedule?filter=month');
  if (monthData) {
    displayStats(monthData.stats);
    console.log(`\nTotal de consultas no próximo mês: ${monthData.totalAppointments}`);
  }

  // Teste 5: Período personalizado
  console.log('\n\n🔍 TESTE 5: Período Personalizado');
  console.log('═'.repeat(50));
  const customStartDate = '2024-11-01';
  const customEndDate = '2024-11-30';
  console.log(`Período: ${customStartDate} até ${customEndDate}`);
  const customData = await apiRequest(
    `/api/appointments/schedule?startDate=${customStartDate}&endDate=${customEndDate}`
  );
  if (customData) {
    displayStats(customData.stats);
  }

  console.log('\n\n✅ TESTES CONCLUÍDOS!');
  console.log('═'.repeat(50));
}

// Executar testes
runTests().catch(console.error);
