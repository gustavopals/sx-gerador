import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  shareReplay,
  switchMap,
  tap,
  throwError,
  type Observable,
} from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../stores/auth.store';
import { AuthService, type TokenPair } from '../services/auth.service';

let refreshRequest$: Observable<TokenPair> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!isApiRequest(req) || isAuthRequest(req)) {
    return next(req);
  }

  const authorizedReq = withAccessToken(req, authService.getAccessToken());

  return next(authorizedReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401) {
        return throwError(() => err);
      }

      refreshRequest$ ??= authService.refreshSession().pipe(
        tap(() => authStore.initialize()),
        shareReplay({ bufferSize: 1, refCount: false }),
        finalize(() => {
          refreshRequest$ = null;
        }),
      );

      return refreshRequest$.pipe(
        switchMap(() => next(withAccessToken(req, authService.getAccessToken()))),
        catchError((refreshErr: unknown) => {
          authStore.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};

function isApiRequest(req: HttpRequest<unknown>): boolean {
  return req.url.startsWith(environment.apiUrl);
}

function isAuthRequest(req: HttpRequest<unknown>): boolean {
  return req.url.startsWith(`${environment.apiUrl}/auth/`);
}

function withAccessToken(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  if (!token) return req;
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}
