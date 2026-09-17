import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import type { Role } from './models';

/** Blocks a route unless the JWT carries one of the allowed authorities. */
export function roleGuard(...allowed: Role[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);

    const user = auth.user();
    if (!user) return router.createUrlTree(['/connexion']);
    if (allowed.length && !allowed.includes(user.role)) return router.createUrlTree([auth.home()]);
    return true;
  };
}

/** Keeps signed-in users away from the login/register screens. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  return auth.isAuthed() ? router.parseUrl(auth.home()) : true;
};
