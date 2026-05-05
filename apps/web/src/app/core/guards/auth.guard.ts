import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStore } from '../../stores/auth.store';

export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  authStore.initialize();

  if (authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  authStore.initialize();

  if (!authStore.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};

export const verifiedGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  authStore.initialize();

  if (authStore.isVerified()) {
    return true;
  }

  return router.createUrlTree(['/signup/verify-email-sent']);
};
