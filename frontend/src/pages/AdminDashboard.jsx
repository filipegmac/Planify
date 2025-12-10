import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    crm: '',
    specialty: '',
    phone: '',
  });
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [doctorsRes, usersRes] = await Promise.all([
        api.get('/users/doctors/list'),
        api.get('/users'),
      ]);
      setDoctors(doctorsRes.data.doctors || []);
      setUsers(usersRes.data.users || usersRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDoctorChange = (event) => {
    const { name, value } = event.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientChange = (event) => {
    const { name, value } = event.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateDoctor = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/users/doctors', doctorForm);
      setMessage('Médico cadastrado com sucesso');
      setDoctorForm({ name: '', email: '', password: '', crm: '', specialty: '', phone: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao cadastrar médico';
      setError(msg);
    }
  };

  const handleCreatePatient = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await api.post('/users/patients', patientForm);
      setMessage('Paciente cadastrado com sucesso');
      setPatientForm({ name: '', email: '', password: '', cpf: '', phone: '' });
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao cadastrar paciente';
      setError(msg);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este usuário?');
    if (!confirmDelete) return;

    setMessage('');
    setError('');

    try {
      await api.delete(`/users/${userId}`);
      setMessage('Usuário excluído com sucesso');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao excluir usuário';
      setError(msg);
    }
  };

  return (
    <div className="dashboard">
      <h1>Painel do Administrador</h1>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-forms">
        <section>
          <h2>Cadastrar Médico</h2>
          <form onSubmit={handleCreateDoctor} className="simple-form">
            <input
              name="name"
              placeholder="Nome"
              value={doctorForm.name}
              onChange={handleDoctorChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={doctorForm.email}
              onChange={handleDoctorChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              value={doctorForm.password}
              onChange={handleDoctorChange}
              required
            />
            <input
              name="crm"
              placeholder="CRM"
              value={doctorForm.crm}
              onChange={handleDoctorChange}
              required
            />
            <input
              name="specialty"
              placeholder="Especialidade"
              value={doctorForm.specialty}
              onChange={handleDoctorChange}
              required
            />
            <input
              name="phone"
              placeholder="Telefone"
              value={doctorForm.phone}
              onChange={handleDoctorChange}
            />
            <button type="submit">Salvar Médico</button>
          </form>
        </section>

        <section>
          <h2>Cadastrar Paciente</h2>
          <form onSubmit={handleCreatePatient} className="simple-form">
            <input
              name="name"
              placeholder="Nome"
              value={patientForm.name}
              onChange={handlePatientChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={patientForm.email}
              onChange={handlePatientChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Senha"
              value={patientForm.password}
              onChange={handlePatientChange}
              required
            />
            <input
              name="cpf"
              placeholder="CPF"
              value={patientForm.cpf}
              onChange={handlePatientChange}
            />
            <input
              name="phone"
              placeholder="Telefone"
              value={patientForm.phone}
              onChange={handlePatientChange}
            />
            <button type="submit">Salvar Paciente</button>
          </form>
        </section>
      </div>

      <div className="dashboard-lists">
        <section>
          <h2>Médicos Cadastrados</h2>
          <ul>
            {doctors.map((doctor) => (
              <li key={doctor._id}>
                {doctor.name} - {doctor.specialty} ({doctor.email})
              </li>
            ))}
            {doctors.length === 0 && <li>Nenhum médico cadastrado ainda.</li>}
          </ul>
        </section>

        <section>
          <h2>Usuários (Resumo)</h2>
          <ul>
            {Array.isArray(users) && users.map((user) => (
              <li key={user._id}>
                {user.name} - {user.email} ({user.role})
                <button
                  type="button"
                  onClick={() => handleDeleteUser(user._id)}
                >
                  Excluir
                </button>
              </li>
            ))}
            {(!users || users.length === 0) && <li>Nenhum usuário encontrado.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
