import { Component, computed, signal } from '@angular/core';
import { PRESCRIPTIONS, type Prescription } from '../../core/mock/health';
import { longDate, shortDate } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiEmpty, UiModal } from '../../ui/ui';

@Component({
  selector: 'app-patient-prescriptions',
  imports: [Icon, UiEmpty, UiModal],
  template: `
    <div class="page">
      <header class="page-head">
        <h1>Ordonnances</h1>
        <p>Traitements prescrits par votre équipe soignante. Les posologies affichées reprennent l’ordonnance d’origine.</p>
      </header>

      <div class="alert a-info mb-3">
        <ui-icon name="alert" [size]="17" />
        <span>Medora affiche vos ordonnances à titre informatif. Toute modification d’un traitement doit être décidée avec le médecin prescripteur.</span>
      </div>

      <div class="tabs" role="tablist">
        @for (t of tabs; track t) {
          <button type="button" role="tab" [attr.aria-selected]="tab() === t" [class.on]="tab() === t" (click)="tab.set(t)">
            {{ t }}<span class="count">{{ countOf(t) }}</span>
          </button>
        }
      </div>

      @if (!rows().length) {
        <div class="card"><ui-empty title="Aucune ordonnance" text="Aucun traitement dans cette catégorie." /></div>
      } @else {
        <div class="grid g2">
          @for (p of rows(); track p.id) {
            <article class="card rx">
              <div class="card-body">
                <div class="between" style="align-items:flex-start">
                  <div class="row" style="gap:12px;align-items:flex-start">
                    <span class="ic"><ui-icon name="pill" [size]="18" /></span>
                    <div>
                      <h3>{{ p.medication }}</h3>
                      <p class="muted" style="font-size:.84rem">{{ p.form }} · {{ p.dosage }}</p>
                    </div>
                  </div>
                  <span class="badge" [class.b-ok]="p.status === 'Active'" [class.b-warn]="p.status === 'Suspendue'">{{ p.status }}</span>
                </div>

                <dl class="rx-facts">
                  <div><dt>Fréquence</dt><dd>{{ p.frequency }}</dd></div>
                  <div><dt>Durée</dt><dd>{{ p.duration }}</dd></div>
                  <div><dt>Début</dt><dd>{{ short(p.start) }}</dd></div>
                  <div><dt>Fin</dt><dd>{{ short(p.end) }}</dd></div>
                </dl>

                @if (p.status === 'Active') {
                  <div class="mt-2">
                    <div class="row between mb-1">
                      <small class="muted">Progression du traitement</small>
                      <small class="num strong">{{ progress(p) }} %</small>
                    </div>
                    <div class="meter"><i [style.width.%]="progress(p)"></i></div>
                  </div>
                }
              </div>
              <footer class="card-foot between">
                <small class="muted">Prescrit par {{ p.prescriber }}</small>
                <button type="button" class="btn sm secondary" (click)="open.set(p)">Détail</button>
              </footer>
            </article>
          }
        </div>
      }
    </div>

    @if (open(); as p) {
      <ui-modal [heading]="p.medication" [sub]="p.form + ' · ' + p.dosage" (close)="open.set(null)">
        <dl class="detail">
          <div><dt>Statut</dt><dd>{{ p.status }}</dd></div>
          <div><dt>Posologie</dt><dd>{{ p.dosage }} — {{ p.frequency }}</dd></div>
          <div><dt>Durée</dt><dd>{{ p.duration }}</dd></div>
          <div><dt>Période</dt><dd>{{ long(p.start) }} → {{ long(p.end) }}</dd></div>
          <div><dt>Prescripteur</dt><dd>{{ p.prescriber }}</dd></div>
          <div><dt>Renouvellements</dt><dd>{{ p.refills }} restant(s)</dd></div>
        </dl>
        <div class="alert a-warn mt-3">
          <ui-icon name="alert" [size]="16" />
          <span>{{ p.notes }}</span>
        </div>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="open.set(null)">Fermer</button>
        </div>
      </ui-modal>
    }
  `,
  styles: [`
    .rx h3 { font-size: .99rem; }
    .rx .ic { width: 36px; height: 36px; border-radius: 10px; background: var(--mint-soft); color: #3f7a5f;
              border: 1px solid #cbe3d6; display: grid; place-items: center; flex: none; }
    .rx-facts, .detail { display: grid; grid-template-columns: 1fr 1fr; gap: 13px 18px; margin: 16px 0 0; }
    .detail { grid-template-columns: 1fr; gap: 12px; margin: 0; }
    .rx-facts dt, .detail dt { font-size: .71rem; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); font-weight: 700; }
    .rx-facts dd, .detail dd { margin: 3px 0 0; font-size: .88rem; font-weight: 550; }
    @media (max-width: 520px) { .rx-facts { grid-template-columns: 1fr; } }
  `],
})
export class PatientPrescriptions {
  protected tabs = ['Active', 'Terminée', 'Suspendue'];
  protected tab = signal('Active');
  protected open = signal<Prescription | null>(null);

  protected rows = computed(() => PRESCRIPTIONS.filter(p => p.status === this.tab()));
  protected countOf(t: string) { return PRESCRIPTIONS.filter(p => p.status === t).length; }

  protected progress(p: Prescription) {
    const start = new Date(p.start).getTime(), end = new Date(p.end).getTime();
    const pct = ((Date.now() - start) / (end - start)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  protected short = shortDate;
  protected long = longDate;
}
