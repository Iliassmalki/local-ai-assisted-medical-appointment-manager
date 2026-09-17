import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RECORDS, RECORD_CATEGORIES, type MedicalRecord } from '../../core/mock/health';
import { longDate, shortDate } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiEmpty, UiModal } from '../../ui/ui';

@Component({
  selector: 'app-patient-records',
  imports: [FormsModule, Icon, UiEmpty, UiModal],
  template: `
    <div class="page">
      <header class="page-head between">
        <div>
          <h1>Dossier médical</h1>
          <p>Documents partagés par vos praticiens et établissements de soins.</p>
        </div>
        <button type="button" class="btn secondary" (click)="upload()">
          <ui-icon name="upload" [size]="15" /> Déposer un document
        </button>
      </header>

      <div class="card mb-3"><div class="card-body">
        <div class="row wrap" style="gap:10px">
          <div class="search" style="flex:1;min-width:220px">
            <ui-icon name="search" [size]="16" />
            <input type="search" [(ngModel)]="q" (ngModelChange)="query.set($event)"
                   placeholder="Rechercher un document…" aria-label="Rechercher un document" />
          </div>
          <select [(ngModel)]="st" (ngModelChange)="state.set($event)" aria-label="Statut" style="width:auto">
            <option value="">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="En attente">En attente</option>
            <option value="Archivé">Archivé</option>
          </select>
        </div>

        <div class="row wrap mt-2" style="gap:7px">
          <button type="button" class="chip" [class.on]="!category()" (click)="category.set('')">
            Tout <span class="num">({{ all.length }})</span>
          </button>
          @for (c of categories; track c) {
            <button type="button" class="chip" [class.on]="category() === c" (click)="category.set(c)">
              {{ c }} <span class="num">({{ countOf(c) }})</span>
            </button>
          }
        </div>
      </div></div>

      <div class="card">
        @if (!rows().length) {
          <ui-empty title="Aucun document" text="Aucun document ne correspond à cette recherche." />
        } @else {
          <div class="table-wrap desk">
            <table class="tbl">
              <thead><tr><th>Document</th><th>Catégorie</th><th>Date</th><th>Émetteur</th><th>Statut</th><th class="tr">Actions</th></tr></thead>
              <tbody>
                @for (r of rows(); track r.id) {
                  <tr>
                    <td>
                      <div class="row">
                        <span class="fic"><ui-icon name="doc" [size]="15" /></span>
                        <div><div class="strong">{{ r.title }}</div>
                          <small class="muted">{{ r.pages ? r.pages + ' page(s) · ' + r.size : 'En cours' }}</small></div>
                      </div>
                    </td>
                    <td><span class="badge">{{ r.category }}</span></td>
                    <td class="muted nowrap">{{ short(r.date) }}</td>
                    <td class="muted">{{ r.author }}</td>
                    <td>
                      <span class="badge" [class.b-ok]="r.status === 'Disponible'"
                            [class.b-warn]="r.status === 'En attente'">{{ r.status }}</span>
                    </td>
                    <td class="actions">
                      <button type="button" class="btn sm secondary" [disabled]="r.status === 'En attente'"
                              (click)="open.set(r)">Consulter</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="list mob">
            @for (r of rows(); track r.id) {
              <button type="button" class="list-item" style="text-align:left;background:none;border:none;border-bottom:1px solid var(--line);width:100%"
                      [disabled]="r.status === 'En attente'" (click)="open.set(r)">
                <span class="fic"><ui-icon name="doc" [size]="15" /></span>
                <span style="flex:1;min-width:0">
                  <span class="title" style="display:block">{{ r.title }}</span>
                  <span class="meta">{{ r.category }} · {{ short(r.date) }}</span>
                </span>
                <ui-icon name="chevron" [size]="15" />
              </button>
            }
          </div>
        }
      </div>
    </div>

    @if (open(); as r) {
      <ui-modal [heading]="r.title" [sub]="r.category + ' · ' + long(r.date)" [wide]="true" (close)="open.set(null)">
        <div class="preview">
          <div class="sheet">
            <div class="sheet-head">
              <strong>{{ r.facility }}</strong>
              <small class="muted">{{ long(r.date) }}</small>
            </div>
            <h3>{{ r.title }}</h3>
            <p class="muted" style="font-size:.85rem;margin-bottom:14px">Émis par {{ r.author }}</p>
            @for (line of r.body; track $index) { <p class="para">{{ line }}</p> }
            <p class="stamp">Document de démonstration — contenu non médical.</p>
          </div>
        </div>
        <div foot class="modal-foot">
          <button type="button" class="btn secondary" (click)="open.set(null)">Fermer</button>
          <button type="button" class="btn" (click)="download(r)"><ui-icon name="download" [size]="15" /> Télécharger</button>
        </div>
      </ui-modal>
    }
  `,
  styles: [`
    .fic { width: 32px; height: 32px; border-radius: 9px; background: var(--surface-2); border: 1px solid var(--line);
           color: var(--ink-2); display: grid; place-items: center; flex: none; }
    .mob { display: none; }
    .preview { background: var(--surface-2); border-radius: var(--r); padding: 20px; }
    .sheet { background: #fff; border: 1px solid var(--line); border-radius: var(--r-sm); padding: 26px; box-shadow: var(--sh-1); }
    .sheet-head { display: flex; justify-content: space-between; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--line); }
    .para { font-size: .89rem; line-height: 1.7; color: var(--ink-2); margin-bottom: 9px; }
    .stamp { margin-top: 18px; padding-top: 12px; border-top: 1px dashed var(--line-2); font-size: .76rem; color: var(--faint); }
    @media (max-width: 860px) { .desk { display: none; } .mob { display: flex; } }
  `],
})
export class PatientRecords {
  protected all = RECORDS;
  protected categories = RECORD_CATEGORIES;

  protected q = ''; protected st = '';
  protected query = signal(''); protected category = signal(''); protected state = signal('');
  protected open = signal<MedicalRecord | null>(null);

  protected rows = computed(() => {
    const term = this.query().trim().toLowerCase();
    return RECORDS.filter(r => {
      if (term && ![r.title, r.author, r.facility, r.summary].some(v => v.toLowerCase().includes(term))) return false;
      if (this.category() && r.category !== this.category()) return false;
      if (this.state() && r.status !== this.state()) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  });

  protected countOf(c: string) { return RECORDS.filter(r => r.category === c).length; }
  protected short = shortDate;
  protected long = longDate;
  protected upload() { window.alert('Le dépôt de document est simulé dans ce prototype.'); }
  protected download(r: MedicalRecord) { window.alert(`Téléchargement simulé : ${r.title}`); }
}
