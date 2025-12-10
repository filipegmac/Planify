import React, { useEffect, useState } from 'react';
import api from '../services/api';

const PatientDashboard = () => {
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments/my-appointments');
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar suas consultas');
    }
  };

  useEffect(() => {
    fetchAppointments();
    (async () => {
      try {
        const response = await api.get('/appointments/doctors');
        setDoctors(response.data.doctors || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSearchDoctors = async () => {
    setError('');
    setMessage('');

    try {
      const response = await api.get('/appointments/doctors', {
        params: specialty ? { specialty } : {},
      });
      setDoctors(response.data.doctors || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar médicos');
    }
  };

  const handleLoadAvailability = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setError('');
    setMessage('');

    try {
      const response = await api.get(`/appointments/doctors/${selectedDoctor._id}/availability`, {
        params: { date: selectedDate },
      });
      setAvailability(response.data.availableSlots || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar horários disponíveis');
    }
  };

  const handleCreateAppointment = async (time) => {
    if (!selectedDoctor || !selectedDate || !time) return;

    setError('');
    setMessage('');

    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: time,
      });
      setMessage('Consulta agendada com sucesso');
      fetchAppointments();
      handleLoadAvailability();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao agendar consulta';
      setError(msg);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    setError('');
    setMessage('');

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);
      setMessage('Consulta cancelada com sucesso');
      fetchAppointments();
      if (selectedDoctor && selectedDate) {
        handleLoadAvailability();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao cancelar consulta';
      setError(msg);
    }
  };

  return (
    <div className="dashboard">
      <h1>Painel do Paciente</h1>
      <p className="dashboard-subtitle">
        Aqui você pode buscar médicos, ver horários disponíveis e agendar ou cancelar consultas.
      </p>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <section>
        <h2>Médicos disponíveis</h2>
        <div className="inline-form">
          <input
            placeholder="Filtrar por especialidade (opcional)"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
          <button type="button" onClick={handleSearchDoctors}>
            Filtrar
          </button>
        </div>
        <ul>
          {doctors.map((doctor) => (
            <li key={doctor._id}>
              {doctor.name} - {doctor.specialty}{' '}
              <button type="button" onClick={() => setSelectedDoctor(doctor)}>
                Escolher
              </button>
            </li>
          ))}
          {doctors.length === 0 && <li>Nenhum médico encontrado.</li>}
        </ul>
      </section>

      {selectedDoctor && (
        <section>
          <h2>Agendar Consulta com {selectedDoctor.name}</h2>
          <div className="inline-form">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button type="button" onClick={handleLoadAvailability}>
              Ver horários disponíveis
            </button>
          </div>

          <div className="slots">
            {availability.map((slot) => (
              <button
                key={slot.time}
                type="button"
                disabled={!slot.available}
                onClick={() => handleCreateAppointment(slot.time)}
              >
                {slot.time} {slot.available ? '' : '(ocupado)'}
              </button>
            ))}
            {availability.length === 0 && <p>Nenhum horário disponível para esta data.</p>}
          </div>
        </section>
      )}

      <section>
        <h2>Minhas Consultas</h2>
        <ul>
          {appointments.map((apt) => (
            <li key={apt._id}>
              {new Date(apt.appointmentDate).toLocaleDateString()} - {apt.appointmentTime} com{' '}
              {apt.doctorId?.name || 'Médico'} ({apt.status})
              {apt.status === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => handleCancelAppointment(apt._id)}
                >
                  Cancelar
                </button>
              )}
            </li>
          ))}
          {appointments.length === 0 && <li>Você ainda não tem consultas agendadas.</li>}
        </ul>
      </section>
    </div>
  );
};

export default PatientDashboard;
