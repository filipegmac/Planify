import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { userService, appointmentService } from '../services/api';
import { User, Appointment } from '../types';
import { Users, Trash2, PlusCircle, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'appointments'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Estado do formulário de criação
  const [userType, setUserType] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    cpf: '', address: '', crm: '', specialty: '',
    // Agenda padrão para médicos
    schedule: {
       "Monday": [{"startTime": "09:00", "endTime": "17:00"}],
       "Tuesday": [{"startTime": "09:00", "endTime": "17:00"}],
       "Wednesday": [{"startTime": "09:00", "endTime": "17:00"}],
       "Thursday": [{"startTime": "09:00", "endTime": "17:00"}],
       "Friday": [{"startTime": "09:00", "endTime": "17:00"}]
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const data = await userService.getAllUsers();
        setUsers(data.users);
      } else {
        const data = await appointmentService.getAllAppointments();
        setAppointments(data.appointments);
      }
    } catch {
      // Erro ao carregar dados
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDeleteUser = async (id: string) => {
    const confirmed = window.confirm('Tem certeza? Isso excluirá todos os dados do usuário.');

    if (!confirmed) return;

    try {
      await userService.deleteUser(id);
      fetchData();
    } catch (error) {
      setMsg({ type: 'error', text: 'Erro ao excluir usuário' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userType === 'patient') {
        await userService.createPatient({
            name: formData.name, email: formData.email, password: formData.password,
            cpf: formData.cpf, phone: formData.phone
        });
      } else {
        await userService.createDoctor({
            name: formData.name, email: formData.email, password: formData.password,
            crm: formData.crm, specialty: formData.specialty, phone: formData.phone,
            schedule: formData.schedule
        });
      }
      setMsg({ type: 'success', text: 'Usuário criado com sucesso!' });
      setShowForm(false);
      fetchData();
      // Reset sensitive fields
      setFormData({...formData, name: '', email: '', password: '', cpf: '', crm: ''});
    } catch (error: any) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Erro ao criar usuário' });
    }
  };

  return (
    <Layout title="Painel Administrativo">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'users' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
        >
          Gerenciar Usuários
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === 'appointments' ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
        >
          Todas Consultas
        </button>
      </div>

      {msg.text && (
        <div className={`mb-4 p-4 rounded-md ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} className="float-right font-bold">&times;</button>
        </div>
      )}

      {activeTab === 'users' && (
        <>
          <div className="mb-4 flex justify-end">
             <button onClick={() => setShowForm(!showForm)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                <PlusCircle size={18} className="mr-2"/> Novo Usuário
             </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-200">
                <h3 className="text-lg font-bold mb-4">Cadastrar {userType === 'patient' ? 'Paciente' : 'Médico'}</h3>
                <div className="mb-4">
                    <label className="mr-4"><input type="radio" checked={userType === 'patient'} onChange={() => setUserType('patient')} /> Paciente</label>
                    <label><input type="radio" checked={userType === 'doctor'} onChange={() => setUserType('doctor')} /> Médico</label>
                </div>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Nome Completo" className="p-2 border rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <input required placeholder="Email" type="email" className="p-2 border rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <input required placeholder="Senha" type="password" className="p-2 border rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    <input placeholder="Telefone" className="p-2 border rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    
                    {userType === 'patient' ? (
                         <input required placeholder="CPF" className="p-2 border rounded" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
                    ) : (
                        <>
                            <input required placeholder="CRM" className="p-2 border rounded" value={formData.crm} onChange={e => setFormData({...formData, crm: e.target.value})} />
                            <input required placeholder="Especialidade" className="p-2 border rounded" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} />
                        </>
                    )}
                    <div className="md:col-span-2">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded w-full hover:bg-sky-600">Salvar</button>
                    </div>
                </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                        <tr key={u._id || u.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{u.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : u.role === 'doctor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{u.role}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                {u.role !== 'admin' && (
                                    <button onClick={() => handleDeleteUser(u._id || u.id!)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'appointments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map(a => (
                        <tr key={a._id}>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(a.appointmentDate).toLocaleDateString()} {a.appointmentTime}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{a.doctorId?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{a.patientId?.name || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{a.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
