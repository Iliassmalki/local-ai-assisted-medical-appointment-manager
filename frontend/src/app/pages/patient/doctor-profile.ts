import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOCTORS, SLOTS, slotTaken } from '../../core/mock/doctors';
import { shortDate } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiAvatar, UiEmpty } from '../../ui/ui';

@Component({
  selector: 'app-doctor-profile',
  imports: [RouterLink, Icon, UiAvatar, UiEmpty],
  template: `
    @if (doctor(); as d) {
      <div class="page" style="max-width:1000px">
        <a class="btn quiet sm" routerLink="/app/medecins" style="margin-left:-11px;margin-bottom:12px">
          <ui-icon name="arrowLeft" [size]="14" /> Retour à l’annuaire
        </a>

        <section class="card raised mb-3">
          <div class="card-body">
            <div class="hero">
              <ui-avatar [name]="d.name" size="xl" />
              <div style="flex:1;min-width:0">
                <h1>{{ d.name }}</h1>
                <p class="muted mt-1">{{ d.specialty }} · {{ d.years }} ans d’expérience</p>
                <div class="row wrap mt-2" style="gap:7px">
                  <span class="badge b-brand"><ui-icon name="star" [size]="12" /> {{ d.rating }} ({{ d.reviewCount }} avis)</span>
                  @for (m of d.modes; track m) { <span class="badge">{{ m }}</span> }
                  @if (d.accepting) { <span class="badge b-ok">Accepte des patients</span> }
                  @else { <span class="badge b-warn">Patientèle complète</span> }
                </div>
              </div>
              <div class="cta">
                <div class="price"><strong class="num">{{ d.price }} DH</strong><small class="muted">par consultation</small></div>
                <a class="btn block" routerLink="/app/rendez-vous/nouveau">Prendre rendez-vous</a>
                <small class="hint">Possible uniquement si ce praticien vous a rattaché.</small>
              </div>
            </div>
          </div>
        </section>

        <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">
          <div class="col" style="gap:16px">
            <section class="card">
              <header class="card-head"><h2>Présentation</h2></header>
              <div class="card-body">
                <p style="line-height:1.65">{{ d.bio }}</p>
                <h4 class="mt-3 mb-1">Domaines de consultation</h4>
                <div class="row wrap" style="gap:6px">
                  @for (f of d.focus; track f) { <span class="badge b-mint">{{ f }}</span> }
                </div>
                <h4 class="mt-3 mb-1">Qualifications</h4>
                <ul class="quals">
                  @for (q of d.qualifications; track q) {
                    <li><ui-icon name="check" [size]="14" [width]="2.4" /> {{ q }}</li>
                  }
                </ul>
              </div>
            </section>

            <section class="card">
              <header class="card-head">
                <h2>Avis des patients</h2>
                <span class="badge b-brand"><ui-icon name="star" [size]="12" /> {{ d.rating }}</span>
              </header>
              @if (d.reviews.length) {
                <div class="list">
                  @for (r of d.reviews; track r.author) {
                    <div class="list-item" style="align-items:flex-start">
                      <ui-avatar [name]="r.author" size="sm" tone="neutral" />
                      <div style="flex:1;min-width:0">
                        <div class="row between" style="gap:8px">
                          <span class="title">{{ r.author }}</span>
                          <small class="faint nowrap">{{ date(r.date) }}</small>
                        </div>
                        <div class="stars" [attr.aria-label]="r.rating + ' sur 5'">
                          @for (s of [1,2,3,4,5]; track s) {
                            <ui-icon name="star" [size]="12" [class.off]="s > r.rating" />
                          }
                        </div>
                        <p class="meta mt-1">{{ r.text }}</p>
                      </div>
                    </div>
                  }
                </div>
              } @else { <ui-empty title="Aucun avis" text="Ce praticien n’a pas encore d’avis publié." /> }
            </section>
          </div>

          <div class="col" style="gap:16px">
            <section class="card">
              <header class="card-head"><h2>Cabinet</h2></header>
              <div class="card-body">
                <ul class="quals">
                  <li><ui-icon name="pin" [size]="14" /> {{ d.clinic }}</li>
                  <li><ui-icon name="grid" [size]="14" /> {{ d.address }}</li>
                  <li><ui-icon name="chat" [size]="14" /> {{ d.languages.join(', ') }}</li>
                </ul>
              </div>
            </section>

            <section class="card">
              <header class="card-head"><h2>Disponibilités</h2></header>
              <div class="card-body">
                <p class="hint mb-2">Prochains créneaux indicatifs — {{ d.nextSlot }}.</p>
                <div class="slots">
                  @for (s of slots; track s) {
                    <span class="slot" [class.off]="taken(d.id, s)">{{ s }}</span>
                  }
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    } @else {
      <div class="page"><div class="card">
        <ui-empty title="Praticien introuvable" text="Cette fiche n’existe pas ou a été retirée de l’annuaire.">
          <a class="btn" routerLink="/app/medecins">Retour à l’annuaire</a>
        </ui-empty>
      </div></div>
    }
  `,
  styles: [`
    .hero { display: flex; gap: 22px; align-items: flex-start; }
    .hero h1 { font-size: 1.45rem; }
    .cta { width: 210px; flex: none; display: flex; flex-direction: column; gap: 9px; text-align: center;
           padding: 15px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
    .cta .price strong { display: block; font-size: 1.3rem; }
    .cta .price small { font-size: .76rem; }
    .quals { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
    .quals li { display: flex; gap: 9px; align-items: flex-start; font-size: .88rem; color: var(--ink-2); }
    .quals li ui-icon { color: var(--mint); margin-top: 2px; }
    .stars { display: flex; gap: 2px; color: #c99a2e; margin-top: 4px; }
    .stars ui-icon.off { color: var(--line-2); }
    .slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px,1fr)); gap: 7px; }
    .slot { padding: 7px 4px; text-align: center; font-size: .82rem; font-weight: 600; border-radius: var(--r-xs);
            background: var(--primary-soft); color: var(--primary-700); font-variant-numeric: tabular-nums; }
    .slot.off { background: var(--surface-2); color: var(--faint); text-decoration: line-through; }
    @media (max-width: 1000px) { .grid { grid-template-columns: 1fr !important; } }
    @media (max-width: 700px) { .hero { flex-direction: column; } .cta { width: 100%; } }
  `],
})
export class DoctorProfile {
  readonly id = input<string>('');
  protected slots = SLOTS.slice(0, 8);
  protected doctor = computed(() => DOCTORS.find(d => d.id === this.id()));
  protected date = shortDate;
  protected taken(doctorId: string, slot: string) { return slotTaken(doctorId, 'profile', slot); }
}
