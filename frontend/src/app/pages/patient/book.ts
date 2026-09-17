import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { Auth } from '../../core/auth';
import { apiError } from '../../core/auth-interceptor';
import { Toasts } from '../../core/toast';
import { longDate, toApiDateTime } from '../../core/format';
import { DOCTORS, SLOTS, slotTaken, type Doctor } from '../../core/mock/doctors';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiSkeleton } from '../../ui/ui';
import type { PatientDashboard } from '../../core/models';

@Component({
  selector: 'app-patient-book',
  imports: [FormsModule, RouterLink, Icon, UiAvatar, UiSkeleton],
  template: `
    <div class="page" style="max-width:940px">
      <header class="page-head">
        <a class="btn quiet sm" routerLink="/app/rendez-vous" style="margin-left:-11px;margin-bottom:8px">
          <ui-icon name="arrowLeft" [size]="14" /> Retour aux rendez-vous
        </a>
        <h1>Prendre rendez-vous</h1>
        <p>Votre demande est transmise au praticien, qui la confirme ou la refuse.</p>
      </header>

      <!-- Stepper -->
      <div class="card mb-3"><div class="card-body" style="padding:16px 20px">
        <div class="steps">
          @for (s of stepLabels; track $index; let i = $index; let last = $last) {
            <div class="step" [class.on]="step() === i + 1" [class.done]="step() > i + 1">
              <span class="n">
                @if (step() > i + 1) { <ui-icon name="check" [size]="12" [width]="3" /> } @else { {{ i + 1 }} }
              </span>
              <span class="t">{{ s }}</span>
            </div>
            @if (!last) { <span class="step-line"></span> }
          }
        </div>
      </div></div>

      @if (loading()) {
        <div class="card"><div class="card-body"><ui-skeleton [count]="4" [height]="24" /></div></div>
      } @else {

      <!-- 1 · Doctor -->
      @if (step() === 1) {
        <section class="card">
          <header class="card-head"><h2>Choisir le praticien</h2></header>
          <div class="card-body">
            @if (!assigned()) {
              <div class="alert a-warn">
                <ui-icon name="alert" [size]="17" />
                <div>
                  <strong>Vous n’êtes rattaché à aucun praticien.</strong><br />
                  Le praticien doit d’abord vous ajouter à sa patientèle depuis sa console,
                  à partir de votre e-mail <strong>{{ email() }}</strong>.
                </div>
              </div>
            } @else {
              <p class="hint mb-2">
                Seul votre praticien référent peut recevoir une demande : le serveur vérifie ce rattachement
                avant d’enregistrer le rendez-vous.
              </p>
              <button type="button" class="pick on" (click)="step.set(2)">
                <ui-avatar [name]="doctorName()" size="lg" />
                <span class="info">
                  <strong>{{ doctorName() }}</strong>
                  <small class="muted">{{ profile()?.specialty || 'Praticien référent' }}</small>
                  <small class="faint">{{ profile()?.clinic || 'Cabinet' }}</small>
                </span>
                <span class="badge b-ok">Référent</span>
              </button>

              @if (others().length) {
                <p class="hint mt-3 mb-1">Autres praticiens — rattachement requis avant toute demande.</p>
                @for (d of others(); track d.id) {
                  <div class="pick off">
                    <ui-avatar [name]="d.name" size="lg" tone="neutral" />
                    <span class="info">
                      <strong>{{ d.name }}</strong>
                      <small class="muted">{{ d.specialty }}</small>
                      <small class="faint">{{ d.clinic }} · {{ d.city }}</small>
                    </span>
                    <a class="btn sm secondary" [routerLink]="['/app/medecins', d.id]">Voir le profil</a>
                  </div>
                }
              }
            }
          </div>
        </section>
      }

      <!-- 2 · Consultation type -->
      @if (step() === 2) {
        <section class="card">
          <header class="card-head"><h2>Type de consultation</h2></header>
          <div class="card-body">
            <div class="grid g3">
              @for (m of modes(); track m.key) {
                <button type="button" class="tile" [class.on]="mode() === m.key" (click)="mode.set(m.key)">
                  <span class="ic"><ui-icon [name]="m.icon" [size]="19" /></span>
                  <strong>{{ m.key }}</strong>
                  <small class="muted">{{ m.hint }}</small>
                </button>
              }
            </div>
          </div>
          <footer class="card-foot between">
            <button type="button" class="btn secondary" (click)="step.set(1)">Retour</button>
            <button type="button" class="btn" (click)="step.set(3)">Continuer</button>
          </footer>
        </section>
      }

      <!-- 3 · Date -->
      @if (step() === 3) {
        <section class="card">
          <header class="card-head"><h2>Choisir une date</h2></header>
          <div class="card-body">
            <div class="days">
              @for (d of days(); track d.iso) {
                <button type="button" class="day" [class.on]="date() === d.iso" (click)="date.set(d.iso)">
                  <small>{{ d.dow }}</small>
                  <b class="num">{{ d.num }}</b>
                  <small>{{ d.mon }}</small>
                </button>
              }
            </div>
            <p class="hint mt-2">Créneaux affichés à titre indicatif dans ce prototype.</p>
          </div>
          <footer class="card-foot between">
            <button type="button" class="btn secondary" (click)="step.set(2)">Retour</button>
            <button type="button" class="btn" [disabled]="!date()" (click)="step.set(4)">Continuer</button>
          </footer>
        </section>
      }

      <!-- 4 · Time -->
      @if (step() === 4) {
        <section class="card">
          <header class="card-head">
            <h2>Choisir un créneau</h2>
            <span class="muted" style="font-size:.86rem">{{ long(date()) }}</span>
          </header>
          <div class="card-body">
            <div class="slots">
              @for (s of slots; track s) {
                <button type="button" class="slot" [class.on]="slot() === s"
                        [disabled]="taken(s)" [attr.aria-label]="'Créneau ' + s"
                        (click)="slot.set(s)">{{ s }}</button>
              }
            </div>
            <p class="hint mt-2">Les créneaux grisés ne sont pas proposés.</p>
          </div>
          <footer class="card-foot between">
            <button type="button" class="btn secondary" (click)="step.set(3)">Retour</button>
            <button type="button" class="btn" [disabled]="!slot()" (click)="step.set(5)">Continuer</button>
          </footer>
        </section>
      }

      <!-- 5 · Confirm -->
      @if (step() === 5) {
        <section class="card">
          <header class="card-head"><h2>Vérifier et confirmer</h2></header>
          <div class="card-body">
            <dl class="recap">
              <div><dt>Praticien</dt><dd>{{ doctorName() }}</dd></div>
              <div><dt>Spécialité</dt><dd>{{ profile()?.specialty || '—' }}</dd></div>
              <div><dt>Date</dt><dd>{{ long(date()) }}</dd></div>
              <div><dt>Heure</dt><dd class="num">{{ slot() }}</dd></div>
              <div><dt>Type</dt><dd>{{ mode() }}</dd></div>
              <div><dt>Lieu</dt><dd>{{ mode() === 'Téléconsultation' ? 'Lien envoyé avant la consultation' : (profile()?.address || 'Cabinet du praticien') }}</dd></div>
              <div><dt>Patient</dt><dd>{{ dash()?.name }}</dd></div>
              <div><dt>E-mail</dt><dd>{{ email() }}</dd></div>
            </dl>

            <label class="field mt-3">
              <span class="lbl">Motif de la consultation</span>
              <textarea [(ngModel)]="reason" placeholder="Décrivez brièvement le motif (facultatif)"></textarea>
            </label>

            <div class="alert a-info">
              <ui-icon name="alert" [size]="16" />
              <span><strong>Conditions d’annulation.</strong> Le rendez-vous peut être modifié ou annulé depuis
              « Mes rendez-vous » tant qu’il n’a pas eu lieu. Le praticien peut refuser une demande s’il n’est pas disponible.</span>
            </div>
          </div>
          <footer class="card-foot between">
            <button type="button" class="btn secondary" (click)="step.set(4)">Retour</button>
            <button type="button" class="btn lg" [disabled]="busy()" (click)="submit()">
              @if (busy()) { <i class="spin"></i> Envoi… } @else { Confirmer la demande }
            </button>
          </footer>
        </section>
      }

      <!-- 6 · Done -->
      @if (step() === 6) {
        <section class="card raised">
          <div class="card-body" style="text-align:center;padding:48px 24px">
            <span class="done"><ui-icon name="check" [size]="26" [width]="2.6" /></span>
            <h2 class="mt-2">Demande envoyée</h2>
            <p class="muted mt-1" style="max-width:46ch;margin-inline:auto">
              Votre demande du {{ long(date()) }} à {{ slot() }} a été transmise à {{ doctorName() }}.
              Elle reste <strong>en attente</strong> jusqu’à validation.
            </p>
            <div class="row mt-3" style="justify-content:center">
              <a class="btn" routerLink="/app/rendez-vous">Voir mes rendez-vous</a>
              <a class="btn secondary" routerLink="/app">Retour à l’accueil</a>
            </div>
          </div>
        </section>
      }
      }
    </div>
  `,
  styles: [`
    .pick {
      display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
      padding: 14px 16px; border: 1px solid var(--line-2); border-radius: var(--r);
      background: var(--surface); font: inherit; cursor: pointer; margin-bottom: 10px;
      transition: all .15s var(--ease);
    }
    .pick:hover:not(.off) { border-color: var(--primary-line); }
    .pick.on { border-color: var(--primary); background: var(--primary-soft); }
    .pick.off { cursor: default; opacity: .8; }
    .pick .info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .pick .info strong { font-size: .95rem; }
    .pick .info small { font-size: .8rem; }
    .tile {
      display: flex; flex-direction: column; align-items: flex-start; gap: 5px; text-align: left;
      padding: 16px; border: 1px solid var(--line-2); border-radius: var(--r); background: var(--surface);
      font: inherit; cursor: pointer; transition: all .15s var(--ease);
    }
    .tile:hover { border-color: var(--primary-line); }
    .tile.on { border-color: var(--primary); background: var(--primary-soft); box-shadow: 0 0 0 3px var(--primary-soft); }
    .tile .ic { width: 34px; height: 34px; border-radius: 9px; background: var(--surface-2); color: var(--ink-2); display: grid; place-items: center; margin-bottom: 4px; }
    .tile.on .ic { background: #fff; color: var(--primary-700); }
    .tile strong { font-size: .9rem; } .tile small { font-size: .79rem; }
    .days { display: flex; gap: 9px; overflow-x: auto; padding-bottom: 6px; }
    .days .day {
      flex: none; width: 66px; padding: 11px 6px; border-radius: var(--r); border: 1px solid var(--line-2);
      background: var(--surface); cursor: pointer; font: inherit; text-align: center;
      display: flex; flex-direction: column; gap: 2px; transition: all .15s var(--ease);
    }
    .days .day:hover { border-color: var(--primary-line); }
    .days .day.on { border-color: var(--primary); background: var(--primary-soft); color: var(--primary-700); }
    .days .day small { font-size: .7rem; color: var(--muted); text-transform: capitalize; }
    .days .day.on small { color: var(--primary-600); }
    .days .day b { font-size: 1.22rem; font-weight: 700; }
    .slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 9px; }
    .slot {
      padding: 11px 6px; border-radius: var(--r-sm); border: 1px solid var(--line-2); background: var(--surface);
      font: inherit; font-size: .88rem; font-weight: 600; cursor: pointer; font-variant-numeric: tabular-nums;
      transition: all .15s var(--ease);
    }
    .slot:hover:not(:disabled) { border-color: var(--primary-line); color: var(--primary-700); }
    .slot.on { background: var(--primary); border-color: var(--primary); color: #fff; }
    .slot:disabled { opacity: .4; cursor: not-allowed; background: var(--surface-2); text-decoration: line-through; }
    .recap { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; margin: 0; }
    .recap dt { font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 700; }
    .recap dd { margin: 3px 0 0; font-size: .92rem; font-weight: 550; }
    .done { width: 62px; height: 62px; border-radius: 50%; background: var(--ok-soft); color: var(--ok); display: inline-grid; place-items: center; border: 1px solid var(--ok-line); }
    .card-foot.between { display: flex; }
    @media (max-width: 620px) { .recap { grid-template-columns: 1fr; } }
  `],
})
export class PatientBook {
  private api = inject(Api);
  private auth = inject(Auth);
  private toasts = inject(Toasts);
  private router = inject(Router);

