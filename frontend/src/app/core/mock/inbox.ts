/** Demonstration data for the messaging, notification and activity surfaces. */

export interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: string;
  attachment?: { name: string; size: string };
}

export interface Conversation {
  id: string;
  doctor: string;
  specialty: string;
  online: boolean;
  lastAt: string;
  unread: number;
  messages: Message[];
}

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1', doctor: 'Dr. Karim Idrissi', specialty: 'Cardiologie', online: true,
    lastAt: '2026-09-16T09:42:00', unread: 2,
    messages: [
      { id: 'm1', from: 'me', at: '2026-09-15T17:20:00', text: 'Bonjour Docteur, j’ai bien récupéré les résultats du bilan lipidique.' },
      { id: 'm2', from: 'them', at: '2026-09-15T18:05:00', text: 'Bonjour, parfait. Pouvez-vous me les transmettre avant le rendez-vous ?' },
      { id: 'm3', from: 'me', at: '2026-09-16T09:12:00', text: 'Voici le document.', attachment: { name: 'bilan-sanguin-28-08.pdf', size: '256 Ko' } },
      { id: 'm4', from: 'them', at: '2026-09-16T09:40:00', text: 'Bien reçu, merci.' },
      { id: 'm5', from: 'them', at: '2026-09-16T09:42:00', text: 'Nous les reprendrons ensemble lors de la consultation.' },
    ],
  },
  {
    id: 'c2', doctor: 'Dr. Salma Bennani', specialty: 'Médecine générale', online: false,
    lastAt: '2026-09-11T14:05:00', unread: 0,
    messages: [
      { id: 'm6', from: 'me', at: '2026-09-11T13:40:00', text: 'Bonjour, le certificat médical est-il prêt ?' },
      { id: 'm7', from: 'them', at: '2026-09-11T14:05:00', text: 'Bonjour, il est déposé dans votre dossier médical, rubrique « Autres ».' },
    ],
  },
  {
    id: 'c3', doctor: 'Dr. Leila Cherkaoui', specialty: 'Dermatologie', online: false,
    lastAt: '2026-08-26T10:30:00', unread: 0,
    messages: [
      { id: 'm8', from: 'them', at: '2026-08-26T10:30:00', text: 'Le contrôle est à prévoir dans trois mois, vous pouvez le réserver dès maintenant.' },
    ],
  },
];

export type NotifCategory = 'Rendez-vous' | 'Dossier médical' | 'Analyses' | 'Messages' | 'Système';

export interface Notification {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

export const NOTIF_CATEGORIES: NotifCategory[] =
  ['Rendez-vous', 'Dossier médical', 'Analyses', 'Messages', 'Système'];

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', category: 'Analyses', title: 'Nouveaux résultats disponibles', body: 'Le bilan sanguin du 28 août 2026 est consultable dans « Analyses ».', at: '2026-09-16T08:05:00', read: false },
  { id: 'n2', category: 'Messages', title: 'Réponse de Dr. Karim Idrissi', body: '« Nous les reprendrons ensemble lors de la consultation. »', at: '2026-09-16T09:42:00', read: false },
  { id: 'n3', category: 'Rendez-vous', title: 'Rendez-vous confirmé', body: 'Votre demande du 12 septembre a été approuvée par le praticien.', at: '2026-09-13T16:20:00', read: false },
  { id: 'n4', category: 'Dossier médical', title: 'Document ajouté', body: 'Compte rendu de consultation — cardiologie.', at: '2026-09-02T12:10:00', read: true },
  { id: 'n5', category: 'Système', title: 'Nouvelle connexion', body: 'Connexion depuis Chrome sur Linux, à Casablanca.', at: '2026-09-01T07:55:00', read: true },
  { id: 'n6', category: 'Rendez-vous', title: 'Rappel de rendez-vous', body: 'Consultation de suivi prévue demain à 09:30.', at: '2026-08-31T09:00:00', read: true },
];

export interface Activity {
  id: string;
  kind: 'lab' | 'rx' | 'appt' | 'record';
  title: string;
  detail: string;
  at: string;
}

export const ACTIVITY: Activity[] = [
  { id: 'a1', kind: 'lab', title: 'Résultats d’analyses disponibles', detail: 'Bilan sanguin complet — Laboratoire Anfa Bio', at: '2026-09-16T08:05:00' },
  { id: 'a2', kind: 'rx', title: 'Ordonnance mise à jour', detail: 'Amlodipine 5 mg — Dr. Karim Idrissi', at: '2026-09-02T11:30:00' },
  { id: 'a3', kind: 'appt', title: 'Consultation terminée', detail: 'Cardiologie — Clinique du Littoral', at: '2026-09-02T11:00:00' },
  { id: 'a4', kind: 'record', title: 'Document ajouté au dossier', detail: 'Radiographie thoracique — Centre d’Imagerie Anfa', at: '2026-08-12T14:20:00' },
];

export interface EmergencyContact { name: string; relation: string; phone: string; }

export const EMERGENCY = {
  bloodType: 'O+',
  allergies: ['Pénicilline (déclarée)'],
  conditions: ['Hypertension artérielle (suivie)'],
  treatments: ['Amlodipine 5 mg'],
  ambulance: '+212 07 73 69 09 48',
  contacts: <EmergencyContact[]>[
    { name: 'Amine Malki', relation: 'Frère', phone: '+212 6 61 22 14 08' },
    { name: 'Centre Médical Anfa', relation: 'Cabinet référent', phone: '+212 5 22 39 10 44' },
  ],
};

export const DEVICES = [
  { id: 'dev1', name: 'Chrome — Linux', location: 'Casablanca, MA', lastSeen: '2026-09-16T08:02:00', current: true },
  { id: 'dev2', name: 'Medora iOS — iPhone 14', location: 'Casablanca, MA', lastSeen: '2026-09-15T21:14:00', current: false },
  { id: 'dev3', name: 'Firefox — Windows', location: 'Rabat, MA', lastSeen: '2026-08-30T12:40:00', current: false },
];
