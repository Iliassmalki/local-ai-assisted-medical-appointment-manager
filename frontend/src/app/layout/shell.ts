import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Auth } from '../core/auth';
import { Api } from '../core/api';
import { NOTIFICATIONS } from '../core/mock/inbox';
import { Icon } from '../ui/icon';
import { UiAvatar, UiToasts } from '../ui/ui';
import { Assistant } from './assistant';
import { MOBILE, NAV, ROLE_LABEL, type NavItem } from './nav';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.css',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, UiAvatar, UiToasts, Assistant],
})
export class Shell {
  private auth = inject(Auth);
  private api = inject(Api);
  private router = inject(Router);

  protected mobileOpen = signal(false);
  protected chatOpen = signal(false);

  protected user = this.auth.user;
  protected home = this.auth.home;
  protected roleLabel = computed(() => {
    const r = this.user()?.role;
    return r ? ROLE_LABEL[r] : '';
  });

  protected nav = computed<NavItem[]>(() => {
    const r = this.user()?.role;
    return r ? NAV[r] : [];
  });

  protected mobileNav = computed<NavItem[]>(() => {
    const r = this.user()?.role;
    if (!r) return [];
    const wanted = MOBILE[r];
    return NAV[r].filter(i => wanted.includes(i.path));
  });

  protected notifPath = computed(() =>
    this.user()?.role === 'PATIENT' ? '/app/notifications' : this.home());

  /** Unread badge — sourced from demonstration data on the patient side only. */
  protected unread = computed(() =>
    this.user()?.role === 'PATIENT' ? NOTIFICATIONS.filter(n => !n.read).length : 0);

  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Breadcrumb label for the current route, resolved from the nav table. */
  protected current = computed(() => {
    const url = this.url().split('?')[0];
    const items = this.nav();
    const match = items
      .filter(i => url === i.path || url.startsWith(i.path + '/'))
      .sort((a, b) => b.path.length - a.path.length)[0];
    return match?.label ?? 'Medora';
  });

  constructor() {
    // The login response carries no display name; the patient dashboard does.
    // Fetch it once here so the sidebar reads the same on every page.
    if (this.user()?.role === 'PATIENT') {
      this.api.patientDashboard().subscribe({ next: () => {}, error: () => {} });
    }
  }

  protected logout() { this.auth.logout(); }
}
