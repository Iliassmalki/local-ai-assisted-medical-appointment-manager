const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** "jeudi 4 octobre 2026" */
export function longDate(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '—';
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "4 oct. 2026" */
export function shortDate(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 4)}. ${d.getFullYear()}`;
}

/** "14:30" */
export function time(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '—';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function dateTime(iso: string | null | undefined): string {
  const d = parse(iso);
  return d ? `${shortDate(iso)} · ${time(iso)}` : '—';
}

/** "dans 3 jours" / "il y a 2 h" */
export function relative(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '—';
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const unit = mins < 60 ? `${mins} min` : hours < 24 ? `${hours} h` : days === 1 ? '1 jour' : `${days} jours`;
  if (mins < 1) return "à l'instant";
  return diff > 0 ? `dans ${unit}` : `il y a ${unit}`;
}

export function isFuture(iso: string | null | undefined): boolean {
  const d = parse(iso);
  return d ? d.getTime() > Date.now() : false;
}

/** Initials for avatars: "Imad Echchaab" -> "IE" */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** <input type="datetime-local"> gives "2026-10-04T14:30"; the API wants seconds. */
export function toApiDateTime(local: string): string {
  return local.length === 16 ? `${local}:00` : local;
}

/** ISO from the API -> value for <input type="datetime-local">. */
export function toLocalInput(iso: string | null | undefined): string {
  const d = parse(iso);
  if (!d) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
