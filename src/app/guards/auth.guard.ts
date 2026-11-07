import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree(['/']);
};

export const staffGuard: CanActivateFn = () => {
  const roles = inject(AuthService).roles();
  return (
    roles.some((role) => role === 'ROLE_STAFF' || role === 'ROLE_ADMIN') ||
    inject(Router).createUrlTree(['/home'])
  );
};

export const adminGuard: CanActivateFn = () =>
  inject(AuthService).roles().includes('ROLE_ADMIN') || inject(Router).createUrlTree(['/home']);