  protected stepLabels = ['Praticien', 'Type', 'Date', 'Créneau', 'Confirmation'];
  protected slots = SLOTS;

  protected dash = signal<PatientDashboard | null>(null);
  protected loading = signal(true);
  protected step = signal(1);
  protected mode = signal<string>('Cabinet');
  protected date = signal('');
  protected slot = signal('');
  protected reason = '';
  protected busy = signal(false);

  protected email = computed(() => this.auth.user()?.email ?? '');
  protected assigned = computed(() => !!this.dash()?.medecinEmail);
  protected doctorName = computed(() => this.dash()?.medecinName ?? '');
  protected profile = computed<Doctor | undefined>(() =>
    DOCTORS.find(d => d.email === this.dash()?.medecinEmail));
  protected others = computed(() =>
    DOCTORS.filter(d => d.email !== this.dash()?.medecinEmail).slice(0, 3));

  protected modes = computed(() => {
    const available = this.profile()?.modes ?? ['Cabinet', 'Téléconsultation'];
    const meta: Record<string, { icon: string; hint: string }> = {
      'Cabinet': { icon: 'pin', hint: 'Consultation sur place' },
      'Téléconsultation': { icon: 'video', hint: 'Par visioconférence' },
      'Domicile': { icon: 'heart', hint: 'Visite à domicile' },
    };
    return available.map(k => ({ key: k, icon: meta[k]?.icon ?? 'pin', hint: meta[k]?.hint ?? '' }));
  });

