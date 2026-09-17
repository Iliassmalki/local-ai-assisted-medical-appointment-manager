import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';
import { Api } from '../../core/api';
import { apiError } from '../../core/auth-interceptor';
import { dateTime, greeting, isFuture, longDate, relative, shortDate, time } from '../../core/format';
import { VITALS } from '../../core/mock/health';
import { ACTIVITY } from '../../core/mock/inbox';
import { DOCTORS } from '../../core/mock/doctors';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiEmpty, UiSkeleton, UiSpark, UiStatus } from '../../ui/ui';
import type { PatientDashboard, RendezVous } from '../../core/models';

@Component({
  selector: 'app-patient-overview',
  imports: [RouterLink, Icon, UiAvatar, UiStatus, UiSkeleton, UiEmpty, UiSpark],
  template: `
    <div class="page">
      <header class="page-head">
        <h1>{{ hello }}{{ firstName() ? ', ' + firstName() : '' }}</h1>
        <p>Voici un aperçu de votre activité médicale.</p>
      </header>

      @if (loading()) {
        <div class="card mb-3"><div class="card-body"><ui-skeleton [count]="4" [height]="20" /></div></div>
        <div class="grid g4"><ui-skeleton [count]="1" [height]="118" /><ui-skeleton [count]="1" [height]="118" />
          <ui-skeleton [count]="1" [height]="118" /><ui-skeleton [count]="1" [height]="118" /></div>
      } @else if (noDoctor()) {
        <div class="card raised mb-3">
          <div class="card-body">
            <div class="alert a-info mb-2">
              <ui-icon name="alert" [size]="17" />
              <div>
                <strong>Aucun praticien ne vous suit pour l’instant.</strong><br />
                Dans Medora, c’est le praticien qui rattache un patient à sa patientèle à partir de son
                adresse e-mail. Communiquez-lui <strong>{{ email() }}</strong> pour activer la prise de rendez-vous.
              </div>
            </div>
            <a class="btn soft" routerLink="/app/medecins"><ui-icon name="search" [size]="15" /> Parcourir les praticiens</a>
          </div>
        </div>
      } @else if (error()) {
        <div class="alert a-err mb-3" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      @if (!loading() && !noDoctor()) {
        <!-- Next appointment -->
        <section class="mb-3">
          <div class="section-head"><h2>Prochain rendez-vous</h2>
            <a routerLink="/app/rendez-vous">Tout voir</a></div>

          @if (next(); as rv) {
            <div class="card raised next">
              <div class="card-body">
                <div class="next-grid">
                  <div class="row" style="gap:14px;align-items:flex-start">
                    <ui-avatar [name]="doctorName()" size="lg" />
                    <div>
                      <h3>{{ doctorName() }}</h3>
                      <p class="muted" style="font-size:.88rem">{{ doctorSpecialty() }}</p>
                      <div class="row wrap mt-1" style="gap:7px">
                        <ui-status [status]="rv.status" />
                        <span class="badge b-brand">{{ mode() }}</span>
                      </div>
                    </div>
                  </div>

                  <dl class="facts">
                    <div><dt>Date</dt><dd>{{ long(rv.date) }}</dd></div>
                    <div><dt>Heure</dt><dd class="num">{{ hour(rv.date) }} · {{ rel(rv.date) }}</dd></div>
                    <div><dt>Lieu</dt><dd>{{ clinic() }}</dd></div>
                    <div><dt>Motif</dt><dd>{{ rv.reason || 'Non précisé' }}</dd></div>
                  </dl>
                </div>
              </div>
              <div class="card-foot row" style="justify-content:flex-end">
                <a class="btn secondary" routerLink="/app/rendez-vous"><ui-icon name="eye" [size]="15" /> Voir le rendez-vous</a>
                @if (rv.status === 'APPROVED') {
                  <button type="button" class="btn" (click)="join()"><ui-icon name="video" [size]="15" /> Rejoindre la consultation</button>
                }
              </div>
            </div>
          } @else {
            <div class="card">
              <ui-empty title="Aucun rendez-vous à venir"
                        text="Vous n’avez pas de consultation programmée avec {{ dash()?.medecinName }}.">
                <a class="btn" routerLink="/app/rendez-vous/nouveau"><ui-icon name="plus" [size]="15" /> Prendre rendez-vous</a>
              </ui-empty>
            </div>
          }
        </section>

        <!-- Quick actions -->
        <section class="mb-3">
          <div class="grid g4">
            @for (a of actions; track a.path) {
              <a class="card quick" [routerLink]="a.path">
                <span class="ic"><ui-icon [name]="a.icon" [size]="18" /></span>
                <span class="tx"><strong>{{ a.label }}</strong><small class="muted">{{ a.hint }}</small></span>
                <ui-icon name="chevron" [size]="15" />
              </a>
            }
          </div>
        </section>

        <!-- Health overview -->
        <section class="mb-3">
          <div class="section-head">
            <h2>Relevés de santé</h2>
            <span class="hint">Valeurs déclarées ou relevées — sans portée diagnostique.</span>
          </div>
          <div class="grid g4">
            @for (v of vitals; track v.key) {
              <div class="card vital">
                <div class="card-body">
                  <div class="between" style="align-items:flex-start">
                    <span class="label">{{ v.label }}</span>
                    <span class="badge" [class.b-mint]="v.trend !== 'flat'">
                      {{ v.trend === 'up' ? '↑' : v.trend === 'down' ? '↓' : '→' }}
                    </span>
                  </div>
                  <div class="val num">{{ v.value }} <small>{{ v.unit }}</small></div>
                  <ui-spark [data]="v.series" [w]="180" [h]="30" />
                  <small class="faint">{{ v.source }} · {{ dt(v.recordedAt) }}</small>
                </div>
              </div>
            }
          </div>
        </section>

        <div class="grid g2">
          <!-- Upcoming -->
          <section class="card">
            <header class="card-head"><h2>Rendez-vous à venir</h2>
              <a class="btn sm secondary" routerLink="/app/rendez-vous/nouveau"><ui-icon name="plus" [size]="13" /> Nouveau</a>
            </header>
            @if (upcoming().length) {
              <div class="list">
                @for (rv of upcoming(); track rv.id) {
                  <div class="list-item">
                    <span class="day">
                      <b class="num">{{ dayNum(rv.date) }}</b>
                      <small>{{ monthShort(rv.date) }}</small>
                    </span>
                    <div style="flex:1;min-width:0">
                      <div class="title">{{ rv.reason || 'Consultation' }}</div>
                      <div class="meta">{{ doctorName() }} · {{ hour(rv.date) }}</div>
                    </div>
                    <ui-status [status]="rv.status" />
                  </div>
                }
              </div>
            } @else {
              <ui-empty title="Rien de programmé" text="Vos prochains rendez-vous apparaîtront ici." />
            }
          </section>

          <!-- Activity -->
          <section class="card">
            <header class="card-head"><h2>Activité récente</h2></header>
            <div class="list">
              @for (a of activity; track a.id) {
                <div class="list-item">
                  <span class="act" [attr.data-k]="a.kind"><ui-icon [name]="actIcon(a.kind)" [size]="15" /></span>
                  <div style="flex:1;min-width:0">
                    <div class="title">{{ a.title }}</div>
                    <div class="meta">{{ a.detail }}</div>
                  </div>
                  <small class="faint nowrap">{{ rel(a.at) }}</small>
                </div>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .next-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.1fr); gap: 26px; align-items: start; }
    .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px; margin: 0; }
    .facts dt { font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 700; }
    .facts dd { margin: 3px 0 0; font-size: .91rem; font-weight: 550; }
    .quick {
      display: flex; align-items: center; gap: 12px; padding: 15px 16px; text-decoration: none;
      color: var(--ink); transition: border-color .15s var(--ease), box-shadow .15s var(--ease);
    }
    .quick:hover { text-decoration: none; border-color: var(--primary-line); box-shadow: var(--sh-2); }
    .quick .ic { width: 36px; height: 36px; border-radius: 10px; background: var(--primary-soft); color: var(--primary-700); display: grid; place-items: center; flex: none; }
    .quick .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .quick .tx strong { font-size: .9rem; font-weight: 640; }
    .quick .tx small { font-size: .78rem; }
    .quick > ui-icon { color: var(--faint); }
    .vital .label { font-size: .78rem; font-weight: 640; color: var(--muted); }
    .vital .val { font-size: 1.6rem; font-weight: 680; margin: 6px 0 10px; letter-spacing: -.02em; }
    .vital .val small { font-size: .8rem; font-weight: 500; color: var(--muted); }
    .vital ui-spark { display: block; margin-bottom: 8px; }
    .day {
      width: 44px; height: 44px; border-radius: 11px; background: var(--surface-2); border: 1px solid var(--line);
      display: grid; place-content: center; text-align: center; flex: none; line-height: 1.1;
    }
    .day b { font-size: 1.05rem; font-weight: 700; }
    .day small { font-size: .66rem; text-transform: uppercase; color: var(--muted); font-weight: 650; }
    .act { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex: none; background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--line); }
    .act[data-k=lab] { background: var(--info-soft); color: var(--info); border-color: #cfe0ea; }
    .act[data-k=rx] { background: var(--mint-soft); color: #3f7a5f; border-color: #cbe3d6; }
    .act[data-k=appt] { background: var(--primary-soft); color: var(--primary-700); border-color: var(--primary-line); }
    @media (max-width: 900px) { .next-grid { grid-template-columns: 1fr; gap: 20px; } }
    @media (max-width: 520px) { .facts { grid-template-columns: 1fr; } }
  `],
})
export class PatientOverview {
  private api = inject(Api);
  private auth = inject(Auth);

