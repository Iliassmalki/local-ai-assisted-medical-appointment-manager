import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../../core/api';
import { apiError } from '../../core/auth-interceptor';
import { Toasts } from '../../core/toast';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiConfirm, UiEmpty, UiModal, UiSkeleton } from '../../ui/ui';
import type { PatientDto } from '../../core/models';

@Component({
  selector: 'app-medecin-patients',
  imports: [FormsModule, Icon, UiAvatar, UiEmpty, UiSkeleton, UiModal, UiConfirm],
  template: `
    <div class="page">
      <header class="page-head between">
        <div>
          <div class="eyebrow">Console praticien</div>
          <h1>Patientèle</h1>
          <p>Rattachez un patient existant à votre compte pour qu’il puisse demander un rendez-vous.</p>
        </div>
        <button type="button" class="btn" (click)="adding.set(true)">
          <ui-icon name="plus" [size]="15" /> Ajouter un patient
        </button>
      </header>

      @if (error()) {
        <div class="alert a-err mb-2" role="alert"><ui-icon name="alert" [size]="17" /><span>{{ error() }}</span></div>
      }

      <div class="card mb-3"><div class="card-body" style="padding:14px 16px">
        <div class="search">
          <ui-icon name="search" [size]="16" />
          <input type="search" [(ngModel)]="q" (ngModelChange)="query.set($event)"
                 placeholder="Rechercher un patient par nom ou e-mail…" aria-label="Rechercher un patient" />
        </div>
      </div></div>

      <div class="card">
        @if (loading()) {
          <div class="card-body"><ui-skeleton [count]="4" [height]="22" /></div>
        } @else if (!rows().length) {
          <ui-empty title="Aucun patient"
                    text="Ajoutez un patient à partir de l’adresse e-mail de son compte Medora.">
            <button type="button" class="btn" (click)="adding.set(true)">Ajouter un patient</button>
          </ui-empty>
        } @else {
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Patient</th><th>Adresse e-mail</th><th>Identifiant</th><th class="tr">Actions</th></tr></thead>
              <tbody>
                @for (p of rows(); track p.id) {
                  <tr>
                    <td><div class="row"><ui-avatar [name]="p.name" size="sm" /><span class="strong">{{ p.name }}</span></div></td>
                    <td class="muted">{{ p.email }}</td>
                    <td class="muted num">#{{ p.id }}</td>
                    <td class="actions">
                      <button type="button" class="btn sm secondary" (click)="startEdit(p)">Modifier</button>
                      <button type="button" class="btn sm danger-quiet" style="margin-left:6px" (click)="toRemove.set(p)">Retirer</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (adding()) {
      <ui-modal heading="Ajouter un patient"
                sub="Le patient doit déjà posséder un compte Medora."
                (close)="adding.set(false)">
        <label class="field" style="margin-bottom:0">
          <span class="lbl">Adresse e-mail du patient<span class="req">*</span></span>
          <input type="email" [(ngModel)]="newEmail" placeholder="patient@exemple.com" autocomplete="off" />
          <span class="hint">Le serveur refuse l’ajout si aucun compte patient ne correspond.</span>
        </label>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="adding.set(false)">Annuler</button>
          <button type="button" class="btn" [disabled]="saving() || !newEmail.trim()" (click)="add()">
            @if (saving()) { <i class="spin"></i> Ajout… } @else { Ajouter }
          </button>
        </div>
      </ui-modal>
    }

    @if (editing(); as p) {
      <ui-modal heading="Modifier la fiche patient" [sub]="p.email" (close)="editing.set(null)">
        <label class="field"><span class="lbl">Nom</span><input type="text" [(ngModel)]="editName" /></label>
        <label class="field" style="margin-bottom:0"><span class="lbl">Adresse e-mail</span>
          <input type="email" [(ngModel)]="editEmail" /></label>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="editing.set(null)">Annuler</button>
          <button type="button" class="btn" [disabled]="saving()" (click)="saveEdit()">
            @if (saving()) { <i class="spin"></i> Enregistrement… } @else { Enregistrer }
          </button>
        </div>
      </ui-modal>
    }

    @if (toRemove(); as p) {
      <ui-confirm heading="Retirer ce patient ?" [sub]="p.name + ' · ' + p.email"
                  body="Le patient ne pourra plus vous adresser de demande de rendez-vous. Cette action supprime la fiche côté serveur."
                  action="Retirer le patient" (cancel)="toRemove.set(null)" (confirm)="remove(p)" />
    }
  `,
})
export class MedecinPatients {
  private api = inject(Api);
  private toasts = inject(Toasts);

  protected patients = signal<PatientDto[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected saving = signal(false);

  protected q = '';
  protected query = signal('');
  protected adding = signal(false);
  protected editing = signal<PatientDto | null>(null);
  protected toRemove = signal<PatientDto | null>(null);
  protected newEmail = '';
  protected editName = '';
  protected editEmail = '';

  protected rows = computed(() => {
    const term = this.query().trim().toLowerCase();
    return this.patients().filter(p =>
      !term || p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term));
  });

  constructor() { this.load(); }

  private load() {
    this.loading.set(true);
    this.api.medecinPatients().subscribe({
      next: p => { this.patients.set(p); this.loading.set(false); },
      error: e => { this.loading.set(false); this.error.set(apiError(e)); },
    });
  }

  protected add() {
    const email = this.newEmail.trim();
    if (!email) return;
    this.saving.set(true);
    this.api.addPatient(email).subscribe({
      next: () => {
        this.saving.set(false); this.adding.set(false); this.newEmail = '';
        this.toasts.ok('Patient rattaché', `${email} peut maintenant demander un rendez-vous.`);
        this.load();
      },
      error: e => { this.saving.set(false); this.toasts.err('Ajout impossible', apiError(e)); },
    });
  }

  protected startEdit(p: PatientDto) {
    this.editing.set(p);
    this.editName = p.name;
    this.editEmail = p.email;
  }

  protected saveEdit() {
    const p = this.editing();
    if (!p?.id) return;
    this.saving.set(true);
    this.api.updatePatient(p.id, { ...p, name: this.editName, email: this.editEmail }).subscribe({
      next: () => {
        this.saving.set(false); this.editing.set(null);
        this.toasts.ok('Fiche mise à jour'); this.load();
      },
      error: e => { this.saving.set(false); this.toasts.err('Mise à jour refusée', apiError(e)); },
    });
  }

  protected remove(p: PatientDto) {
    this.toRemove.set(null);
    this.api.deletePatient(p).subscribe({
      next: () => { this.toasts.ok('Patient retiré'); this.load(); },
      error: e => this.toasts.err('Suppression impossible', apiError(e)),
    });
  }
}
