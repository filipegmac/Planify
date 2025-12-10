import axios from 'axios';
import { AuthResponse, User, Appointment, AvailabilityResponse, Stats, Schedule } from '../types';
import { safeStorage } from '../utils/storage';

// URL da API - usa variável de ambiente ou localhost como padrão
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = safeStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const userService = {
  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response = await api.get('/users');
    return response.data;
  },
  createPatient: async (data: any): Promise<void> => {
    await api.post('/users/patients', data);
  },
  createDoctor: async (data: any): Promise<void> => {
    await api.post('/users/doctors', data);
  },
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
  getDoctorsBySpecialty: async (specialty?: string): Promise<{ doctors: User[] }> => {
    const params = specialty ? { specialty } : {};
    const response = await api.get('/appointments/doctors', { params });
    return response.data;
  },
  getMySchedule: async (): Promise<{ schedule: Schedule }> => {
    const response = await api.get('/users/me/schedule');
    return response.data;
  },
  updateMySchedule: async (schedule: Schedule): Promise<{ message: string; schedule: Schedule }> => {
    const response = await api.put('/users/me/schedule', { schedule });
    return response.data;
  },
};

export const appointmentService = {
  getDoctorAvailability: async (doctorId: string, date: string): Promise<AvailabilityResponse> => {
    const response = await api.get(`/appointments/doctors/${doctorId}/availability?date=${date}`);
    return response.data;
  },
  createAppointment: async (doctorId: string, date: string, time: string, notes?: string): Promise<Appointment> => {
    const response = await api.post('/appointments', {
      doctorId,
      appointmentDate: date,
      appointmentTime: time,
      notes,
    });
    return response.data.appointment;
  },
  getMyAppointments: async (): Promise<{ appointments: Appointment[] }> => {
    const response = await api.get('/appointments/my-appointments');
    return response.data;
  },
  getDoctorSchedule: async (): Promise<{ stats: Stats; appointments: Appointment[] }> => {
    const response = await api.get('/appointments/schedule?filter=month');
    return response.data;
  },
  cancelAppointment: async (id: string): Promise<void> => {
    await api.patch(`/appointments/${id}/cancel`);
  },
  getAllAppointments: async (): Promise<{ appointments: Appointment[] }> => {
    const response = await api.get('/appointments/all/appointments');
    return response.data;
  }
};

export default api;
