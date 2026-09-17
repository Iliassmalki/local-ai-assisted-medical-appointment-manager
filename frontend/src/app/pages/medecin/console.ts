import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { Auth } from '../../core/auth';
import { apiError } from '../../core/auth-interceptor';
import { dateTime, greeting, isFuture, relative, time } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiEmpty, UiSkeleton, UiStatus } from '../../ui/ui';
import type { MedecinDashboard, PatientDto, RendezVous } from '../../core/models';

@Component({
  selector: 'app-medecin-console',
  imports: [RouterLink, Icon, UiAvatar, UiStatus, UiEmpty, UiSkeleton],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="eyebrow">Console praticien</div>
        <h1>{{ hello }}, {{ name() }}</h1>
        <p>Activité de votre patientèle et demandes de rendez-vous en attente.</p>
      </header>

      @if (error()) {
        <div class="alert a-err mb-3" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      @if (loading()) {
        <div class="grid g4 mb-3">
          @for (i of [1,2,3,4]; track i) { <div class="card"><div class="card-body"><ui-skeleton [count]="2" [height]="24" /></div></div> }
        </div>
      } @else {
        <div class="grid g4 mb-3">
          <div class="card stat-card accent"><div class="card-body">
            <span class="label">Rendez-vous</span>
            <span class="value num">{{ dash()?.totalAppointments ?? 0 }}</span>
            <small class="foot">Total enregistré</small>
          </div></div>
          <div class="card stat-card"><div class="card-body">
            <span class="label">Patients suivis</span>
            <span class="value num">{{ dash()?.totalPatients ?? 0 }}</span>
            <small class="foot">Rattachés à votre compte</small>
          </div></div>
          <div class="card stat-card"><div class="card-body">
            <span class="label">En attente</span>
            <span class="value num">{{ pending().length }}</span>
            <small class="foot">Demandes à traiter</small>
          </div></div>
          <div class="card stat-card"><div class="card-body">
            <span class="label">À venir</span>
            <span class="value num">{{ upcoming().length }}</span>
            <small class="foot">Consultations programmées</small>
          </div></div>
        </div>

        <!-- Pending queue -->
        <section class="card mb-3">
          <header class="card-head">
            <h2>Demandes en attente</h2>
            <a class="btn sm secondary" routerLink="/praticien/rendez-vous">Gérer le planning</a>
          </header>
          @if (!pending().length) {
            <ui-empty title="Aucune demande en attente" text="Toutes les demandes de rendez-vous ont été traitées." />
          } @else {
            <div class="list">
              @for (rv of pending().slice(0, 5); track rv.id) {
                <div class="list-item">
                  <ui-avatar [name]="patientName(rv)" size="sm" />
                  <div style="flex:1;min-width:0">
                    <div class="title">{{ patientName(rv) }}</div>
                    <div class="meta">{{ dt(rv.date) }} · {{ rv.reason || 'Motif non précisé' }}</div>
                  </div>
                  <div class="row" style="gap:6px">
                    <button type="button" class="btn sm ok" [disabled]="busy() === rv.id" (click)="approve(rv)">
                      <ui-icon name="check" [size]="13" /> Accepter
                    </button>
                    <button type="button" class="btn sm danger-quiet" [disabled]="busy() === rv.id" (click)="reject(rv)">
                      Refuser
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <div class="grid g2">
          <section class="card">
            <header class="card-head"><h2>Consultations récentes</h2></header>
            @if (dash()?.recentAppointments?.length) {
              <div class="list">
                @for (a of dash()!.recentAppointments; track $index) {
                  <div class="list-item">
                    <ui-avatar [name]="a.patientName" size="sm" tone="neutral" />
                    <div style="flex:1;min-width:0">
                      <div class="title">{{ a.patientName }}</div>
                      <div class="meta">{{ dt(a.appointmentDate) }}</div>
                    </div>
                    <ui-status [status]="a.status" />
                  </div>
                }
              </div>
            } @else {
              <ui-empty title="Aucune consultation" text="Les cinq dernières consultations apparaîtront ici." />
            }
          </section>

          <section class="card">
            <header class="card-head">
              <h2>Patientèle</h2>
              <a class="btn sm secondary" routerLink="/praticien/patients">Gérer</a>
            </header>
            @if (dash()?.listofclients?.length) {
              <div class="list">
                @for (p of dash()!.listofclients.slice(0, 6); track p.email) {
                  <div class="list-item">
                    <ui-avatar [name]="p.name" size="sm" tone="mint" />
                    <div style="flex:1;min-width:0">
                      <div class="title">{{ p.name }}</div>
                      <div class="meta">{{ p.email }}</div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <ui-empty title="Aucun patient rattaché" text="Ajoutez un patient par son adresse e-mail.">
                <a class="btn" routerLink="/praticien/patients"><ui-icon name="plus" [size]="15" /> Ajouter un patient</a>
              </ui-empty>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-card .label { font-size: .76rem; font-weight: 650; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
    .stat-card .value { display: block; font-size: 2.1rem; font-weight: 700; line-height: 1.1; margin: 8px 0 2px; letter-spacing: -.025em; }
    .stat-card .foot { color: var(--muted); font-size: .8rem; }
    .stat-card.accent { background: var(--primary); border-color: var(--primary); }
    .stat-card.accent .label, .stat-card.accent .foot { color: rgba(255,255,255,.72); }
    .stat-card.accent .value { color: #fff; }
  `],
})
export class MedecinConsole {
  private api = inject(Api);
  private auth = inject(Auth);

  protected hello = greeting();
  protected name = computed(() => this.auth.user()?.name ?? '');

  protected dash = signal<MedecinDashboard | null>(null);
  protected appts = signal<RendezVous[]>([]);
  protected patients = signal<PatientDto[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected busy = signal<number | null>(null);

  protected pending = computed(() => this.appts().filter(a => a.status === 'PENDING'));
  protected upcoming = computed(() => this.appts().filter(a => isFuture(a.date) && a.status === 'APPROVED'));

  protected dt = dateTime;
  protected rel = relative;
  protected hour = time;

  constructor() { this.load(); }

  private load() {
    this.loading.set(true);
    this.api.medecinDashboard().subscribe({
      next: d => { this.dash.set(d); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error.set(apiError(e)); },
    });
    this.api.medecinAppointments().subscribe({
      next: a => this.appts.set(a),
      error: () => { /* surfaced by the dashboard call */ },
    });
    this.api.medecinPatients().subscribe({
      next: p => this.patients.set(p),
      error: () => { /* names fall back to the patient id */ },
    });
  }

  /** The appointment list carries patient ids only; names come from the patient roster. */
  protected patientName(rv: RendezVous) {
    return this.patients().find(p => p.id === rv.patientId)?.name ?? `Patient #${rv.patientId}`;
  }

  protected approve(rv: RendezVous) {
    if (!rv.id) return;
    this.busy.set(rv.id);
    this.api.approve(rv.id).subscribe({
      next: () => { this.busy.set(null); this.load(); },
      error: e => { this.busy.set(null); this.error.set(apiError(e)); },
    });
  }

  protected reject(rv: RendezVous) {
    if (!rv.id) return;
    this.busy.set(rv.id);
    this.api.reject(rv.id).subscribe({
      next: () => { this.busy.set(null); this.load(); },
      error: e => { this.busy.set(null); this.error.set(apiError(e)); },
    });
  }
}
