import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userService } from '../services/api';
import { Activity, User, Stethoscope, Loader2, ArrowLeft } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Campos do paciente
    cpf: '',
    birthDate: '',
    // Campos do médico
    crm: '',
    specialty: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      if (userType === 'patient') {
        await userService.createPatient({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf,
          phone: formData.phone,
          birthDate: formData.birthDate,
        });
      } else {
        // Agenda padrão para novos médicos (Segunda a Sexta, 09:00-17:00)
        const defaultSchedule = {
          "Monday": [{ "startTime": "09:00", "endTime": "17:00" }],
          "Tuesday": [{ "startTime": "09:00", "endTime": "17:00" }],
          "Wednesday": [{ "startTime": "09:00", "endTime": "17:00" }],
          "Thursday": [{ "startTime": "09:00", "endTime": "17:00" }],
          "Friday": [{ "startTime": "09:00", "endTime": "17:00" }]
        };

        await userService.createDoctor({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          crm: formData.crm,
          specialty: formData.specialty,
          phone: formData.phone,
          schedule: defaultSchedule
        });
      }

      setSuccess('Conta criada com sucesso! Redirecionando para login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "mt-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-gray-700 text-white placeholder-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary mb-4">
          <Activity size={48} />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Crie sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Junte-se ao Planify hoje mesmo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'patient' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User size={16} className="mr-2" />
              Sou Paciente
            </button>
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                userType === 'doctor' 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Stethoscope size={16} className="mr-2" />
              Sou Médico
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <input
                name="name"
                type="text"
                required
                className={inputClassName}
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                required
                className={inputClassName}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  name="password"
                  type="password"
                  required
                  className={inputClassName}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className={inputClassName}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <input
                name="phone"
                type="text"
                className={inputClassName}
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {userType === 'patient' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      name="cpf"
                      type="text"
                      required
                      className={inputClassName}
                      value={formData.cpf}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Nasc.</label>
                    <input
                      name="birthDate"
                      type="date"
                      className={inputClassName}
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {userType === 'doctor' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CRM</label>
                    <input
                      name="crm"
                      type="text"
                      required
                      className={inputClassName}
                      value={formData.crm}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                    <input
                      name="specialty"
                      type="text"
                      required
                      placeholder="Ex: Cardiologia"
                      className={inputClassName}
                      value={formData.specialty}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Criar Conta'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Já tem uma conta?
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1">
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft size={16} className="mr-2" />
                Fazer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
