import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CITIES, DOCTORS, SPECIALTIES, type Doctor } from '../../core/mock/doctors';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiEmpty } from '../../ui/ui';
import { Api } from '../../core/api';

@Component({
  selector: 'app-patient-doctors',
  imports: [FormsModule, RouterLink, Icon, UiAvatar, UiEmpty],
  template: `
    <div class="page">
      <header class="page-head">
        <h1>Trouver un praticien</h1>
        <p>Annuaire de démonstration. Un praticien doit vous rattacher à sa patientèle avant que vous puissiez lui adresser une demande.</p>
      </header>

      <div class="card mb-3"><div class="card-body">
        <div class="filters">
          <div class="search" style="grid-column:span 2">
            <ui-icon name="search" [size]="16" />
            <input type="search" [(ngModel)]="q" (ngModelChange)="query.set($event)"
                   placeholder="Nom, spécialité, cabinet…" aria-label="Rechercher un praticien" />
          </div>

          <label><span class="sr-only">Spécialité</span>
            <select [(ngModel)]="spec" (ngModelChange)="specialty.set($event)" aria-label="Spécialité">
              <option value="">Toutes spécialités</option>
              @for (s of specialties; track s) { <option [value]="s">{{ s }}</option> }
            </select>
          </label>

          <label><span class="sr-only">Ville</span>
            <select [(ngModel)]="cityV" (ngModelChange)="city.set($event)" aria-label="Ville">
              <option value="">Toutes les villes</option>
              @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </label>

          <label><span class="sr-only">Type de consultation</span>
            <select [(ngModel)]="modeV" (ngModelChange)="mode.set($event)" aria-label="Type de consultation">
              <option value="">Tous les types</option>
              <option value="Cabinet">Cabinet</option>
              <option value="Téléconsultation">Téléconsultation</option>
              <option value="Domicile">Domicile</option>
            </select>
          </label>

          <label><span class="sr-only">Tri</span>
            <select [(ngModel)]="sortV" (ngModelChange)="sort.set($event)" aria-label="Trier">
              <option value="rating">Mieux notés</option>
              <option value="price">Tarif croissant</option>
              <option value="years">Expérience</option>
            </select>
          </label>
        </div>

        <div class="row wrap mt-2">
          <label class="check" style="margin-right:auto">
            <input type="checkbox" [(ngModel)]="openOnly" (ngModelChange)="accepting.set($event)" />
            <span>Accepte de nouveaux patients</span>
          </label>
          <span class="hint">{{ results().length }} praticien(s)</span>
          @if (dirty()) { <button type="button" class="btn sm quiet" (click)="reset()">Réinitialiser</button> }
        </div>
      </div></div>

      @if (!results().length) {
        <div class="card"><ui-empty title="Aucun résultat" text="Ajustez les filtres pour élargir la recherche.">
          <button type="button" class="btn secondary" (click)="reset()">Réinitialiser les filtres</button>
        </ui-empty></div>
      } @else {
        <div class="grid g3">
          @for (d of results(); track d.id) {
            <article class="card doc">
              <div class="card-body">
                <div class="row" style="align-items:flex-start;gap:13px">
                  <ui-avatar [name]="d.name" size="lg" [tone]="d.accepting ? '' : 'neutral'" />
                  <div style="flex:1;min-width:0">
                    <h3>{{ d.name }}</h3>
                    <p class="muted" style="font-size:.85rem">{{ d.specialty }}</p>
                    <div class="row mt-1" style="gap:5px">
                      <ui-icon name="star" [size]="13" />
                      <span class="strong num" style="font-size:.85rem">{{ d.rating }}</span>
                      <small class="faint">({{ d.reviewCount }} avis)</small>
                    </div>
                  </div>
                </div>

                <ul class="meta">
                  <li><ui-icon name="pin" [size]="14" /> {{ d.clinic }}, {{ d.city }}</li>
                  <li><ui-icon name="clock" [size]="14" /> {{ d.years }} ans d’expérience · {{ d.languages.join(', ') }}</li>
                  <li><ui-icon name="calendar" [size]="14" /> Prochaine disponibilité : {{ d.nextSlot }}</li>
                </ul>

                <div class="row wrap" style="gap:6px;margin-top:12px">
                  @for (m of d.modes; track m) { <span class="badge">{{ m }}</span> }
                  @if (d.accepting) { <span class="badge b-ok">Accepte des patients</span> }
                  @else { <span class="badge b-warn">Patientèle complète</span> }
                </div>
              </div>
              <footer class="card-foot between">
                <span><strong class="num">{{ d.price }} DH</strong> <small class="muted">/ consultation</small></span>
                <a class="btn sm secondary" [routerLink]="['/app/medecins', d.id]">Voir le profil</a>
              </footer>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .filters { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 10px; }
    .filters label { display: block; margin: 0; }
    .doc h3 { font-size: .98rem; }
    .doc .meta { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
    .doc .meta li { display: flex; gap: 8px; align-items: center; font-size: .83rem; color: var(--ink-2); }
    .doc .meta li ui-icon { color: var(--faint); }
    @media (max-width: 1100px) { .filters { grid-template-columns: repeat(2, minmax(0,1fr)); }
      .filters .search { grid-column: span 2; } }
    @media (max-width: 560px) { .filters { grid-template-columns: 1fr; } .filters .search { grid-column: auto; } }
  `],
})
export class PatientDoctors {
  private api = inject(Api);

  protected specialties = SPECIALTIES;
  protected cities = CITIES;

  protected q = ''; protected spec = ''; protected cityV = '';
  protected modeV = ''; protected sortV = 'rating'; protected openOnly = false;

  protected query = signal(''); protected specialty = signal(''); protected city = signal('');
  protected mode = signal(''); protected sort = signal('rating'); protected accepting = signal(false);

  protected dirty = computed(() =>
    !!(this.query() || this.specialty() || this.city() || this.mode() || this.accepting() || this.sort() !== 'rating'));

  protected results = computed<Doctor[]>(() => {
    const term = this.query().trim().toLowerCase();
    let list = DOCTORS.filter(d => {
      if (term && ![d.name, d.specialty, d.clinic, d.city].some(v => v.toLowerCase().includes(term))) return false;
      if (this.specialty() && d.specialty !== this.specialty()) return false;
      if (this.city() && d.city !== this.city()) return false;
      if (this.mode() && !d.modes.includes(this.mode() as Doctor['modes'][number])) return false;
      if (this.accepting() && !d.accepting) return false;
      return true;
    });

    const by = this.sort();
    list = [...list].sort((a, b) =>
      by === 'price' ? a.price - b.price : by === 'years' ? b.years - a.years : b.rating - a.rating);
    return list;
  });

  protected reset() {
    this.q = ''; this.spec = ''; this.cityV = ''; this.modeV = ''; this.sortV = 'rating'; this.openOnly = false;
    this.query.set(''); this.specialty.set(''); this.city.set('');
    this.mode.set(''); this.sort.set('rating'); this.accepting.set(false);
  }
}
