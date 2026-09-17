import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../core/auth';
import { Toasts } from '../core/toast';
import { dateTime, relative } from '../core/format';
import { DEVICES, EMERGENCY } from '../core/mock/inbox';
import { ROLE_LABEL } from '../layout/nav';
import { Icon } from '../ui/icon';
import { UiAvatar, UiConfirm } from '../ui/ui';

type Tab = 'profil' | 'notifications' | 'confidentialite' | 'securite' | 'urgence';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, Icon, UiAvatar, UiConfirm],
  template: `
    <div class="page" style="max-width:940px">
      <header class="page-head">
        <h1>Paramètres</h1>
        <p>Compte, préférences et informations d’urgence.</p>
      </header>

      <div class="tabs" role="tablist">
        @for (t of tabs; track t.key) {
          <button type="button" role="tab" [attr.aria-selected]="tab() === t.key"
                  [class.on]="tab() === t.key" (click)="tab.set(t.key)">{{ t.label }}</button>
        }
      </div>

      @if (tab() === 'profil') {
        <section class="card mb-3">
          <header class="card-head"><h2>Informations personnelles</h2></header>
          <div class="card-body">
            <div class="row mb-3" style="gap:16px">
              <ui-avatar [name]="user()?.name" size="xl" />
              <div>
                <h3>{{ user()?.name }}</h3>
                <p class="muted" style="font-size:.88rem">{{ user()?.email }}</p>
                <span class="badge b-brand mt-1">{{ roleLabel() }}</span>
              </div>
            </div>

            <div class="grid g2">
              <label class="field"><span class="lbl">Nom affiché</span>
                <input type="text" [(ngModel)]="name" autocomplete="name" /></label>
              <label class="field"><span class="lbl">Adresse e-mail</span>
                <input type="email" [value]="user()?.email" disabled />
                <span class="hint">Identifiant de connexion — non modifiable.</span></label>
              <label class="field"><span class="lbl">Téléphone</span>
                <input type="tel" [(ngModel)]="phone" placeholder="+212 6 00 00 00 00" /></label>
              <label class="field"><span class="lbl">Date de naissance</span>
                <input type="date" [(ngModel)]="birth" /></label>
            </div>
          </div>
          <footer class="card-foot" style="display:flex;justify-content:flex-end">
            <button type="button" class="btn" (click)="saveProfile()">Enregistrer</button>
          </footer>
        </section>

        <section class="card">
          <header class="card-head"><h2>Contact d’urgence</h2></header>
          <div class="list">
            @for (c of emergency.contacts; track c.phone) {
              <div class="list-item">
                <ui-avatar [name]="c.name" size="sm" tone="neutral" />
                <div style="flex:1"><div class="title">{{ c.name }}</div><div class="meta">{{ c.relation }}</div></div>
                <a class="btn sm secondary" [href]="'tel:' + c.phone"><ui-icon name="phone" [size]="13" /> {{ c.phone }}</a>
              </div>
            }
          </div>
        </section>
      }

      @if (tab() === 'notifications') {
        <section class="card">
          <header class="card-head"><h2>Préférences de notification</h2></header>
          <div class="list">
            @for (p of prefs(); track p.key) {
              <label class="list-item" style="cursor:pointer">
                <div style="flex:1">
                  <div class="title">{{ p.label }}</div>
                  <div class="meta">{{ p.hint }}</div>
                </div>
                <span class="switch">
                  <input type="checkbox" [checked]="p.on" (change)="toggle(p.key)" [attr.aria-label]="p.label" />
                  <span class="track"></span>
                </span>
              </label>
            }
          </div>
        </section>
      }

      @if (tab() === 'confidentialite') {
        <section class="card">
          <header class="card-head"><h2>Confidentialité</h2></header>
          <div class="card-body">
            <div class="alert a-info mb-3">
              <ui-icon name="lock" [size]="17" />
              <span>Vos documents médicaux ne sont accessibles qu’à vous et au praticien qui vous suit. Le serveur vérifie ce rattachement à chaque requête.</span>
            </div>
            @for (p of privacy(); track p.key) {
              <label class="check mb-2">
                <input type="checkbox" [checked]="p.on" (change)="togglePrivacy(p.key)" />
                <span><strong>{{ p.label }}</strong><br /><small class="muted">{{ p.hint }}</small></span>
              </label>
            }
          </div>
        </section>
      }

      @if (tab() === 'securite') {
        <section class="card mb-3">
          <header class="card-head"><h2>Sécurité du compte</h2></header>
          <div class="card-body">
            <ul class="facts">
              <li><ui-icon name="lock" [size]="15" /> Mot de passe stocké haché avec BCrypt côté serveur.</li>
              <li><ui-icon name="shield" [size]="15" /> Session portée par un jeton JWT signé (HMAC-SHA256).</li>
              <li><ui-icon name="check" [size]="15" /> Autorisations vérifiées à chaque appel selon votre rôle.</li>
            </ul>
            <button type="button" class="btn secondary mt-3" (click)="notImplemented()">Changer le mot de passe</button>
          </div>
        </section>

        <section class="card mb-3">
          <header class="card-head"><h2>Appareils connectés</h2></header>
          <div class="list">
            @for (d of devices; track d.id) {
              <div class="list-item">
                <span class="dev"><ui-icon name="device" [size]="15" /></span>
                <div style="flex:1">
                  <div class="title">{{ d.name }} @if (d.current) { <span class="badge b-ok">Cet appareil</span> }</div>
                  <div class="meta">{{ d.location }} · {{ rel(d.lastSeen) }}</div>
                </div>
                @if (!d.current) {
                  <button type="button" class="btn sm danger-quiet" (click)="notImplemented()">Déconnecter</button>
                }
              </div>
            }
          </div>
        </section>

        <section class="card">
          <div class="card-body between">
            <div><strong>Se déconnecter</strong><p class="muted" style="font-size:.85rem">Le jeton est effacé de cet appareil.</p></div>
            <button type="button" class="btn danger" (click)="confirmOut.set(true)">
              <ui-icon name="logout" [size]="15" /> Déconnexion
            </button>
          </div>
        </section>
      }

      @if (tab() === 'urgence') {
        <section class="card raised emergency mb-3">
          <header class="card-head">
            <h2><ui-icon name="alert" [size]="17" /> Informations d’urgence</h2>
            <span class="badge b-err">Accès rapide</span>
          </header>
          <div class="card-body">
            <p class="hint mb-3">Informations déclarées par le patient, destinées aux secours. Elles ne remplacent pas un dossier médical complet.</p>
            <div class="grid g2">
              <div class="box"><small class="muted">Groupe sanguin déclaré</small><strong class="big">{{ emergency.bloodType }}</strong></div>
              <div class="box"><small class="muted">Numéro d’ambulance</small>
                <a class="big" [href]="'tel:' + emergency.ambulance">{{ emergency.ambulance }}</a></div>
            </div>

            <div class="grid g3 mt-3">
              <div><h4 class="mb-1">Allergies déclarées</h4>
                @for (a of emergency.allergies; track a) { <span class="badge b-err mb-1">{{ a }}</span> }</div>
              <div><h4 class="mb-1">Antécédents déclarés</h4>
                @for (c of emergency.conditions; track c) { <span class="badge b-warn mb-1">{{ c }}</span> }</div>
              <div><h4 class="mb-1">Traitements en cours</h4>
                @for (t of emergency.treatments; track t) { <span class="badge b-mint mb-1">{{ t }}</span> }</div>
            </div>
          </div>
        </section>

        <section class="card">
          <header class="card-head"><h2>Personnes à prévenir</h2></header>
          <div class="list">
            @for (c of emergency.contacts; track c.phone) {
              <div class="list-item">
                <ui-avatar [name]="c.name" size="sm" tone="mint" />
                <div style="flex:1"><div class="title">{{ c.name }}</div><div class="meta">{{ c.relation }}</div></div>
                <a class="btn sm" [href]="'tel:' + c.phone"><ui-icon name="phone" [size]="13" /> Appeler</a>
              </div>
            }
          </div>
        </section>
      }
    </div>

    @if (confirmOut()) {
      <ui-confirm heading="Se déconnecter ?" body="Vous devrez vous identifier de nouveau pour accéder à votre espace."
                  action="Se déconnecter" (cancel)="confirmOut.set(false)" (confirm)="logout()" />
    }
  `,
  styles: [`
    .facts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
    .facts li { display: flex; gap: 10px; align-items: center; font-size: .89rem; color: var(--ink-2); }
    .facts li ui-icon { color: var(--mint); }
    .dev { width: 32px; height: 32px; border-radius: 9px; background: var(--surface-2); border: 1px solid var(--line);
           color: var(--ink-2); display: grid; place-items: center; flex: none; }
    .emergency { border-color: var(--err-line); }
    .emergency .card-head h2 { display: flex; align-items: center; gap: 8px; color: var(--err); }
    .box { padding: 16px; border: 1px solid var(--line); border-radius: var(--r); background: var(--surface-2); }
    .box .big { display: block; font-size: 1.5rem; font-weight: 700; margin-top: 3px; letter-spacing: -.02em; }
    .badge { margin-right: 5px; }
  `],
})
export class Settings {
  private auth = inject(Auth);
  private toasts = inject(Toasts);

