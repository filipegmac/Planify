import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login'); // login | patient | doctor
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [patientForm, setPatientForm] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    birthDate: '',
  });
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    crm: '',
    specialty: '',
    phone: '',
  });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const redirectByRole = (user) => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else if (user.role === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/patient');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      login(token, user);
      redirectByRole(user);
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao fazer login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (event) => {
    const { name, value } = event.target;
    setPatientForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (event) => {
    const { name, value } = event.target;
    setDoctorForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientRegister = async (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      await api.post('/auth/register/patient', {
        name: patientForm.name,
        email: patientForm.email,
        password: patientForm.password,
        cpf: patientForm.cpf,
        phone: patientForm.phone,
        birthDate: patientForm.birthDate || undefined,
      });

      const loginResponse = await api.post('/auth/login', {
        email: patientForm.email,
        password: patientForm.password,
      });
      const { token, user } = loginResponse.data;
      login(token, user);
      redirectByRole(user);
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao cadastrar paciente';
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleDoctorRegister = async (event) => {
    event.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      await api.post('/auth/register/doctor', {
        name: doctorForm.name,
        email: doctorForm.email,
        password: doctorForm.password,
        crm: doctorForm.crm,
        specialty: doctorForm.specialty,
        phone: doctorForm.phone,
      });

      const loginResponse = await api.post('/auth/login', {
        email: doctorForm.email,
        password: doctorForm.password,
      });
      const { token, user } = loginResponse.data;
      login(token, user);
      redirectByRole(user);
    } catch (err) {
      const message = err.response?.data?.message || 'Erro ao cadastrar médico';
      setRegisterError(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>Planify</h1>
      <p className="login-subtitle">Faça login ou cadastre-se como paciente ou médico.</p>
      <div className="login-form">
        {activeTab === 'login' && (
          <>
            <form onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <button
              type="button"
              className="login-secondary-button"
              onClick={() => {
                setActiveTab('patient');
                setError('');
                setRegisterError('');
              }}
            >
              Cadastrar
            </button>
          </>
        )}

        {activeTab !== 'login' && (
          <>
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab ${activeTab === 'patient' ? 'login-tab-active' : ''}`}
                onClick={() => {
                  setActiveTab('patient');
                  setRegisterError('');
                }}
              >
                Paciente
              </button>
              <button
                type="button"
                className={`login-tab ${activeTab === 'doctor' ? 'login-tab-active' : ''}`}
                onClick={() => {
                  setActiveTab('doctor');
                  setRegisterError('');
                }}
              >
                Médico
              </button>
            </div>

            {activeTab === 'patient' && (
              <form onSubmit={handlePatientRegister}>
                <label>
                  Nome completo
                  <input
                    name="name"
                    value={patientForm.name}
                    onChange={handlePatientChange}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={patientForm.email}
                    onChange={handlePatientChange}
                    required
                  />
                </label>
                <label>
                  Senha
                  <input
                    name="password"
                    type="password"
                    value={patientForm.password}
                    onChange={handlePatientChange}
                    required
                  />
                </label>
                <label>
                  CPF
                  <input
                    name="cpf"
                    value={patientForm.cpf}
                    onChange={handlePatientChange}
                  />
                </label>
                <label>
                  Telefone
                  <input
                    name="phone"
                    value={patientForm.phone}
                    onChange={handlePatientChange}
                  />
                </label>
                <label>
                  Data de nascimento
                  <input
                    name="birthDate"
                    type="date"
                    value={patientForm.birthDate}
                    onChange={handlePatientChange}
                  />
                </label>

                {registerError && <p className="error-message">{registerError}</p>}

                <button type="submit" disabled={registerLoading}>
                  {registerLoading ? 'Cadastrando...' : 'Cadastrar e entrar'}
                </button>
              </form>
            )}

            {activeTab === 'doctor' && (
              <form onSubmit={handleDoctorRegister}>
                <label>
                  Nome completo
                  <input
                    name="name"
                    value={doctorForm.name}
                    onChange={handleDoctorChange}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={doctorForm.email}
                    onChange={handleDoctorChange}
                    required
                  />
                </label>
                <label>
                  Senha
                  <input
                    name="password"
                    type="password"
                    value={doctorForm.password}
                    onChange={handleDoctorChange}
                    required
                  />
                </label>
                <label>
                  CRM
                  <input
                    name="crm"
                    value={doctorForm.crm}
                    onChange={handleDoctorChange}
                    required
                  />
                </label>
                <label>
                  Especialidade
                  <input
                    name="specialty"
                    value={doctorForm.specialty}
                    onChange={handleDoctorChange}
                    required
                  />
                </label>
                <label>
                  Telefone
                  <input
                    name="phone"
                    value={doctorForm.phone}
                    onChange={handleDoctorChange}
                  />
                </label>

                {registerError && <p className="error-message">{registerError}</p>}

                <button type="submit" disabled={registerLoading}>
                  {registerLoading ? 'Cadastrando...' : 'Cadastrar e entrar'}
                </button>
              </form>
            )}

            <button
              type="button"
              className="login-secondary-button"
              onClick={() => {
                setActiveTab('login');
                setRegisterError('');
              }}
            >
              Voltar para login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
