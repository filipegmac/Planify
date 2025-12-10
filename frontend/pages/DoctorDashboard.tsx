import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { appointmentService, userService } from '../services/api';
import { Appointment, Stats, Schedule } from '../types';
import { Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DoctorDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await appointmentService.getDoctorSchedule();
        setAppointments(data.appointments || []);
        setStats(data.stats || { total: 0, confirmed: 0, cancelled: 0, completed: 0 });
        
        const scheduleData = await userService.getMySchedule();
        setSchedule(scheduleData.schedule || {});
      } catch {
        // Erro ao carregar agenda
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const days = [
    { key: 'Monday', label: 'Segunda' },
    { key: 'Tuesday', label: 'Terça' },
    { key: 'Wednesday', label: 'Quarta' },
    { key: 'Thursday', label: 'Quinta' },
    { key: 'Friday', label: 'Sexta' },
    { key: 'Saturday', label: 'Sábado' },
    { key: 'Sunday', label: 'Domingo' },
  ];

  const handleScheduleChange = (dayKey: string, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) => {
      const current = prev || {};
      const existing = current[dayKey] && current[dayKey].length > 0
        ? [...current[dayKey]]
        : [{ startTime: '', endTime: '' }];

      const updated = { ...existing[0], [field]: value };
      const newPeriods = updated.startTime && updated.endTime ? [updated] : [];

      return {
        ...current,
        [dayKey]: newPeriods,
      };
    });
  };

  const handleSaveSchedule = async () => {
    if (!schedule) return;
    setSavingSchedule(true);
    setScheduleMessage('');
    try {
      const response = await userService.updateMySchedule(schedule);
      setSchedule(response.schedule || {});
      setScheduleMessage(response.message || 'Agenda salva com sucesso.');
    } catch {
      setScheduleMessage('Erro ao salvar agenda.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayAppointments = appointments.filter(a => {
    if (!a || !a.appointmentDate) return false;
    try {
      const aptDate = new Date(a.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    } catch {
      return false;
    }
  });
  
  const upcomingAppointments = appointments.filter(a => {
    if (!a || !a.appointmentDate) return false;
    try {
      const aptDate = new Date(a.appointmentDate);
      return aptDate > today && !todayAppointments.includes(a);
    } catch {
      return false;
    }
  });
  
  const chartData = stats ? [
    { name: 'Total', value: stats.total, fill: '#6366f1' },
    { name: 'Confirmados', value: stats.confirmed, fill: '#10b981' },
    { name: 'Concluídos', value: stats.completed, fill: '#3b82f6' },
    { name: 'Cancelados', value: stats.cancelled, fill: '#ef4444' },
  ] : [];

  return (
    <Layout title="Painel Médico">
      {loading ? (
        <div className="flex justify-center h-64 items-center">Loading...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Total Agendamentos</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
             </div>
             <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-gray-500 text-sm">Confirmados</p>
                <p className="text-2xl font-bold">{stats?.confirmed || 0}</p>
             </div>
             <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500">
                <p className="text-gray-500 text-sm">Concluídos</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
             </div>
             <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
                <p className="text-gray-500 text-sm">Cancelados</p>
                <p className="text-2xl font-bold">{stats?.cancelled || 0}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2" /> Agenda de Hoje ({new Date().toLocaleDateString()})
              </h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {todayAppointments.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Não há consultas para hoje.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {todayAppointments.map((apt) => (
                      <li key={apt._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600 font-bold w-12 text-center">
                              {apt.appointmentTime}
                            </div>
                            <div>
                              <p className="text-lg font-medium text-gray-900">{apt.patientId.name}</p>
                              <div className="flex items-center text-sm text-gray-500 space-x-2">
                                <span className="flex items-center"><User size={14} className="mr-1"/> {apt.patientId.cpf || 'Sem CPF'}</span>
                                {apt.patientId.phone && <span>• {apt.patientId.phone}</span>}
                              </div>
                              {apt.notes && <p className="text-sm text-gray-600 mt-1 italic">"{apt.notes}"</p>}
                            </div>
                          </div>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {apt.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

               {/* Upcoming */}
               <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4">Próximos Agendamentos</h2>
               <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {upcomingAppointments.map((apt) => (
                                <tr key={apt._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(apt.appointmentDate).toLocaleDateString('pt-BR')} - {apt.appointmentTime}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {apt.patientId.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {upcomingAppointments.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 text-sm">Sem agendamentos futuros.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Charts */}
            <div>
               <h2 className="text-xl font-bold text-gray-800 mb-4">Visão Geral</h2>
               <div className="bg-white p-4 rounded-lg shadow h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Configurar Agenda de Atendimentos</h2>
            <p className="text-sm text-gray-500 mb-4">
              Defina os horários de atendimento para cada dia da semana. Esses horários serão usados para abrir vagas
              quando os pacientes pesquisarem por disponibilidade.
            </p>
            {scheduleMessage && (
              <div className={`mb-4 p-3 rounded text-sm ${scheduleMessage.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {scheduleMessage}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {days.map((day) => {
                const periods = schedule && schedule[day.key] ? schedule[day.key] : [];
                const first = periods[0] || { startTime: '', endTime: '' };
                return (
                  <div key={day.key} className="border rounded-md p-3">
                    <p className="font-semibold text-gray-800 mb-2">{day.label}</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={first.startTime || ''}
                        onChange={(e) => handleScheduleChange(day.key, 'startTime', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                      <span className="text-gray-500">até</span>
                      <input
                        type="time"
                        value={first.endTime || ''}
                        onChange={(e) => handleScheduleChange(day.key, 'endTime', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Deixe em branco para não atender neste dia.</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-sky-600 disabled:opacity-50"
              >
                {savingSchedule ? 'Salvando...' : 'Salvar Agenda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DoctorDashboard;