  protected tabs: { key: Tab; label: string }[] = [
    { key: 'profil', label: 'Profil' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'confidentialite', label: 'Confidentialité' },
    { key: 'securite', label: 'Sécurité' },
    { key: 'urgence', label: 'Urgence' },
  ];

  protected tab = signal<Tab>('profil');
  protected user = this.auth.user;
  protected roleLabel = computed(() => {
    const r = this.user()?.role;
    return r ? ROLE_LABEL[r] : '';
  });

  protected emergency = EMERGENCY;
  protected devices = DEVICES;
  protected confirmOut = signal(false);

  protected name = this.auth.user()?.name ?? '';
  protected phone = '+212 6 61 22 14 08';
  protected birth = '1998-03-14';

  protected prefs = signal([
    { key: 'appt', label: 'Rappels de rendez-vous', hint: 'Notification 24 h avant chaque consultation', on: true },
    { key: 'labs', label: 'Résultats d’analyses', hint: 'Dès qu’un laboratoire transmet un résultat', on: true },
    { key: 'msg', label: 'Nouveaux messages', hint: 'Réponse d’un praticien dans la messagerie', on: true },
    { key: 'rx', label: 'Ordonnances', hint: 'Renouvellement ou modification d’un traitement', on: false },
    { key: 'news', label: 'Actualités du service', hint: 'Informations générales sur la plateforme', on: false },
  ]);