  protected hello = greeting();
  protected vitals = VITALS;
  protected activity = ACTIVITY;
  protected actions = [
    { label: 'Prendre rendez-vous', hint: 'Avec votre praticien', icon: 'plus', path: '/app/rendez-vous/nouveau' },
    { label: 'Dossier médical', hint: 'Documents et comptes rendus', icon: 'folder', path: '/app/dossier' },
    { label: 'Mes analyses', hint: 'Résultats de laboratoire', icon: 'flask', path: '/app/analyses' },
    { label: 'Contacter un médecin', hint: 'Messagerie sécurisée', icon: 'chat', path: '/app/messages' },
  ];

  protected dash = signal<PatientDashboard | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  protected noDoctor = signal(false);

  protected email = computed(() => this.auth.user()?.email ?? '');
  protected firstName = computed(() => (this.dash()?.name ?? this.auth.user()?.name ?? '').split(' ')[0]);
  protected doctorName = computed(() => this.dash()?.medecinName ?? 'Votre praticien');

  /** Enriches the backend doctor with demonstration profile details when we have a match. */
  private profile = computed(() => DOCTORS.find(d => d.email === this.dash()?.medecinEmail));
  protected doctorSpecialty = computed(() => this.profile()?.specialty ?? 'Praticien référent');
  protected clinic = computed(() => this.profile()?.clinic ?? 'Cabinet du praticien');
  protected mode = computed(() => this.profile()?.modes[0] ?? 'Cabinet');

