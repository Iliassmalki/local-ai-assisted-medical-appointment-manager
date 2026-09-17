import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../../core/api';
import { apiError } from '../../core/auth-interceptor';
import { Toasts } from '../../core/toast';
import { dateTime, isFuture, longDate, relative, time, toApiDateTime, toLocalInput } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiConfirm, UiEmpty, UiModal, UiSkeleton, UiStatus } from '../../ui/ui';
import type { PatientDashboard, RendezVous, Status } from '../../core/models';

type Filter = 'upcoming' | 'past' | 'all';

@Component({
  selector: 'app-patient-appointments',
  imports: [FormsModule, RouterLink, Icon, UiAvatar, UiStatus, UiEmpty, UiSkeleton, UiModal, UiConfirm],
  template: `
    <div class="page">
      <header class="page-head between">
        <div>
          <h1>Mes rendez-vous</h1>
          <p>Demandes envoyées à {{ dash()?.medecinName || 'votre praticien' }} et historique des consultations.</p>
        </div>
        <a class="btn" routerLink="/app/rendez-vous/nouveau"><ui-icon name="plus" [size]="15" /> Prendre rendez-vous</a>
      </header>

      @if (error()) {
        <div class="alert a-err mb-2" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" [attr.aria-selected]="filter() === t.key"
                  [class.on]="filter() === t.key" (click)="filter.set(t.key)">
            {{ t.label }}<span class="count">{{ countFor(t.key) }}</span>
          </button>
        }
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-body"><ui-skeleton [count]="5" [height]="22" /></div>
        } @else if (!rows().length) {
          <ui-empty title="Aucun rendez-vous" [text]="emptyText()">
            <a class="btn" routerLink="/app/rendez-vous/nouveau">Prendre rendez-vous</a>
          </ui-empty>
        } @else {
          <!-- Desktop table -->
          <div class="table-wrap desk">
            <table class="tbl">
              <thead>
                <tr><th>Praticien</th><th>Date et heure</th><th>Motif</th><th>Statut</th><th class="tr">Actions</th></tr>
              </thead>
              <tbody>
                @for (rv of rows(); track rv.id) {
                  <tr>
                    <td>
                      <div class="row">
                        <ui-avatar [name]="dash()?.medecinName" size="sm" />
                        <span class="strong">{{ dash()?.medecinName }}</span>
                      </div>
                    </td>
                    <td>
                      <div class="strong">{{ long(rv.date) }}</div>
                      <small class="muted num">{{ hour(rv.date) }} · {{ rel(rv.date) }}</small>
                    </td>
                    <td class="muted">{{ rv.reason || '—' }}</td>
                    <td><ui-status [status]="rv.status" /></td>
                    <td class="actions">
                      @if (editable(rv)) {
                        <button type="button" class="btn sm secondary" (click)="startEdit(rv)">Modifier</button>
                        <button type="button" class="btn sm danger-quiet" style="margin-left:6px"
                                (click)="toCancel.set(rv)">Annuler</button>
                      } @else { <small class="faint">—</small> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="list mob">
            @for (rv of rows(); track rv.id) {
              <div class="list-item" style="align-items:flex-start">
                <ui-avatar [name]="dash()?.medecinName" size="sm" />
                <div style="flex:1;min-width:0">
                  <div class="title">{{ long(rv.date) }} · {{ hour(rv.date) }}</div>
                  <div class="meta">{{ rv.reason || 'Consultation' }}</div>
                  <div class="row mt-1" style="gap:6px">
                    <ui-status [status]="rv.status" />
                    @if (editable(rv)) {
                      <button type="button" class="btn sm secondary" (click)="startEdit(rv)">Modifier</button>
                      <button type="button" class="btn sm danger-quiet" (click)="toCancel.set(rv)">Annuler</button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>

    @if (editing(); as rv) {
      <ui-modal heading="Modifier le rendez-vous"
                sub="La demande repassera en attente de validation par le praticien."
                (close)="editing.set(null)">
        <label class="field">
          <span class="lbl">Nouvelle date et heure<span class="req">*</span></span>
          <input type="datetime-local" [(ngModel)]="editDate" [min]="minDate" />
        </label>
        <label class="field" style="margin-bottom:0">
          <span class="lbl">Motif</span>
          <textarea [(ngModel)]="editReason" placeholder="Motif de la consultation"></textarea>
        </label>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="editing.set(null)">Annuler</button>
          <button type="button" class="btn" [disabled]="saving() || !editDate" (click)="saveEdit()">
            @if (saving()) { <i class="spin"></i> Enregistrement… } @else { Enregistrer }
          </button>
        </div>
      </ui-modal>
    }

    @if (toCancel(); as rv) {
      <ui-confirm heading="Annuler ce rendez-vous ?"
                  [sub]="long(rv.date) + ' à ' + hour(rv.date)"
                  body="Le rendez-vous sera supprimé du planning du praticien. Cette action est définitive."
                  action="Annuler le rendez-vous"
                  (cancel)="toCancel.set(null)" (confirm)="doCancel(rv)" />
    }
  `,
  styles: [`
    .mob { display: none; }
    @media (max-width: 860px) { .desk { display: none; } .mob { display: flex; } }
  `],
})
export class PatientAppointments {
  private api = inject(Api);
  private toasts = inject(Toasts);