  /** Next 14 selectable days, starting tomorrow (the API rejects past dates). */
  protected days = computed(() => {
    const out: { iso: string; dow: string; num: number; mon: string }[] = [];
    const dow = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    const mon = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const pad = (n: number) => String(n).padStart(2, '0');
      out.push({
        iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        dow: dow[d.getDay()], num: d.getDate(), mon: mon[d.getMonth()],
      });
    }
    return out;
  });

  protected long = (iso: string) => (iso ? longDate(`${iso}T12:00:00`) : '—');

  constructor() {
    this.api.patientDashboard().subscribe({
      next: d => {
        this.dash.set(d);
        this.mode.set(DOCTORS.find(x => x.email === d.medecinEmail)?.modes[0] ?? 'Cabinet');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected taken(s: string) {
    return slotTaken(this.dash()?.medecinEmail ?? 'x', this.date(), s);
  }

  protected submit() {
    const medecinEmail = this.dash()?.medecinEmail;
    if (!medecinEmail || !this.date() || !this.slot()) return;

    this.busy.set(true);
    this.api.bookAppointment({
      medecinEmail,
      date: toApiDateTime(`${this.date()}T${this.slot()}`),
      reason: this.reason || this.mode(),
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.step.set(6);
        this.toasts.ok('Demande envoyée', 'Le praticien doit maintenant la confirmer.');
      },
      error: e => {
        this.busy.set(false);
        this.toasts.err('Demande refusée', apiError(e));
      },
    });
  }
}
