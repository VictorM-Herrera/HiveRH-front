import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) return router.createUrlTree(['/']);
  if (auth.session()?.mustChangePassword && route.routeConfig?.path !== 'change-password') {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isAuthenticated()) return true;
  return inject(Router).createUrlTree([
    auth.session()?.mustChangePassword ? '/change-password' : '/home',
  ]);
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
