import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError } from 'rxjs';
import { API } from './api-url';
import type { AuthResponse, LoginRequest, RegisterRequest, Role, SessionUser } from './models';

const TOKEN_KEY = 'medora.token';
const REFRESH_KEY = 'medora.refresh';

interface JwtPayload { sub?: string; role?: string[]; exp?: number; }

/** Decodes the JWT payload the backend signs in JwtService (no verification — display only). */
function decode(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * The login endpoint returns only a token, so when no name has been stored we
 * derive a readable one from the JWT subject: "karim.idrissi" -> "Karim Idrissi".
 */
function nameFromEmail(email: string): string {
  return email.split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _token = signal<string | null>(read(TOKEN_KEY));
  private readonly _refresh = signal<string | null>(read(REFRESH_KEY));
  /** Display name, kept client-side: the backend never returns it on login. */
  private readonly _name = signal<string>(localStorage.getItem('medora.name') ?? '');

  readonly token = this._token.asReadonly();
  readonly refreshToken = this._refresh.asReadonly();

  readonly user = computed<SessionUser | null>(() => {
    const t = this._token();
    if (!t) return null;
    const p = decode(t);
    if (!p?.sub) return null;
    const authority = p.role?.[0] ?? 'ROLE_PATIENT';
    const role = authority.replace('ROLE_', '') as Role;
    return { email: p.sub, role, name: this._name() || nameFromEmail(p.sub) };
  });

  readonly isAuthed = computed(() => this.user() !== null);
  readonly role = computed<Role | null>(() => this.user()?.role ?? null);

  /** Home route for the signed-in role — each role has its own console. */
  readonly home = computed(() => {
    switch (this.role()) {
      case 'ADMIN': return '/admin';
      case 'MEDECIN': return '/praticien';
      case 'PATIENT': return '/app';
      default: return '/connexion';
    }
  });

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API}/api/auth/login`, body)
      .pipe(tap(r => this.store(r, '')));
  }

  /**
   * Exchanges the refresh token for a new access token. The interceptor calls this
   * once when a request comes back 401, then replays the original request.
   */
  refresh(): Observable<AuthResponse> {
    const refreshToken = this._refresh();
    if (!refreshToken) return throwError(() => new Error('no refresh token'));

    return this.http.post<AuthResponse>(`${API}/api/auth/refresh`, { refreshToken })
      .pipe(tap(r => this.store(r, '')));
  }

  signup(role: Role, body: RegisterRequest): Observable<AuthResponse> {
    const path = role === 'ADMIN' ? 'admin' : role === 'MEDECIN' ? 'medecin' : 'patient';
    return this.http.post<AuthResponse>(`${API}/api/auth/signup/${path}`, body)
      .pipe(tap(r => this.store(r, body.name)));
  }

  /** Backend health ping (democon) — used by the login screen to warn when the API is down. */
  ping(): Observable<string> {
    return this.http.get(`${API}/api/auth/democon`, { responseType: 'text' });
  }

  private store(res: AuthResponse, name: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
      if (res.refreshToken) localStorage.setItem(REFRESH_KEY, res.refreshToken);
      if (name) localStorage.setItem('medora.name', name);
    } catch { /* private mode — session stays in memory */ }
    this._token.set(res.token);
    if (res.refreshToken) this._refresh.set(res.refreshToken);
    if (name) this._name.set(name);
  }

  setName(name: string): void {
    this._name.set(name);
    try { localStorage.setItem('medora.name', name); } catch { /* ignore */ }
  }

  logout(redirect = true): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('medora.name');
    } catch { /* ignore */ }
    this._token.set(null);
    this._refresh.set(null);
    this._name.set('');
    if (redirect) void this.router.navigateByUrl('/connexion');
  }
}
