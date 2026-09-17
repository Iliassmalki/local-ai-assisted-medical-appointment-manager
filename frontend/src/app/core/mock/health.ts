/**
 * Demonstration data. These are illustrative recorded values for the
 * prototype — they are not measurements and carry no clinical meaning.
 */

export interface Vital {
  key: string;
  label: string;
  value: string;
  unit: string;
  recordedAt: string;
  source: string;
  trend: 'up' | 'down' | 'flat';
  series: number[];
}

export const VITALS: Vital[] = [
  {
    key: 'bp', label: 'Tension artérielle', value: '122/78', unit: 'mmHg',
    recordedAt: '2026-09-12T08:10:00', source: 'Relevé au cabinet', trend: 'flat',
    series: [128, 126, 124, 125, 123, 122],
  },
  {
    key: 'hr', label: 'Fréquence cardiaque', value: '68', unit: 'bpm',
    recordedAt: '2026-09-14T07:05:00', source: 'Montre connectée', trend: 'down',
    series: [74, 73, 71, 70, 69, 68],
  },
  {
    key: 'weight', label: 'Poids', value: '74,2', unit: 'kg',
    recordedAt: '2026-09-10T07:40:00', source: 'Balance connectée', trend: 'up',
    series: [72.8, 73.1, 73.4, 73.6, 74.0, 74.2],
  },
  {
    key: 'steps', label: 'Activité (7 j)', value: '8 140', unit: 'pas / jour',
    recordedAt: '2026-09-15T22:00:00', source: 'Application mobile', trend: 'up',
    series: [6200, 6900, 7400, 7100, 7800, 8140],
  },
];

// ── Medical records ────────────────────────────────────────────────────
export type RecordCategory =
  | 'Diagnostics' | 'Comptes rendus' | 'Analyses' | 'Imagerie' | 'Ordonnances' | 'Autres';

export interface MedicalRecord {
  id: string;
  title: string;
  category: RecordCategory;
  date: string;
  author: string;
  facility: string;
  status: 'Disponible' | 'En attente' | 'Archivé';
  pages: number;
  size: string;
  summary: string;
  body: string[];
}

export const RECORD_CATEGORIES: RecordCategory[] =
  ['Diagnostics', 'Comptes rendus', 'Analyses', 'Imagerie', 'Ordonnances', 'Autres'];

