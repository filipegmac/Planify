export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  _id: string; // Mongoose uses _id
  id?: string; // Controller might return id
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  birthDate?: string;
  crm?: string;
  specialty?: string;
}

export interface SchedulePeriod {
  startTime: string;
  endTime: string;
}

export type Schedule = {
  [day: string]: SchedulePeriod[];
};

export interface Appointment {
  _id: string;
  patientId: User;
  doctorId: User;
  appointmentDate: string;
  appointmentTime: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailabilityResponse {
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  date: string;
  dayOfWeek: string;
  availableSlots: TimeSlot[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Stats {
  total: number;
  confirmed: number;
  cancelled: number;
  completed: number;
}
