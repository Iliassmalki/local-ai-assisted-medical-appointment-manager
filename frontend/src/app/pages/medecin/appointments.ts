import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api';
import { apiError } from '../../core/auth-interceptor';
import { Toasts } from '../../core/toast';
import { isFuture, longDate, relative, time, toApiDateTime, toLocalInput } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiConfirm, UiEmpty, UiModal, UiSkeleton, UiStatus } from '../../ui/ui';
import type { PatientDto, RendezVous, Status } from '../../core/models';

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

@Component({
  selector: 'app-medecin-appointments',
  imports: [FormsModule, Icon, UiAvatar, UiStatus, UiEmpty, UiSkeleton, UiModal, UiConfirm],
  template: `
    <div class="page">
      <header class="page-head">
        <div class="eyebrow">Console praticien</div>
        <h1>Planning des rendez-vous</h1>
        <p>Validez, refusez ou replanifiez les demandes de votre patientèle.</p>
      </header>

      @if (error()) {
        <div class="alert a-err mb-2" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" [attr.aria-selected]="tab() === t.key"
                  [class.on]="tab() === t.key" (click)="tab.set(t.key)">
            {{ t.label }}<span class="count">{{ countOf(t.key) }}</span>
          </button>
        }
      </div>

      <div class="card">
        @if (loading()) {
          <div class="card-body"><ui-skeleton [count]="5" [height]="22" /></div>
        } @else if (!rows().length) {
          <ui-empty title="Aucun rendez-vous" text="Rien à afficher dans cette catégorie." />
        } @else {
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Patient</th><th>Date et heure</th><th>Motif</th><th>Statut</th><th class="tr">Actions</th></tr></thead>
              <tbody>
                @for (rv of rows(); track rv.id) {
                  <tr>
                    <td>
                      <div class="row">
                        <ui-avatar [name]="nameOf(rv.patientId)" size="sm" />
                        <div>
                          <div class="strong">{{ nameOf(rv.patientId) }}</div>
                          <small class="muted">{{ emailOf(rv.patientId) }}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="strong">{{ long(rv.date) }}</div>
                      <small class="muted num">{{ hour(rv.date) }} · {{ rel(rv.date) }}</small>
                    </td>
                    <td class="muted">{{ rv.reason || '—' }}</td>
                    <td><ui-status [status]="rv.status" /></td>
                    <td class="actions">
                      @if (rv.status === 'PENDING') {
                        <button type="button" class="btn sm ok" [disabled]="busy() === rv.id" (click)="act(rv, 'approve')">Accepter</button>
                        <button type="button" class="btn sm danger-quiet" style="margin-left:6px"
                                [disabled]="busy() === rv.id" (click)="act(rv, 'reject')">Refuser</button>
                      } @else {
                        <button type="button" class="btn sm secondary" (click)="startEdit(rv)">Replanifier</button>
                      }
                      <button type="button" class="btn sm quiet icon" style="margin-left:6px"
                              [attr.aria-label]="'Supprimer le rendez-vous ' + rv.id" (click)="toDelete.set(rv)">
                        <ui-icon name="x" [size]="14" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (editing(); as rv) {
      <ui-modal heading="Replanifier le rendez-vous" [sub]="nameOf(rv.patientId)" (close)="editing.set(null)">
        <label class="field"><span class="lbl">Date et heure</span>
          <input type="datetime-local" [(ngModel)]="editDate" /></label>
        <label class="field" style="margin-bottom:0"><span class="lbl">Statut</span>
          <select [(ngModel)]="editStatus">
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Confirmé</option>
            <option value="REJECTED">Refusé</option>
          </select></label>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="editing.set(null)">Annuler</button>
          <button type="button" class="btn" [disabled]="saving() || !editDate" (click)="saveEdit()">
            @if (saving()) { <i class="spin"></i> Enregistrement… } @else { Enregistrer }
          </button>
        </div>
      </ui-modal>
    }

    @if (toDelete(); as rv) {
      <ui-confirm heading="Supprimer ce rendez-vous ?" [sub]="long(rv.date) + ' à ' + hour(rv.date)"
                  body="Le rendez-vous sera retiré du planning et du dossier du patient. Cette action est définitive."
                  action="Supprimer" (cancel)="toDelete.set(null)" (confirm)="doDelete(rv)" />
    }
  `,
})
export class MedecinAppointments {
  private api = inject(Api);
  private toasts = inject(Toasts);