  protected tabs: { key: Filter; label: string }[] = [
    { key: 'upcoming', label: 'À venir' },
    { key: 'past', label: 'Passés' },
    { key: 'all', label: 'Tous' },
  ];

  protected dash = signal<PatientDashboard | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  protected filter = signal<Filter>('upcoming');

  protected editing = signal<RendezVous | null>(null);
  protected toCancel = signal<RendezVous | null>(null);
  protected saving = signal(false);
  protected editDate = '';
  protected editReason = '';
  protected minDate = toLocalInput(new Date(Date.now() + 3600_000).toISOString());

  private all = computed(() =>
    [...(this.dash()?.listerendezVous ?? [])].sort((a, b) => b.date.localeCompare(a.date)));

  protected rows = computed(() => {
    const list = this.all();
    if (this.filter() === 'upcoming') return list.filter(r => isFuture(r.date)).reverse();
    if (this.filter() === 'past') return list.filter(r => !isFuture(r.date));
    return list;
  });

  protected long = longDate;
  protected hour = time;
  protected rel = relative;
  protected dt = dateTime;

  constructor() { this.load(); }

  protected countFor(f: Filter) {
    const list = this.all();
    if (f === 'upcoming') return list.filter(r => isFuture(r.date)).length;
    if (f === 'past') return list.filter(r => !isFuture(r.date)).length;
    return list.length;
  }

  protected emptyText() {
    return this.filter() === 'past'
      ? 'Aucune consultation passée enregistrée.'
      : 'Vous n’avez pas encore de rendez-vous programmé.';
  }

  /** Only future appointments the practitioner has not already answered can be changed. */
  protected editable(rv: RendezVous) {
    return isFuture(rv.date) && rv.status !== 'REJECTED';
  }

  private load() {
    this.loading.set(true);
    this.api.patientDashboard().subscribe({
      next: d => { this.dash.set(d); this.loading.set(false); },
      error: e => {
        this.loading.set(false);
        this.error.set(e?.status === 404
          ? 'Aucun praticien ne vous suit encore : la prise de rendez-vous sera disponible une fois rattaché.'
          : apiError(e));
      },
    });
  }

  protected startEdit(rv: RendezVous) {
    this.editing.set(rv);
    this.editDate = toLocalInput(rv.date);
    this.editReason = rv.reason ?? '';
  }

  protected saveEdit() {
    const rv = this.editing();
    if (!rv?.id || !this.editDate) return;

    this.saving.set(true);
    const body: RendezVous = {
      ...rv,
      date: toApiDateTime(this.editDate),
      reason: this.editReason,
      status: 'PENDING' as Status,
    };

    this.api.updateMyAppointment(rv.id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toasts.ok('Rendez-vous modifié', 'La demande est de nouveau en attente de validation.');
        this.load();
      },
      error: e => { this.saving.set(false); this.toasts.err('Modification refusée', apiError(e)); },
    });
  }

  protected doCancel(rv: RendezVous) {
    if (!rv.id) return;
    this.toCancel.set(null);
    this.api.cancelMyAppointment(rv.id).subscribe({
      next: () => { this.toasts.ok('Rendez-vous annulé'); this.load(); },
      error: e => this.toasts.err('Annulation impossible', apiError(e)),
    });
  }
}
