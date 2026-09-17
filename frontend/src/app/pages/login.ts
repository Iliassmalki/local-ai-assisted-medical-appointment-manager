import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { apiError } from '../core/auth-interceptor';
import { Icon } from '../ui/icon';
import type { Role } from '../core/models';

@Component({
  selector: 'app-login',
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
          <h2>Vos consultations, votre dossier, au même endroit.</h2>
          <p>Prenez rendez-vous avec votre praticien, suivez vos ordonnances et retrouvez vos documents médicaux.</p>
          <ul>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Demande de rendez-vous validée par le praticien</li>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Dossier médical, ordonnances et analyses</li>
            <li><span class="tick"><ui-icon name="check" [size]="11" [width]="3" /></span> Messagerie avec votre équipe soignante</li>
          </ul>
        </div>
        <div class="foot">Accès protégé par jeton JWT et contrôle d’accès par rôle.</div>
      </section>

      <section class="form-side">
        <div class="box">
          <h1>Connexion</h1>
          <p class="lead">Choisissez votre espace, puis identifiez-vous.</p>

          @if (error()) {
            <div class="alert a-err mb-2" role="alert">
              <ui-icon name="alert" [size]="16" />
              <span>{{ error() }}</span>
            </div>
          }

          <form (ngSubmit)="submit()" novalidate>
            <div class="roles" role="radiogroup" aria-label="Type de compte">
              @for (r of roles; track r.value) {
                <button type="button" class="role" [class.on]="role() === r.value"
                        role="radio" [attr.aria-checked]="role() === r.value"
                        (click)="role.set(r.value)">
                  <span class="ic"><ui-icon [name]="r.icon" [size]="18" /></span>
                  <span class="t">{{ r.label }}</span>
                </button>
              }
            </div>

            <label class="field">
              <span class="lbl">Adresse e-mail</span>
              <input type="email" name="email" [(ngModel)]="email" required autocomplete="username"
                     placeholder="vous@exemple.com" [class.invalid]="touched() && !email" />
            </label>

            <label class="field">
              <span class="lbl">Mot de passe</span>
              <input type="password" name="password" [(ngModel)]="password" required
                     autocomplete="current-password" placeholder="••••••••"
                     [class.invalid]="touched() && !password" />
            </label>

            <button type="submit" class="btn lg block" [disabled]="busy()">
              @if (busy()) { <i class="spin"></i> Connexion… } @else { Se connecter }
            </button>
          </form>

          <p class="alt">Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a></p>
        </div>
      </section>
    </div>
  `,
})
export class Login {
  private auth = inject(Auth);
  private router = inject(Router);

  protected roles = [
    { value: 'PATIENT' as Role, label: 'Patient', icon: 'heart' },
    { value: 'MEDECIN' as Role, label: 'Praticien', icon: 'stethoscope' },
    { value: 'ADMIN' as Role, label: 'Admin', icon: 'shield' },
  ];

  protected role = signal<Role>('PATIENT');
  protected email = '';
  protected password = '';
  protected busy = signal(false);
  protected touched = signal(false);
  protected error = signal('');

  protected submit() {
    this.touched.set(true);
    this.error.set('');
    if (!this.email || !this.password || this.busy()) return;

    this.busy.set(true);
    this.auth.login({ email: this.email, password: this.password, role: this.role() }).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigateByUrl(this.auth.home());
      },
      error: e => {
        this.busy.set(false);
        this.error.set(e?.status === 403 || e?.status === 401
          ? 'Identifiants invalides pour ce type de compte.'
          : apiError(e));
      },
    });
  }
}