  protected tabs: { key: Tab; label: string }[] = [
    { key: 'PENDING', label: 'En attente' },
    { key: 'APPROVED', label: 'Confirmés' },
    { key: 'REJECTED', label: 'Refusés' },
    { key: 'ALL', label: 'Tous' },
  ];

  protected tab = signal<Tab>('PENDING');
  protected appts = signal<RendezVous[]>([]);
  protected patients = signal<PatientDto[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected busy = signal<number | null>(null);

  protected editing = signal<RendezVous | null>(null);
  protected toDelete = signal<RendezVous | null>(null);
  protected saving = signal(false);
  protected editDate = '';
  protected editStatus: Status = 'APPROVED';

  protected rows = computed(() => {
    const list = [...this.appts()].sort((a, b) => b.date.localeCompare(a.date));
    return this.tab() === 'ALL' ? list : list.filter(a => a.status === this.tab());
  });

  protected long = longDate;
  protected hour = time;
  protected rel = relative;

  constructor() { this.load(); }

  protected countOf(t: Tab) {
    return t === 'ALL' ? this.appts().length : this.appts().filter(a => a.status === t).length;
  }

  private load() {
    this.loading.set(true);
    this.api.medecinAppointments().subscribe({
      next: a => { this.appts.set(a); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error.set(apiError(e)); },
    });
    this.api.medecinPatients().subscribe({
      next: p => this.patients.set(p),
      error: () => { /* names fall back to the patient id */ },
    });
  }

  protected nameOf(id: number | null) {
    return this.patients().find(p => p.id === id)?.name ?? `Patient #${id}`;
  }
  protected emailOf(id: number | null) {
    return this.patients().find(p => p.id === id)?.email ?? '—';
  }

  protected act(rv: RendezVous, kind: 'approve' | 'reject') {
    if (!rv.id) return;
    this.busy.set(rv.id);
    const call = kind === 'approve' ? this.api.approve(rv.id) : this.api.reject(rv.id);
    call.subscribe({
      next: () => {
        this.busy.set(null);
        this.toasts.ok(kind === 'approve' ? 'Rendez-vous confirmé' : 'Rendez-vous refusé');
        this.load();
      },
      error: e => { this.busy.set(null); this.toasts.err('Action impossible', apiError(e)); },
    });
  }

  protected startEdit(rv: RendezVous) {
    this.editing.set(rv);
    this.editDate = toLocalInput(rv.date);
    this.editStatus = rv.status ?? 'APPROVED';
  }

  protected saveEdit() {
    const rv = this.editing();
    if (!rv?.id) return;
    this.saving.set(true);
    this.api.medecinUpdateAppointment(rv.id, {
      ...rv, date: toApiDateTime(this.editDate), status: this.editStatus,
    }).subscribe({
      next: () => {
        this.saving.set(false); this.editing.set(null);
        this.toasts.ok('Rendez-vous mis à jour'); this.load();
      },
      error: e => { this.saving.set(false); this.toasts.err('Mise à jour refusée', apiError(e)); },
    });
  }

  protected doDelete(rv: RendezVous) {
    if (!rv.id) return;
    this.toDelete.set(null);
    this.api.medecinDeleteAppointment(rv.id).subscribe({
      next: () => { this.toasts.ok('Rendez-vous supprimé'); this.load(); },
      error: e => this.toasts.err('Suppression impossible', apiError(e)),
    });
  }
}
