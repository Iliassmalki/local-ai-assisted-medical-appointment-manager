import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { apiError } from '../core/auth-interceptor';
import { Icon } from '../ui/icon';
import { SPECIALTIES } from '../core/mock/doctors';
import type { Role } from '../core/models';

@Component({
  selector: 'app-register',
  styleUrl: './auth.css',
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <div class="split">
      <section class="aside">
        <div class="brand">
          <span class="mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg></span>
          Medora
        </div>
        <div class="mid">
          <h2>Créer votre espace Medora.</h2>
          <p>Un compte patient permet de demander un rendez-vous auprès du praticien qui vous suit. Un compte praticien donne accès à la console de gestion des consultations.</p>
          <ul>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Mot de passe stocké haché (BCrypt)</li>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Jeton JWT émis à l’inscription</li>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Autorisations appliquées côté serveur</li>
          </ul>
        </div>
        <div class="foot">Les données saisies alimentent la base de démonstration.</div>
      </section>

      <section class="form-side">
        <div class="box">
          <h1>Créer un compte</h1>
          <p class="lead">Sélectionnez le type de compte à créer.</p>

          @if (error()) {
            <div class="alert a-err mb-2" role="alert">
              <ui-icon name="alert" [size]="16" /><span>{{ error() }}</span>
            </div>
          }

          <form (ngSubmit)="submit()" novalidate>
            <div class="roles" role="radiogroup" aria-label="Type de compte">
              @for (r of roles; track r.value) {
                <button type="button" class="role" [class.on]="role() === r.value"
                        role="radio" [attr.aria-checked]="role() === r.value" (click)="role.set(r.value)">
                  <span class="ic"><ui-icon [name]="r.icon" [size]="18" /></span>
                  <span class="t">{{ r.label }}</span>
                </button>
              }
            </div>

            <label class="field">
              <span class="lbl">Nom complet</span>
              <input type="text" name="name" [(ngModel)]="name" required autocomplete="name"
                     placeholder="Prénom Nom" [class.invalid]="touched() && !name" />
            </label>

            <label class="field">
              <span class="lbl">Adresse e-mail</span>
              <input type="email" name="email" [(ngModel)]="email" required autocomplete="email"
                     placeholder="vous@exemple.com" [class.invalid]="touched() && !email" />
            </label>

            @if (role() === 'MEDECIN') {
              <label class="field">
                <span class="lbl">Spécialité</span>
                <select name="specialite" [(ngModel)]="specialite">
                  @for (s of specialties; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </label>
            }

            <label class="field">
              <span class="lbl">Mot de passe</span>
              <input type="password" name="password" [(ngModel)]="password" required minlength="6"
                     autocomplete="new-password" placeholder="6 caractères minimum"
                     [class.invalid]="touched() && password.length < 6" />
              @if (touched() && password.length < 6) {
                <span class="err-text">Le mot de passe doit contenir au moins 6 caractères.</span>
              }
            </label>

            <button type="submit" class="btn lg block" [disabled]="busy()">
              @if (busy()) { <i class="spin"></i> Création… } @else { Créer le compte }
            </button>
          </form>

          <p class="alt">Déjà inscrit ? <a routerLink="/connexion">Se connecter</a></p>
        </div>
      </section>
    </div>
  `,
})
export class Register {
  private auth = inject(Auth);
  private router = inject(Router);

  protected roles = [
    { value: 'PATIENT' as Role, label: 'Patient', icon: 'heart' },
    { value: 'MEDECIN' as Role, label: 'Praticien', icon: 'stethoscope' },
    { value: 'ADMIN' as Role, label: 'Admin', icon: 'shield' },
  ];
  protected specialties = SPECIALTIES;

  protected role = signal<Role>('PATIENT');
  protected name = '';
  protected email = '';
  protected password = '';
  protected specialite = SPECIALTIES[0];
  protected busy = signal(false);
  protected touched = signal(false);
  protected error = signal('');

  protected submit() {
    this.touched.set(true);
    this.error.set('');
    if (!this.name || !this.email || this.password.length < 6 || this.busy()) return;

    this.busy.set(true);
    const body = {
      name: this.name,
      email: this.email,
      password: this.password,
      ...(this.role() === 'MEDECIN' ? { specialite: this.specialite } : {}),
    };

    this.auth.signup(this.role(), body).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigateByUrl(this.auth.home());
      },
      error: e => {
        this.busy.set(false);
        this.error.set(apiError(e));
      },
    });
  }
}
