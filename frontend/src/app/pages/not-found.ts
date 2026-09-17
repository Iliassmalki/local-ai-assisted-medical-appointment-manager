import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../core/auth';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="card raised" style="max-width:420px;text-align:center">
        <div class="card-body" style="padding:44px 30px">
          <div class="code num">404</div>
          <h1 class="mt-2" style="font-size:1.2rem">Page introuvable</h1>
          <p class="muted mt-1" style="font-size:.9rem">Le lien demandé n’existe pas ou n’est plus accessible.</p>
          <a class="btn mt-3" [routerLink]="home()">Revenir à l’accueil</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .code { font-size: 3.4rem; font-weight: 700; color: var(--primary); letter-spacing: -.04em; line-height: 1; }
  `],
})
export class NotFound {
  private auth = inject(Auth);
  protected home = this.auth.home;
}