  protected privacy = signal([
    { key: 'share', label: 'Partager mon dossier avec mon praticien référent', hint: 'Requis pour le suivi médical.', on: true },
    { key: 'history', label: 'Conserver l’historique de consultation', hint: 'Les rendez-vous passés restent visibles dans votre espace.', on: true },
    { key: 'research', label: 'Statistiques anonymisées', hint: 'Données agrégées pour le suivi d’activité de la plateforme.', on: false },
  ]);

  protected toggle(key: string) {
    this.prefs.update(l => l.map(p => (p.key === key ? { ...p, on: !p.on } : p)));
    this.toasts.ok('Préférence enregistrée');
  }
  protected togglePrivacy(key: string) {
    this.privacy.update(l => l.map(p => (p.key === key ? { ...p, on: !p.on } : p)));
    this.toasts.ok('Préférence enregistrée');
  }

  protected saveProfile() {
    this.auth.setName(this.name);
    this.toasts.ok('Profil mis à jour', 'Le nom affiché est conservé sur cet appareil.');
  }

  protected notImplemented() {
    this.toasts.info('Non disponible', 'Cette action n’est pas exposée par l’API dans cette version.');
  }

  protected logout() { this.auth.logout(); }
  protected rel = relative;
  protected dt = dateTime;
}
