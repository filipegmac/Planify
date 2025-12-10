import React, { useEffect, useState } from 'react';
import api from '../services/api';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    monday: { startTime: '', endTime: '' },
    tuesday: { startTime: '', endTime: '' },
    wednesday: { startTime: '', endTime: '' },
    thursday: { startTime: '', endTime: '' },
    friday: { startTime: '', endTime: '' },
    saturday: { startTime: '', endTime: '' },
    sunday: { startTime: '', endTime: '' },
  });
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [agendaStartDate, setAgendaStartDate] = useState('');
  const [agendaEndDate, setAgendaEndDate] = useState('');
  const [agenda, setAgenda] = useState({ groupedByDate: {}, stats: null });
  const [agendaError, setAgendaError] = useState('');
  const [agendaLoading, setAgendaLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/my-schedule');
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar suas consultas');
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await api.get('/users/me/schedule');
      const schedule = response.data.schedule || {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const updated = { ...scheduleForm };
      days.forEach((day) => {
        const periods = schedule[day];
        if (Array.isArray(periods) && periods.length > 0) {
          updated[day] = {
            startTime: periods[0].startTime || '',
            endTime: periods[0].endTime || '',
          };
        } else {
          updated[day] = { startTime: '', endTime: '' };
        }
      });
      setScheduleForm(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAgenda = async (params = {}) => {
    setAgendaError('');
    setAgendaLoading(true);
    try {
      const response = await api.get('/appointments/schedule', { params });
      const groupedByDate = response.data.groupedByDate || {};
      const stats = response.data.stats || null;
      setAgenda({ groupedByDate, stats });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Erro ao carregar agenda detalhada';
      setAgendaError(msg);
    } finally {
      setAgendaLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchSchedule();
    loadAgenda({ filter: 'today' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScheduleChange = (day, field, value) => {
    setScheduleForm((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSaveSchedule = async () => {
    setScheduleMessage('');
    setScheduleError('');
    setSavingSchedule(true);

    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const schedulePayload = {};
      days.forEach((day) => {
        const { startTime, endTime } = scheduleForm[day];
        if (startTime && endTime) {
          schedulePayload[day] = [{ startTime, endTime }];
        }
      });

      await api.put('/users/me/schedule', { schedule: schedulePayload });
      setScheduleMessage('Agenda salva com sucesso');
      fetchSchedule();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao salvar agenda';
      setScheduleError(msg);
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleQuickAgendaFilter = async (filter) => {
    setAgendaStartDate('');
    setAgendaEndDate('');
    if (filter === 'all') {
      await loadAgenda();
    } else {
      await loadAgenda({ filter });
    }
  };

  const handleCustomAgendaFilter = async () => {
    if (!agendaStartDate || !agendaEndDate) {
      setAgendaError('Informe data inicial e final para o filtro personalizado');
      return;
    }
    await loadAgenda({ startDate: agendaStartDate, endDate: agendaEndDate });
  };

  const dayLabels = [
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' },
  ];

  const formatDateLabel = (dateKey) => {
    if (!dateKey) return '';
    const dateObj = new Date(`${dateKey}T00:00:00`);
    return dateObj.toLocaleDateString('pt-BR');
  };

  const agendaDates = Object.keys(agenda.groupedByDate || {}).sort();

  return (
    <div className="dashboard">
      <h1>Painel do Médico</h1>
      <p className="dashboard-subtitle">
        Aqui você vê suas consultas, acompanha a agenda por período e define os horários em que atende.
      </p>

      {error && <p className="error-message">{error}</p>}

      <section>
        <h2>Próximas Consultas</h2>
        <ul>
          {appointments.map((apt) => (
            <li key={apt._id}>
              {new Date(apt.appointmentDate).toLocaleDateString()} - {apt.appointmentTime} com{' '}
                {apt.patientId?.name || 'Paciente'} ({apt.status})
              </li>
          ))}
          {appointments.length === 0 && <li>Você ainda não tem consultas agendadas.</li>}
        </ul>
      </section>

      <section>
        <h2>Agenda de consultas (por período)</h2>
        <div className="inline-form">
          <button type="button" onClick={() => handleQuickAgendaFilter('today')}>
            Hoje
          </button>
          <button type="button" onClick={() => handleQuickAgendaFilter('week')}>
            Próximos 7 dias
          </button>
          <button type="button" onClick={() => handleQuickAgendaFilter('month')}>
            Próximos 30 dias
          </button>
          <button type="button" onClick={() => handleQuickAgendaFilter('all')}>
            Todo período
          </button>
        </div>
        <div className="inline-form">
          <input
            type="date"
            value={agendaStartDate}
            onChange={(e) => setAgendaStartDate(e.target.value)}
          />
          <input
            type="date"
            value={agendaEndDate}
            onChange={(e) => setAgendaEndDate(e.target.value)}
          />
          <button type="button" onClick={handleCustomAgendaFilter}>
            Aplicar período
          </button>
        </div>
        {agendaError && <p className="error-message">{agendaError}</p>}
        {agenda.stats && (
          <p className="dashboard-subtitle">
            Total: {agenda.stats.total} | Confirmadas: {agenda.stats.confirmed} | Canceladas: {agenda.stats.cancelled} |
                Concluídas: {agenda.stats.completed}
          </p>
        )}
        {agendaLoading && <p className="dashboard-subtitle">Carregando agenda...</p>}
        {!agendaLoading && agendaDates.length === 0 && (
          <p className="dashboard-subtitle">Nenhuma consulta no período selecionado.</p>
        )}
        {!agendaLoading && agendaDates.length > 0 && (
          <div>
            {agendaDates.map((dateKey) => (
              <section key={dateKey}>
                <h3>{formatDateLabel(dateKey)}</h3>
                <ul>
                  {(agenda.groupedByDate[dateKey] || []).map((apt) => (
                    <li key={apt._id}>
                      {apt.appointmentTime} - {apt.patientId?.name || 'Paciente'} ({apt.status})
                      {apt.notes && ` - Notas: ${apt.notes}`}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Minha agenda de atendimento</h2>
        {scheduleMessage && <p className="success-message">{scheduleMessage}</p>}
        {scheduleError && <p className="error-message">{scheduleError}</p>}
        <div className="simple-form">
          {dayLabels.map((day) => (
            <div className="inline-form" key={day.key}>
              <span>{day.label}</span>
              <input
                type="time"
                value={scheduleForm[day.key].startTime}
                onChange={(e) => handleScheduleChange(day.key, 'startTime', e.target.value)}
              />
              <input
                type="time"
                value={scheduleForm[day.key].endTime}
                onChange={(e) => handleScheduleChange(day.key, 'endTime', e.target.value)}
              />
            </div>
          ))}
          <button type="button" onClick={handleSaveSchedule} disabled={savingSchedule}>
            {savingSchedule ? 'Salvando...' : 'Salvar agenda'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default DoctorDashboard;
