/**
 * Demonstration data. Practitioners, clinics, prices and reviews below are
 * fictional and exist only to populate the prototype UI.
 */

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  /** Matches a backend Medecin account so the booking flow can post a real appointment. */
  email: string;
  years: number;
  languages: string[];
  rating: number;
  reviewCount: number;
  price: number;
  city: string;
  clinic: string;
  address: string;
  modes: ('Cabinet' | 'Téléconsultation' | 'Domicile')[];
  nextSlot: string;
  accepting: boolean;
  bio: string;
  qualifications: string[];
  focus: string[];
  reviews: Review[];
}

export const SPECIALTIES = [
  'Médecine générale', 'Cardiologie', 'Dermatologie', 'Pédiatrie',
  'Gynécologie', 'Ophtalmologie', 'Psychiatrie', 'Orthopédie',
];

export const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Tanger'];

export const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Salma Bennani',
    specialty: 'Médecine générale',
    email: 'salma.bennani@medora.ma',
    years: 12,
    languages: ['Français', 'Arabe', 'Anglais'],
    rating: 4.8,
    reviewCount: 214,
    price: 300,
    city: 'Casablanca',
    clinic: 'Centre Médical Anfa',
    address: '42 Boulevard d’Anfa, Casablanca',
    modes: ['Cabinet', 'Téléconsultation'],
    nextSlot: 'Demain, 09:30',
    accepting: true,
    bio: "Médecin généraliste exerçant en cabinet de ville. Prise en charge du suivi courant de l'adulte, des bilans de santé annuels et de l'orientation vers les spécialistes.",
    qualifications: ['Doctorat en médecine', 'Diplôme de médecine générale', 'Formation en éducation thérapeutique'],
    focus: ['Suivi chronique', 'Bilans de santé', 'Vaccination', 'Certificats médicaux'],
    reviews: [
      { author: 'Nadia E.', rating: 5, date: '2026-08-14T10:00:00', text: 'Consultation claire, explications détaillées et sans précipitation.' },
      { author: 'Youssef A.', rating: 5, date: '2026-07-29T16:30:00', text: 'Prise en charge rapide, cabinet très bien organisé.' },
      { author: 'Hind M.', rating: 4, date: '2026-07-02T11:15:00', text: "Un peu d'attente le jour du rendez-vous, mais un suivi sérieux." },
    ],
  },
  {
    id: 'd2',
    name: 'Dr. Karim Idrissi',
    specialty: 'Cardiologie',
    email: 'karim.idrissi@medora.ma',
    years: 18,
    languages: ['Français', 'Arabe'],
    rating: 4.9,
    reviewCount: 341,
    price: 600,
    city: 'Casablanca',
    clinic: 'Clinique du Littoral',
    address: '15 Rue Ibn Sina, Casablanca',
    modes: ['Cabinet', 'Téléconsultation'],
    nextSlot: 'Lun. 21 sept., 11:00',
    accepting: true,
    bio: 'Cardiologue. Consultations de suivi cardiovasculaire, épreuves d’effort et échocardiographie au sein d’un plateau technique partagé.',
    qualifications: ['Doctorat en médecine', 'Spécialité en cardiologie', 'Diplôme d’échocardiographie'],
    focus: ['Hypertension artérielle', 'Suivi post-opératoire', 'Échocardiographie', 'Épreuve d’effort'],
    reviews: [
      { author: 'Rachid B.', rating: 5, date: '2026-09-01T09:20:00', text: 'Explications très pédagogiques sur les résultats de mes examens.' },
      { author: 'Samira K.', rating: 5, date: '2026-08-11T14:40:00', text: 'Suivi rigoureux, compte-rendu envoyé le jour même.' },
    ],
  },
  {
    id: 'd3',
    name: 'Dr. Leila Cherkaoui',
    specialty: 'Dermatologie',
    email: 'leila.cherkaoui@medora.ma',
    years: 9,
    languages: ['Français', 'Arabe', 'Espagnol'],
    rating: 4.7,
    reviewCount: 158,
    price: 450,
    city: 'Rabat',
    clinic: 'Cabinet Agdal Santé',
    address: '8 Avenue de France, Rabat',
    modes: ['Cabinet', 'Téléconsultation'],
    nextSlot: 'Mer. 23 sept., 15:00',
    accepting: true,
    bio: 'Dermatologue. Consultations de dermatologie générale, suivi des grains de beauté et dermatologie pédiatrique.',
    qualifications: ['Doctorat en médecine', 'Spécialité en dermatologie'],
    focus: ['Dépistage des grains de beauté', 'Acné', 'Eczéma', 'Dermatologie pédiatrique'],
    reviews: [
      { author: 'Imane T.', rating: 5, date: '2026-08-25T13:00:00', text: 'Diagnostic rapide et traitement bien expliqué.' },
      { author: 'Omar L.', rating: 4, date: '2026-06-18T10:10:00', text: 'Bon accueil, délai de rendez-vous raisonnable.' },
    ],
  },
  {
    id: 'd4',
    name: 'Dr. Mehdi Tazi',
    specialty: 'Pédiatrie',
    email: 'mehdi.tazi@medora.ma',
    years: 15,
    languages: ['Français', 'Arabe', 'Anglais'],
    rating: 4.9,
    reviewCount: 276,
    price: 350,
    city: 'Casablanca',
    clinic: 'Polyclinique Maârif',
    address: '120 Rue Mustapha El Maani, Casablanca',
    modes: ['Cabinet', 'Domicile'],
    nextSlot: 'Aujourd’hui, 17:45',
    accepting: true,
    bio: 'Pédiatre. Suivi du nourrisson et de l’enfant, consultations de croissance et calendrier vaccinal.',
    qualifications: ['Doctorat en médecine', 'Spécialité en pédiatrie'],
    focus: ['Suivi du nourrisson', 'Vaccination', 'Croissance', 'Allergies'],
    reviews: [
      { author: 'Fatima Z.', rating: 5, date: '2026-09-05T08:45:00', text: 'Très rassurant avec les enfants, on ne se sent jamais pressés.' },
    ],
  },
  {
    id: 'd5',
    name: 'Dr. Nawal Amrani',
    specialty: 'Gynécologie',
    email: 'nawal.amrani@medora.ma',
    years: 14,
    languages: ['Français', 'Arabe'],
    rating: 4.8,
    reviewCount: 190,
    price: 500,
    city: 'Marrakech',
    clinic: 'Centre Guéliz Médical',
    address: '3 Avenue Mohammed V, Marrakech',
    modes: ['Cabinet', 'Téléconsultation'],
    nextSlot: 'Ven. 25 sept., 10:15',
    accepting: false,
    bio: 'Gynécologue-obstétricienne. Suivi gynécologique, suivi de grossesse et échographie.',
    qualifications: ['Doctorat en médecine', 'Spécialité en gynécologie-obstétrique'],
    focus: ['Suivi de grossesse', 'Échographie', 'Dépistage', 'Contraception'],
    reviews: [
      { author: 'Khadija R.', rating: 5, date: '2026-07-19T12:00:00', text: 'Suivi de grossesse impeccable du début à la fin.' },
    ],
  },
  {
    id: 'd6',
    name: 'Dr. Younes Berrada',
    specialty: 'Ophtalmologie',
    email: 'younes.berrada@medora.ma',
    years: 11,
    languages: ['Français', 'Arabe', 'Anglais'],
    rating: 4.6,
    reviewCount: 132,
    price: 400,
    city: 'Tanger',
    clinic: 'Vision Center Tanger',
    address: '55 Avenue Moulay Youssef, Tanger',
    modes: ['Cabinet'],
    nextSlot: 'Jeu. 24 sept., 09:00',
    accepting: true,
    bio: 'Ophtalmologue. Bilans visuels, adaptation de correction optique et dépistage du glaucome.',
    qualifications: ['Doctorat en médecine', 'Spécialité en ophtalmologie'],
    focus: ['Bilan visuel', 'Glaucome', 'Correction optique', 'Fond d’œil'],
    reviews: [
      { author: 'Aya S.', rating: 5, date: '2026-08-02T15:30:00', text: 'Examen complet, matériel récent.' },
    ],
  },
];

/** Half-hour slots offered by the booking flow. Availability is simulated. */
export const SLOTS = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

/** Deterministic pseudo-availability so the UI stays stable between renders. */
export function slotTaken(doctorId: string, date: string, slot: string): boolean {
  const seed = [...(doctorId + date + slot)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 7 < 2;
}
