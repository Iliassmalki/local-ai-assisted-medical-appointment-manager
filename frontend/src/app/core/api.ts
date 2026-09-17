import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API } from './api-url';
import { Auth } from './auth';
import type {
  AdminDashboard, AssignPatientDto, CreateRendezvous, MedecinDashboard,
  PatientDashboard, PatientDto, RendezVous,
} from './models';

/**
 * One method per Spring Boot endpoint. Kept flat on purpose: the controller
 * surface is small enough that a facade per role would only add indirection.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private auth = inject(Auth);

  // ── ADMIN — AdminController, @PreAuthorize hasRole('ADMIN') ───────────
  adminDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${API}/admin/dashboard`);
  }

  // ── PATIENT — PatientControler, @PreAuthorize hasRole('PATIENT') ──────
  /** Login returns only a token, so this is where the patient's real name first arrives. */
  patientDashboard(): Observable<PatientDashboard> {
    return this.http.get<PatientDashboard>(`${API}/api/patient/dashboard`)
      .pipe(tap(d => { if (d.name) this.auth.setName(d.name); }));
  }
  bookAppointment(body: CreateRendezvous): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${API}/api/patient/assign`, body);
  }
  updateMyAppointment(id: number, body: RendezVous): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${API}/api/patient/update/${id}`, body);
  }
  cancelMyAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/patient/delete/${id}`);
  }

  // ── MEDECIN — MedecinController, @PreAuthorize hasRole('MEDECIN') ─────
  medecinDashboard(): Observable<MedecinDashboard> {
    return this.http.get<MedecinDashboard>(`${API}/api/medecin/dashboard`);
  }
  /** PUT, not GET — matches the controller's mapping. */
  medecinPatients(): Observable<PatientDto[]> {
    return this.http.put<PatientDto[]>(`${API}/api/medecin/getallpatients`, {});
  }
  medecinPatient(patientId: number): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${API}/api/medecin/patients/getpatient/${patientId}`, {});
  }
  addPatient(email: string): Observable<AssignPatientDto> {
    return this.http.post<AssignPatientDto>(`${API}/api/medecin/addpatient/${encodeURIComponent(email)}`, {});
  }
  updatePatient(patientId: number, body: PatientDto): Observable<PatientDto> {
    return this.http.put<PatientDto>(`${API}/api/medecin/updatePatient/${patientId}`, body);
  }
  /** DELETE carries a body here — the controller reads the id from PatientDto. */
  deletePatient(patient: PatientDto): Observable<void> {
    return this.http.delete<void>(`${API}/api/medecin/deletePatient/${patient.id}`, { body: patient });
  }

  medecinAppointments(): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${API}/api/medecin/rendezvous/getallrendezvous`);
  }
  medecinAppointment(id: number): Observable<RendezVous> {
    return this.http.get<RendezVous>(`${API}/api/medecin/rendezvous/getrendezvous/${id}`);
  }
  medecinUpdateAppointment(id: number, body: RendezVous): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${API}/api/medecin/rendezvous/updaterendezvous/${id}`, body);
  }
  medecinDeleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/api/medecin/rendezvous/deleterendezvous/${id}`);
  }
  approve(id: number): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${API}/api/medecin/${id}/approve`, {});
  }
  reject(id: number): Observable<RendezVous> {
    return this.http.post<RendezVous>(`${API}/api/medecin/${id}/reject`, {});
  }

  // ── ASSISTANT — ChatController (langchain4j + Ollama), public ─────────
  chat(message: string): Observable<string> {
    return this.http.post(`${API}/api/chat`, { message }, { responseType: 'text' });
  }
}
