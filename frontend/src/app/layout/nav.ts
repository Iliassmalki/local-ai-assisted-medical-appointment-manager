import type { Role } from '../core/models';

export interface NavItem { label: string; path: string; icon: string; exact?: boolean; }

/** Sidebar entries per authority — mirrors the backend's @PreAuthorize split. */
export const NAV: Record<Role, NavItem[]> = {
  PATIENT: [
    { label: 'Vue d’ensemble', path: '/app', icon: 'grid', exact: true },
    { label: 'Rendez-vous', path: '/app/rendez-vous', icon: 'calendar' },
    { label: 'Médecins', path: '/app/medecins', icon: 'stethoscope' },
    { label: 'Dossier médical', path: '/app/dossier', icon: 'folder' },
    { label: 'Ordonnances', path: '/app/ordonnances', icon: 'pill' },
    { label: 'Analyses', path: '/app/analyses', icon: 'flask' },
    { label: 'Messages', path: '/app/messages', icon: 'chat' },
    { label: 'Notifications', path: '/app/notifications', icon: 'bell' },
    { label: 'Paramètres', path: '/app/parametres', icon: 'gear' },
  ],
  MEDECIN: [
    { label: 'Console', path: '/praticien', icon: 'grid', exact: true },
    { label: 'Rendez-vous', path: '/praticien/rendez-vous', icon: 'calendar' },
    { label: 'Patients', path: '/praticien/patients', icon: 'users' },
    { label: 'Messages', path: '/praticien/messages', icon: 'chat' },
    { label: 'Paramètres', path: '/praticien/parametres', icon: 'gear' },
  ],
  ADMIN: [
    { label: 'Supervision', path: '/admin', icon: 'shield', exact: true },
    { label: 'Paramètres', path: '/admin/parametres', icon: 'gear' },
  ],
};

/** The four entries promoted to the mobile bottom bar. */
export const MOBILE: Record<Role, string[]> = {
  PATIENT: ['/app', '/app/rendez-vous', '/app/medecins', '/app/messages'],
  MEDECIN: ['/praticien', '/praticien/rendez-vous', '/praticien/patients', '/praticien/messages'],
  ADMIN: ['/admin', '/admin/parametres'],
};

export const ROLE_LABEL: Record<Role, string> = {
  PATIENT: 'Patient',
  MEDECIN: 'Praticien',
  ADMIN: 'Administrateur',
};