export const RECORDS: MedicalRecord[] = [
  {
    id: 'r1', title: 'Compte rendu de consultation — cardiologie', category: 'Comptes rendus',
    date: '2026-09-02T11:00:00', author: 'Dr. Karim Idrissi', facility: 'Clinique du Littoral',
    status: 'Disponible', pages: 2, size: '184 Ko',
    summary: 'Consultation de suivi. Examen clinique et relevé tensionnel consignés.',
    body: [
      'Motif : consultation de suivi programmée.',
      'Relevé consigné lors de la consultation : tension 122/78 mmHg, fréquence 68 bpm.',
      'Examen clinique sans particularité rapportée ce jour.',
      'Conduite à tenir : poursuite du suivi, contrôle proposé dans six mois.',
    ],
  },
  {
    id: 'r2', title: 'Bilan sanguin complet', category: 'Analyses',
    date: '2026-08-28T08:30:00', author: 'Laboratoire Anfa Bio', facility: 'Laboratoire Anfa Bio',
    status: 'Disponible', pages: 3, size: '256 Ko',
    summary: 'Numération, glycémie à jeun et bilan lipidique.',
    body: [
      'Prélèvement réalisé à jeun le 28 août 2026.',
      'Numération formule sanguine : valeurs consignées dans le tableau des résultats.',
      'Glycémie à jeun et bilan lipidique joints.',
      'Les intervalles de référence du laboratoire figurent en regard de chaque valeur.',
    ],
  },
  {
    id: 'r3', title: 'Radiographie thoracique', category: 'Imagerie',
    date: '2026-08-12T14:20:00', author: 'Dr. Salma Bennani', facility: 'Centre d’Imagerie Anfa',
    status: 'Disponible', pages: 1, size: '1,4 Mo',
    summary: 'Cliché de face réalisé en position debout.',
    body: [
      'Examen : radiographie thoracique de face.',
      'Indication : bilan préopératoire.',
      'Le compte rendu du radiologue est joint au document.',
    ],
  },
  {
    id: 'r4', title: 'Ordonnance — traitement antihypertenseur', category: 'Ordonnances',
    date: '2026-09-02T11:30:00', author: 'Dr. Karim Idrissi', facility: 'Clinique du Littoral',
    status: 'Disponible', pages: 1, size: '96 Ko',
    summary: 'Renouvellement pour trois mois.',
    body: [
      'Ordonnance établie le 2 septembre 2026, valable trois mois.',
      'Les posologies figurent sur le document original signé par le prescripteur.',
      'Toute modification doit être discutée avec le médecin prescripteur.',
    ],
  },
  {
    id: 'r5', title: 'Synthèse du dossier médical', category: 'Diagnostics',
    date: '2026-06-15T09:00:00', author: 'Dr. Salma Bennani', facility: 'Centre Médical Anfa',
    status: 'Disponible', pages: 4, size: '312 Ko',
    summary: 'Historique, antécédents déclarés et traitements en cours.',
    body: [
      'Document de synthèse établi à partir des informations déclarées par le patient.',
      'Antécédents et allergies déclarés y sont consignés.',
      'Ce document ne remplace pas une consultation médicale.',
    ],
  },
  {
    id: 'r6', title: 'Certificat médical d’aptitude', category: 'Autres',
    date: '2026-05-04T10:45:00', author: 'Dr. Salma Bennani', facility: 'Centre Médical Anfa',
    status: 'Archivé', pages: 1, size: '74 Ko',
    summary: 'Certificat délivré pour la pratique sportive.',
    body: ['Certificat délivré le 4 mai 2026.', 'Durée de validité : douze mois à compter de la date d’émission.'],
  },
  {
    id: 'r7', title: 'Échographie abdominale', category: 'Imagerie',
    date: '2026-09-14T16:00:00', author: 'Centre d’Imagerie Anfa', facility: 'Centre d’Imagerie Anfa',
    status: 'En attente', pages: 0, size: '—',
    summary: 'Compte rendu en cours de rédaction par le radiologue.',
    body: ['Examen réalisé le 14 septembre 2026.', 'Le compte rendu sera disponible dès sa validation.'],
  },
];

// ── Prescriptions ──────────────────────────────────────────────────────
export interface Prescription {
  id: string;
  medication: string;
  form: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescriber: string;
  start: string;
  end: string;
  status: 'Active' | 'Terminée' | 'Suspendue';
  refills: number;
  notes: string;
}

export const PRESCRIPTIONS: Prescription[] = [
  {
    id: 'p1', medication: 'Amlodipine', form: 'Comprimé', dosage: '5 mg', frequency: '1 fois par jour',
    duration: '3 mois', prescriber: 'Dr. Karim Idrissi', start: '2026-09-02T00:00:00', end: '2026-12-02T00:00:00',
    status: 'Active', refills: 2, notes: 'Posologie telle qu’indiquée sur l’ordonnance du 2 septembre 2026.',
  },
  {
    id: 'p2', medication: 'Vitamine D3', form: 'Ampoule buvable', dosage: '100 000 UI', frequency: 'Dose unique mensuelle',
    duration: '3 mois', prescriber: 'Dr. Salma Bennani', start: '2026-08-01T00:00:00', end: '2026-11-01T00:00:00',
    status: 'Active', refills: 1, notes: 'Prescrit à la suite du bilan du 28 juillet 2026.',
  },
  {
    id: 'p3', medication: 'Amoxicilline', form: 'Gélule', dosage: '500 mg', frequency: '3 fois par jour',
    duration: '7 jours', prescriber: 'Dr. Salma Bennani', start: '2026-06-10T00:00:00', end: '2026-06-17T00:00:00',
    status: 'Terminée', refills: 0, notes: 'Traitement terminé, aucune reconduction prévue.',
  },
  {
    id: 'p4', medication: 'Crème émolliente', form: 'Tube 100 ml', dosage: 'Application locale', frequency: '2 fois par jour',
    duration: '1 mois', prescriber: 'Dr. Leila Cherkaoui', start: '2026-07-05T00:00:00', end: '2026-08-05T00:00:00',
    status: 'Terminée', refills: 0, notes: 'Zones d’application précisées sur l’ordonnance.',
  },
  {
    id: 'p5', medication: 'Fer + acide folique', form: 'Comprimé', dosage: '80 mg', frequency: '1 fois par jour',
    duration: '2 mois', prescriber: 'Dr. Salma Bennani', start: '2026-04-12T00:00:00', end: '2026-06-12T00:00:00',
    status: 'Suspendue', refills: 0, notes: 'Suspendu en attente du prochain bilan biologique.',
  },
];