  private sorted = computed(() =>
    [...(this.dash()?.listerendezVous ?? [])].sort((a, b) => a.date.localeCompare(b.date)));

  protected upcoming = computed(() => this.sorted().filter(r => isFuture(r.date)).slice(0, 5));
  protected next = computed<RendezVous | null>(() => this.upcoming()[0] ?? null);

  protected long = longDate;
  protected hour = time;
  protected rel = relative;
  protected dt = dateTime;

  constructor() { this.load(); }

  private load() {
    this.loading.set(true);
    this.api.patientDashboard().subscribe({
      next: d => { this.dash.set(d); this.loading.set(false); },
      error: e => {
        this.loading.set(false);
        // PatientService throws Medecinnotfound (404) until a doctor adds the patient.
        if (e?.status === 404) this.noDoctor.set(true);
        else this.error.set(apiError(e));
      },
    });
  }

  protected dayNum(iso: string) { return new Date(iso).getDate(); }
  protected monthShort(iso: string) { return shortDate(iso).split(' ')[1]; }
  protected actIcon(k: string) {
    return k === 'lab' ? 'flask' : k === 'rx' ? 'pill' : k === 'appt' ? 'calendar' : 'doc';
  }
  protected join() { window.alert('La téléconsultation est simulée dans ce prototype.'); }
}
