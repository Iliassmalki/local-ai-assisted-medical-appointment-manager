import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'connexion' },

  {
    path: 'connexion',
    canActivate: [guestGuard],
    title: 'Connexion — Medora',
    loadComponent: () => import('./pages/login').then(m => m.Login),
  },
  {
    path: 'inscription',
    canActivate: [guestGuard],
    title: 'Créer un compte — Medora',
    loadComponent: () => import('./pages/register').then(m => m.Register),
  },

  // ── Patient space (ROLE_PATIENT) ─────────────────────────────────────
  {
    path: 'app',
    component: Shell,
    canActivate: [roleGuard('PATIENT')],
    children: [
      { path: '', title: 'Vue d’ensemble — Medora', loadComponent: () => import('./pages/patient/overview').then(m => m.PatientOverview) },
      { path: 'rendez-vous', title: 'Mes rendez-vous — Medora', loadComponent: () => import('./pages/patient/appointments').then(m => m.PatientAppointments) },
      { path: 'rendez-vous/nouveau', title: 'Prendre rendez-vous — Medora', loadComponent: () => import('./pages/patient/book').then(m => m.PatientBook) },
      { path: 'medecins', title: 'Trouver un praticien — Medora', loadComponent: () => import('./pages/patient/doctors').then(m => m.PatientDoctors) },
      { path: 'medecins/:id', title: 'Profil du praticien — Medora', loadComponent: () => import('./pages/patient/doctor-profile').then(m => m.DoctorProfile) },
      { path: 'dossier', title: 'Dossier médical — Medora', loadComponent: () => import('./pages/patient/records').then(m => m.PatientRecords) },
      { path: 'ordonnances', title: 'Ordonnances — Medora', loadComponent: () => import('./pages/patient/prescriptions').then(m => m.PatientPrescriptions) },
      { path: 'analyses', title: 'Analyses — Medora', loadComponent: () => import('./pages/patient/labs').then(m => m.PatientLabs) },
      { path: 'messages', title: 'Messagerie — Medora', loadComponent: () => import('./pages/messages').then(m => m.Messages) },
      { path: 'notifications', title: 'Notifications — Medora', loadComponent: () => import('./pages/patient/notifications').then(m => m.PatientNotifications) },
      { path: 'parametres', title: 'Paramètres — Medora', loadComponent: () => import('./pages/settings').then(m => m.Settings) },
    ],
  },

  // ── Practitioner space (ROLE_MEDECIN) ────────────────────────────────
  {
    path: 'praticien',
    component: Shell,
    canActivate: [roleGuard('MEDECIN')],
    children: [
      { path: '', title: 'Console praticien — Medora', loadComponent: () => import('./pages/medecin/console').then(m => m.MedecinConsole) },
      { path: 'rendez-vous', title: 'Planning — Medora', loadComponent: () => import('./pages/medecin/appointments').then(m => m.MedecinAppointments) },
      { path: 'patients', title: 'Patientèle — Medora', loadComponent: () => import('./pages/medecin/patients').then(m => m.MedecinPatients) },
      { path: 'messages', title: 'Messagerie — Medora', loadComponent: () => import('./pages/messages').then(m => m.Messages) },
      { path: 'parametres', title: 'Paramètres — Medora', loadComponent: () => import('./pages/settings').then(m => m.Settings) },
    ],
  },

  // ── Administration (ROLE_ADMIN) ──────────────────────────────────────
  {
    path: 'admin',
    component: Shell,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', title: 'Supervision — Medora', loadComponent: () => import('./pages/admin/console').then(m => m.AdminConsole) },
      { path: 'parametres', title: 'Paramètres — Medora', loadComponent: () => import('./pages/settings').then(m => m.Settings) },
    ],
  },

  { path: '**', loadComponent: () => import('./pages/not-found').then(m => m.NotFound) },
];