// ── Lab results ────────────────────────────────────────────────────────
export interface LabResult {
  id: string;
  panel: string;
  test: string;
  value: number | null;
  unit: string;
  refLow: number;
  refHigh: number;
  date: string;
  lab: string;
  state: 'in-range' | 'out-of-range' | 'pending';
  history: { date: string; value: number }[];
}

export const LABS: LabResult[] = [
  {
    id: 'l1', panel: 'Bilan lipidique', test: 'Cholestérol total', value: 1.92, unit: 'g/L',
    refLow: 1.4, refHigh: 2.0, date: '2026-08-28T08:30:00', lab: 'Laboratoire Anfa Bio', state: 'in-range',
    history: [{ date: '2025-09-02T00:00:00', value: 2.05 }, { date: '2026-02-14T00:00:00', value: 1.98 }, { date: '2026-08-28T00:00:00', value: 1.92 }],
  },
  {
    id: 'l2', panel: 'Bilan lipidique', test: 'HDL', value: 0.42, unit: 'g/L',
    refLow: 0.45, refHigh: 0.9, date: '2026-08-28T08:30:00', lab: 'Laboratoire Anfa Bio', state: 'out-of-range',
    history: [{ date: '2025-09-02T00:00:00', value: 0.40 }, { date: '2026-02-14T00:00:00', value: 0.41 }, { date: '2026-08-28T00:00:00', value: 0.42 }],
  },
  {
    id: 'l3', panel: 'Glycémie', test: 'Glycémie à jeun', value: 0.94, unit: 'g/L',
    refLow: 0.7, refHigh: 1.1, date: '2026-08-28T08:30:00', lab: 'Laboratoire Anfa Bio', state: 'in-range',
    history: [{ date: '2025-09-02T00:00:00', value: 0.99 }, { date: '2026-02-14T00:00:00', value: 0.96 }, { date: '2026-08-28T00:00:00', value: 0.94 }],
  },
  {
    id: 'l4', panel: 'Numération', test: 'Hémoglobine', value: 13.8, unit: 'g/dL',
    refLow: 13.0, refHigh: 17.0, date: '2026-08-28T08:30:00', lab: 'Laboratoire Anfa Bio', state: 'in-range',
    history: [{ date: '2025-09-02T00:00:00', value: 13.2 }, { date: '2026-02-14T00:00:00', value: 13.5 }, { date: '2026-08-28T00:00:00', value: 13.8 }],
  },
  {
    id: 'l5', panel: 'Numération', test: 'Plaquettes', value: 268, unit: '10³/µL',
    refLow: 150, refHigh: 400, date: '2026-08-28T08:30:00', lab: 'Laboratoire Anfa Bio', state: 'in-range',
    history: [{ date: '2025-09-02T00:00:00', value: 254 }, { date: '2026-02-14T00:00:00', value: 261 }, { date: '2026-08-28T00:00:00', value: 268 }],
  },
  {
    id: 'l6', panel: 'Thyroïde', test: 'TSH', value: null, unit: 'mUI/L',
    refLow: 0.4, refHigh: 4.0, date: '2026-09-15T09:00:00', lab: 'Laboratoire Anfa Bio', state: 'pending',
    history: [{ date: '2026-02-14T00:00:00', value: 2.1 }],
  },
  {
    id: 'l7', panel: 'Vitamines', test: 'Vitamine D (25-OH)', value: 18, unit: 'ng/mL',
    refLow: 30, refHigh: 100, date: '2026-07-28T08:15:00', lab: 'Laboratoire Anfa Bio', state: 'out-of-range',
    history: [{ date: '2025-11-10T00:00:00', value: 15 }, { date: '2026-07-28T00:00:00', value: 18 }],
  },
];
