import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { appointmentService, userService } from '../services/api';
import { Appointment, User, AvailabilityResponse } from '../types';
import { Calendar, Clock, MapPin, X, Check, Search, Plus, User as UserIcon } from 'lucide-react';

const PatientDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my-appointments' | 'book'>('my-appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Estado do agendamento
  const [step, setStep] = useState(1);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data.appointments);
    } catch {
      // Erro ao buscar consultas
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja cancelar esta consulta?');

    if (!confirmed) return;

    try {
      await appointmentService.cancelAppointment(id);
      fetchMyAppointments();
      setMsg({ type: 'success', text: 'Consulta cancelada.' });
    } catch {
      setMsg({ type: 'error', text: 'Erro ao cancelar consulta.' });
    }
  };

  // Funções do fluxo de agendamento
  const searchDoctors = async () => {
    setLoading(true);
    try {
      const data = await userService.getDoctorsBySpecialty(
        specialtyFilter && specialtyFilter.trim() !== '' ? specialtyFilter : undefined
      );
      setDoctors(data.doctors);
      setStep(1);
    } catch {
      // Erro ao buscar médicos
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!selectedDoctor || !selectedDate) return;
    setLoading(true);
    try {
      const data = await appointmentService.getDoctorAvailability(selectedDoctor._id || selectedDoctor.id!, selectedDate);
      setAvailability(data);
      setStep(3);
    } catch {
      // Erro ao verificar disponibilidade
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    try {
      await appointmentService.createAppointment(selectedDoctor._id || selectedDoctor.id!, selectedDate, selectedTime, notes);
      setMsg({ type: 'success', text: 'Consulta agendada com sucesso!' });
      setActiveTab('my-appointments');
      fetchMyAppointments();
      // Reset flow
      setStep(1);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
    } catch (error: any) {
      setMsg({ type: 'error', text: error.response?.data?.message || 'Erro ao agendar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Painel do Paciente">
      <div className="mb-6 flex space-x-4">
        <button
          onClick={() => setActiveTab('my-appointments')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'my-appointments' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Minhas Consultas
        </button>
        <button
          onClick={() => {
            setActiveTab('book');
            setStep(1);
            setSelectedDoctor(null);
            setSelectedDate('');
            setSelectedTime('');
            setAvailability(null);
            if (doctors.length === 0) {
              searchDoctors();
            }
          }}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'book' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Nova Consulta
        </button>
      </div>

      {msg.text && (
        <div className={`mb-4 p-4 rounded-md ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} className="float-right font-bold">&times;</button>
        </div>
      )}

      {activeTab === 'my-appointments' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {appointments.length === 0 && <p className="text-gray-500 col-span-3">Nenhuma consulta encontrada.</p>}
          {appointments.map((apt) => (
            <div key={apt._id} className="bg-white p-6 rounded-lg shadow border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600 mr-3">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{apt.doctorId.name}</h3>
                      <p className="text-sm text-gray-500">{apt.doctorId.specialty}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    {new Date(apt.appointmentDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {apt.appointmentTime}
                  </div>
                </div>
              </div>
              {apt.status === 'confirmed' && (
                <button
                  onClick={() => handleCancel(apt._id)}
                  className="w-full mt-2 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          {/* Step 1: Find Doctor */}
          {step === 1 && (
            <div className="max-w-xl mx-auto">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Encontre um Médico</h3>
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Filtrar por especialidade (ex: Cardiologia) ou deixe em branco"
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                />
                <button
                  onClick={searchDoctors}
                  className="bg-primary text-white px-6 py-2 rounded hover:bg-sky-600 flex items-center"
                  disabled={loading}
                >
                  <Search size={18} className="mr-2" /> Buscar
                </button>
              </div>

              {doctors.length > 0 && (
                <div className="space-y-3">
                  {doctors.map(doc => (
                    <div key={doc._id || doc.id} className="border p-4 rounded hover:border-primary cursor-pointer transition-colors flex justify-between items-center"
                      onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                    >
                      <div>
                        <p className="font-bold">{doc.name}</p>
                        <p className="text-sm text-gray-600">{doc.specialty}</p>
                      </div>
                      <Plus className="text-primary" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Pick Date */}
          {step === 2 && selectedDoctor && (
             <div className="max-w-xl mx-auto">
             <div className="flex items-center mb-4 text-sm text-gray-500 cursor-pointer hover:text-primary" onClick={() => setStep(1)}>&larr; Voltar</div>
             <h3 className="text-xl font-semibold mb-4 text-gray-800">Escolha a Data com {selectedDoctor.name}</h3>
             
             <div className="flex flex-col gap-4">
               <label className="block">
                 <span className="text-gray-700">Data da Consulta</span>
                 <input
                   type="date"
                   min={new Date().toISOString().split('T')[0]}
                   className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                 />
               </label>
               <button
                 onClick={checkAvailability}
                 disabled={!selectedDate || loading}
                 className="bg-primary text-white py-2 rounded hover:bg-sky-600 disabled:opacity-50"
               >
                 Ver Horários
               </button>
             </div>
           </div>
          )}

          {/* Step 3: Pick Time */}
          {step === 3 && availability && (
            <div className="max-w-2xl mx-auto">
               <div className="flex items-center mb-4 text-sm text-gray-500 cursor-pointer hover:text-primary" onClick={() => setStep(2)}>&larr; Voltar</div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Escolha o Horário</h3>
              
              {availability.dayOfWeek && (
                <div className="bg-blue-50 p-4 rounded mb-4">
                  <p className="font-medium text-blue-800">
                    {availability.dayOfWeek}
                    {availability.date && !isNaN(new Date(availability.date).getTime()) && (
                      <>, {new Date(availability.date).toLocaleDateString('pt-BR')}</>
                    )}
                  </p>
                </div>
              )}

              {availability.availableSlots.filter(s => s.available).length === 0 ? (
                <p className="text-red-500">Não há horários disponíveis para esta data.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-6">
                  {availability.availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                        !slot.available 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : selectedTime === slot.time
                            ? 'bg-primary text-white ring-2 ring-offset-2 ring-primary'
                            : 'bg-white border border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}

              {selectedTime && (
                <div className="space-y-4 border-t pt-4">
                  <label className="block">
                    <span className="text-gray-700">Observações (Opcional)</span>
                    <textarea
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 border"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Relate sintomas breves..."
                    />
                  </label>
                  <button
                    onClick={confirmBooking}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-md font-bold text-lg hover:bg-green-700 shadow-lg"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default PatientDashboard;
