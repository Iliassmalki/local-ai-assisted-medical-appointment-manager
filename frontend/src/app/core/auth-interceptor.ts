import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Auth } from './auth';
import { API } from './api-url';

function withToken(req: HttpRequest<unknown>, token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/** Auth endpoints are public and must never carry (or try to refresh) a token. */
function isPublic(url: string) {
  return url.includes('/api/auth/');
}

/**
 * Attaches the access token to every backend call, and transparently recovers from
 * an expired one: on a 401 it exchanges the refresh token for a new pair, replays
 * the original request once, and only signs the user out if that also fails.
 */
export const authInterceptor: HttpInterceptorFn = (req, next: HttpHandlerFn) => {
  const auth = inject(Auth);
  const token = auth.token();
  const targetsApi = req.url.startsWith(API);

  const authed = token && targetsApi && !isPublic(req.url) ? withToken(req, token) : req;

  return next(authed).pipe(
    catchError((e: HttpErrorResponse) => {
      const recoverable = e.status === 401
        && targetsApi
        && !isPublic(req.url)
        && !!auth.refreshToken();

      if (!recoverable) {
        if (e.status === 401 && auth.isAuthed()) auth.logout();
        return throwError(() => e);
      }

      return auth.refresh().pipe(
        switchMap(res => next(withToken(req, res.token))),
        catchError(refreshError => {
          // The refresh token is gone or expired too — this session is over.
          auth.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

/** Turns the backend's assorted error shapes into one readable sentence. */
export function apiError(e: unknown): string {
  const err = e as HttpErrorResponse;
  const body = err?.error;

  if (typeof body === 'string' && body.trim()) return body.trim();
  if (body && typeof body === 'object') {
    // Validation failures return { field: message }; GlobalExceptionHandler
    // returns Map.of("<description>", "<message>"). Both yield a usable string.
    const values = Object.values(body as Record<string, unknown>)
      .filter((v): v is string => typeof v === 'string' && v.length > 0);
    if (values.length) return values.join(' ');
  }
  if (err?.status === 0) return "Le serveur est injoignable. L'API Spring Boot est-elle démarrée sur le port 8787 ?";
  if (err?.status === 403) return 'Accès refusé : votre rôle ne permet pas cette action.';
  if (err?.status === 401) return 'Session expirée, veuillez vous reconnecter.';
  return err?.message ?? 'Une erreur inattendue est survenue.';
}
