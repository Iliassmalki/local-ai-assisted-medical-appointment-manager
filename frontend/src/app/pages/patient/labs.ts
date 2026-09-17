import { Component, computed, signal } from '@angular/core';
import { LABS, type LabResult } from '../../core/mock/health';
import { longDate, shortDate } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiEmpty, UiModal, UiSpark } from '../../ui/ui';

@Component({
  selector: 'app-patient-labs',
  imports: [Icon, UiEmpty, UiModal, UiSpark],
  template: `
    <div class="page">
      <header class="page-head">
        <h1>Analyses</h1>
        <p>Résultats transmis par les laboratoires, présentés avec l’intervalle de référence indiqué sur le compte rendu.</p>
      </header>

      <div class="alert a-info mb-3">
        <ui-icon name="alert" [size]="17" />
        <span>Un résultat situé hors de l’intervalle de référence n’est pas un diagnostic. L’interprétation relève du praticien.</span>
      </div>

      <div class="grid g3 mb-3">
        @for (s of summary(); track s.label) {
          <div class="card"><div class="card-body stat-tile">
            <span class="label">{{ s.label }}</span>
            <span class="value num">{{ s.count }}</span>
            <small class="muted">{{ s.hint }}</small>
          </div></div>
        }
      </div>

      <div class="row wrap mb-2" style="gap:7px">
        <button type="button" class="chip" [class.on]="!panel()" (click)="panel.set('')">Tous les bilans</button>
        @for (p of panels; track p) {
          <button type="button" class="chip" [class.on]="panel() === p" (click)="panel.set(p)">{{ p }}</button>
        }
      </div>

      <div class="card">
        @if (!rows().length) {
          <ui-empty title="Aucun résultat" text="Aucune analyse pour ce bilan." />
        } @else {
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>Analyse</th><th>Résultat</th><th>Intervalle de référence</th><th>Date</th><th>Statut</th><th class="tr"></th></tr></thead>
              <tbody>
                @for (l of rows(); track l.id) {
                  <tr>
                    <td><div class="strong">{{ l.test }}</div><small class="muted">{{ l.panel }}</small></td>
                    <td>
                      @if (l.value !== null) {
                        <span class="strong num">{{ l.value }}</span>&nbsp;<small class="muted">{{ l.unit }}</small>
                      } @else { <small class="muted">En attente</small> }
                    </td>
                    <td class="muted num nowrap">{{ l.refLow }} – {{ l.refHigh }} {{ l.unit }}</td>
                    <td class="muted nowrap">{{ short(l.date) }}</td>
                    <td>
                      <span class="badge" [class.b-ok]="l.state === 'in-range'"
                            [class.b-warn]="l.state === 'out-of-range'">{{ stateLabel(l.state) }}</span>
                    </td>
                    <td class="actions">
                      <button type="button" class="btn sm secondary" [disabled]="l.state === 'pending'"
                              (click)="open.set(l)">Détail</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    @if (open(); as l) {
      <ui-modal [heading]="l.test" [sub]="l.panel + ' · ' + l.lab" (close)="open.set(null)">
        <div class="result-hero">
          <div>
            <small class="muted">Valeur consignée</small>
            <div class="big num">{{ l.value }}&nbsp;<small>{{ l.unit }}</small></div>
          </div>
          <span class="badge" [class.b-ok]="l.state === 'in-range'" [class.b-warn]="l.state === 'out-of-range'">
            {{ stateLabel(l.state) }}
          </span>
        </div>

        <div class="mt-3">
          <div class="row between mb-1">
            <small class="muted num">{{ l.refLow }} {{ l.unit }}</small>
            <small class="muted">Intervalle de référence</small>
            <small class="muted num">{{ l.refHigh }} {{ l.unit }}</small>
          </div>
          <div class="range">
            <span class="band"></span>
            <span class="pin" [style.left.%]="pos(l)" [class.out]="l.state === 'out-of-range'"></span>
          </div>
        </div>

        @if (l.history.length > 1) {
          <div class="mt-3">
            <h4 class="mb-1">Évolution</h4>
            <div class="chart">
              <ui-spark [data]="values(l)" [w]="480" [h]="70"
                        [color]="l.state === 'out-of-range' ? 'var(--warn)' : 'var(--primary-600)'" />
            </div>
            <div class="row between mt-1">
              @for (h of l.history; track h.date) {
                <small class="faint">{{ short(h.date) }}</small>
              }
            </div>
          </div>
        }

        <p class="hint mt-3">Prélèvement du {{ long(l.date) }} — {{ l.lab }}.</p>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="open.set(null)">Fermer</button>
        </div>
      </ui-modal>
    }
  `,
  styles: [`
    .stat-tile { display: flex; flex-direction: column; }
    .stat-tile .label { font-size: .78rem; font-weight: 640; color: var(--muted); }
    .stat-tile .value { font-size: 1.9rem; font-weight: 680; line-height: 1.15; margin: 4px 0 2px; }
    .result-hero { display: flex; align-items: center; justify-content: space-between; gap: 14px;
                   padding: 18px; background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r); }
    .result-hero .big { font-size: 2rem; font-weight: 680; letter-spacing: -.02em; }
    .result-hero .big small { font-size: .85rem; font-weight: 500; color: var(--muted); }
    .range { position: relative; height: 10px; }
    .band { position: absolute; inset: 3px 0; background: var(--ok-soft); border: 1px solid var(--ok-line); border-radius: 999px; display: block; }
    .pin { position: absolute; top: 0; width: 3px; height: 10px; background: var(--primary); border-radius: 2px; transform: translateX(-50%); }
    .pin.out { background: var(--warn); }
    .chart { background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r); padding: 14px; }
  `],
})
export class PatientLabs {
  protected panels = [...new Set(LABS.map(l => l.panel))];
  protected panel = signal('');
  protected open = signal<LabResult | null>(null);

  protected rows = computed(() =>
    LABS.filter(l => !this.panel() || l.panel === this.panel())
      .sort((a, b) => b.date.localeCompare(a.date)));

  protected summary = computed(() => [
    { label: 'Dans l’intervalle', count: LABS.filter(l => l.state === 'in-range').length, hint: 'Valeurs consignées dans la plage du laboratoire' },
    { label: 'Hors intervalle', count: LABS.filter(l => l.state === 'out-of-range').length, hint: 'À revoir avec le praticien' },
    { label: 'En attente', count: LABS.filter(l => l.state === 'pending').length, hint: 'Résultat non encore transmis' },
  ]);

  protected stateLabel(s: LabResult['state']) {
    return s === 'in-range' ? 'Dans l’intervalle' : s === 'out-of-range' ? 'Hors intervalle' : 'En attente';
  }

  /** Position of the value on the reference band, clamped to the visible track. */
  protected pos(l: LabResult) {
    if (l.value === null) return 50;
    const span = l.refHigh - l.refLow || 1;
    return Math.max(2, Math.min(98, ((l.value - l.refLow) / span) * 100));
  }

  protected values(l: LabResult) { return l.history.map(h => h.value); }

  protected short = shortDate;
  protected long = longDate;
}
