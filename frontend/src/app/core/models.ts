/** Types mirroring the Spring Boot DTOs (org.example.gestionrendezvousmedic.dtos). */

export type Role = 'PATIENT' | 'MEDECIN' | 'ADMIN';
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  /** Access-token lifetime in milliseconds. */
  expiresIn: number;
}
export interface MedecinSignupResponse {
  message: string;
  token: string;
  refreshToken: string;
  user: { id: number; name: string; email: string; role: string; specialite: string };
}

export interface LoginRequest { email: string; password: string; role: Role; }
export interface RegisterRequest { name: string; email: string; password: string; specialite?: string; }

/** AdminDashboardDto */
export interface AdminDashboard {
  totalUsers: number;
  totalAppointments: number;
  activeDoctors: number;
  activePatients: number;
}

/** AppointmentSummaryDto */
export interface AppointmentSummary {
  patientName: string;
  appointmentDate: string;
  status: Status;
}

/** PatientsummaryDto */
export interface PatientSummary { name: string; email: string; }

/** MedecinDashboardDto */
export interface MedecinDashboard {
  totalAppointments: number;
  totalPatients: number;
  recentAppointments: AppointmentSummary[];
  listofclients: PatientSummary[];
}

/** PatientDto */
export interface PatientDto {
  id: number | null;
  name: string;
  email: string;
  password?: string | null;
}

/** AssignPatientDto */
export interface AssignPatientDto { patientemail: string; medecinId: number; }

/** RendezVousDto — `date` is an ISO local date-time, e.g. 2026-10-04T14:30:00 */
export interface RendezVous {
  id: number | null;
  medecinId: number | null;
  patientId: number | null;
  reason: string | null;
  date: string;
  status: Status | null;
}

/** CreateRendezvousDTO */
export interface CreateRendezvous {
  patientEmail?: string;
  medecinEmail: string;
  date: string;
  reason: string;
}

/** PatientDashboardDto */
export interface PatientDashboard {
  name: string;
  medecinName: string;
  medecinEmail: string;
  email: string;
  nombreRendezvous: number;
  listerendezVous: RendezVous[];
}

export interface SessionUser { email: string; role: Role; name: string; }
