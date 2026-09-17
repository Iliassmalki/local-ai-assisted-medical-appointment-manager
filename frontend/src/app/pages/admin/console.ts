import { Component, computed, inject, signal } from '@angular/core';
import { Api } from '../../core/api';
import { Auth } from '../../core/auth';
import { apiError } from '../../core/auth-interceptor';
import { Icon } from '../../ui/icon';
import { UiSkeleton } from '../../ui/ui';
import type { AdminDashboard } from '../../core/models';

@Component({
  selector: 'app-admin-console',
  imports: [Icon, UiSkeleton],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="eyebrow">Supervision</div>
        <h1>Tableau de bord administrateur</h1>
        <p>Indicateurs d’activité agrégés, servis par <code>GET /admin/dashboard</code>.</p>
      </header>

      @if (error()) {
        <div class="alert a-err mb-3" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      @if (loading()) {
        <div class="grid g4">
          @for (i of [1,2,3,4]; track i) { <div class="card"><div class="card-body"><ui-skeleton [count]="2" [height]="26" /></div></div> }
        </div>
      } @else {
        <div class="grid g4 mb-3">
          @for (t of tiles(); track t.label) {
            <div class="card tile" [class.accent]="t.accent">
              <div class="card-body">
                <div class="between" style="align-items:flex-start">
                  <span class="label">{{ t.label }}</span>
                  <span class="ic"><ui-icon [name]="t.icon" [size]="16" /></span>
                </div>
                <span class="value num">{{ t.value }}</span>
                <small class="foot">{{ t.hint }}</small>
              </div>
            </div>
          }
        </div>

        <div class="grid g2">
          <section class="card">
            <header class="card-head"><h2>Répartition des comptes</h2></header>
            <div class="card-body">
              @for (b of breakdown(); track b.label) {
                <div class="mb-2">
                  <div class="row between mb-1">
                    <span style="font-size:.88rem;font-weight:600">{{ b.label }}</span>
                    <span class="num muted" style="font-size:.85rem">{{ b.value }} · {{ b.pct }} %</span>
                  </div>
                  <div class="meter"><i [class]="b.tone" [style.width.%]="b.pct"></i></div>
                </div>
              }
              <p class="hint mt-2">
                Le total des utilisateurs inclut les comptes administrateurs, qui ne sont pas décomptés séparément par l’API.
              </p>
            </div>
          </section>

          <section class="card">
            <header class="card-head"><h2>Contrôle d’accès</h2></header>
            <div class="card-body">
              <p class="hint mb-3">Chaque contrôleur de l’API est protégé par une autorité distincte, vérifiée côté serveur avant l’exécution de la méthode.</p>
              <ul class="rbac">
                <li><span class="badge b-brand">ROLE_ADMIN</span><code>/admin/**</code><small class="muted">Indicateurs globaux</small></li>
                <li><span class="badge b-mint">ROLE_MEDECIN</span><code>/api/medecin/**</code><small class="muted">Patientèle et planning</small></li>
                <li><span class="badge b-info">ROLE_PATIENT</span><code>/api/patient/**</code><small class="muted">Dossier et rendez-vous</small></li>
                <li><span class="badge">public</span><code>/api/auth/**, /api/chat</code><small class="muted">Inscription, connexion, assistant</small></li>
              </ul>
              <div class="alert a-info mt-3">
                <ui-icon name="shield" [size]="16" />
                <span>Connecté en tant que <strong>{{ email() }}</strong> avec l’autorité <code>ROLE_ADMIN</code>.</span>
              </div>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .tile .label { font-size: .76rem; font-weight: 650; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
    .tile .ic { width: 30px; height: 30px; border-radius: 8px; background: var(--surface-2); color: var(--ink-2);
                display: grid; place-items: center; border: 1px solid var(--line); }
    .tile .value { display: block; font-size: 2.2rem; font-weight: 700; line-height: 1.1; margin: 10px 0 2px; letter-spacing: -.025em; }
    .tile .foot { color: var(--muted); font-size: .8rem; }
    .tile.accent { background: var(--primary); border-color: var(--primary); }
    .tile.accent .label, .tile.accent .foot { color: rgba(255,255,255,.72); }
    .tile.accent .value { color: #fff; }
    .tile.accent .ic { background: rgba(255,255,255,.14); color: #fff; border-color: transparent; }
    .rbac { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
    .rbac li { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .rbac code { font-size: .8rem; background: var(--surface-2); padding: 3px 8px; border-radius: 6px; border: 1px solid var(--line); }
    .rbac small { font-size: .8rem; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .86em; }
  `],
})
export class AdminConsole {
  private api = inject(Api);
  private auth = inject(Auth);

  protected dash = signal<AdminDashboard | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  protected email = computed(() => this.auth.user()?.email ?? '');

  protected tiles = computed(() => {
    const d = this.dash();
    return [
      { label: 'Utilisateurs', value: d?.totalUsers ?? 0, icon: 'users', hint: 'Tous rôles confondus', accent: true },
      { label: 'Rendez-vous', value: d?.totalAppointments ?? 0, icon: 'calendar', hint: 'Enregistrés en base', accent: false },
      { label: 'Praticiens', value: d?.activeDoctors ?? 0, icon: 'stethoscope', hint: 'Comptes médecin', accent: false },
      { label: 'Patients', value: d?.activePatients ?? 0, icon: 'heart', hint: 'Comptes patient', accent: false },
    ];
  });

  protected breakdown = computed(() => {
    const d = this.dash();
    const total = d?.totalUsers || 1;
    const pct = (n: number) => Math.round((n / total) * 100);
    const others = Math.max(0, (d?.totalUsers ?? 0) - (d?.activeDoctors ?? 0) - (d?.activePatients ?? 0));
    return [
      { label: 'Patients', value: d?.activePatients ?? 0, pct: pct(d?.activePatients ?? 0), tone: '' },
      { label: 'Praticiens', value: d?.activeDoctors ?? 0, pct: pct(d?.activeDoctors ?? 0), tone: 'ok' },
      { label: 'Administrateurs', value: others, pct: pct(others), tone: 'warn' },
    ];
  });

  constructor() {
    this.api.adminDashboard().subscribe({
      next: d => { this.dash.set(d); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error.set(apiError(e)); },
    });
  }
}
