import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.accessToken();
  const identifier = auth.session()?.identifier;

  const apiCheck = req.url.startsWith(`${environment.baseUrl}/api/`);
  const authEndpointCheck = req.url.startsWith(`${environment.baseUrl}/api/auth/`);

  if (!accessToken || !apiCheck || authEndpointCheck) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${accessToken}` },
  });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      const currentToken = auth.accessToken();
      if (!currentToken || auth.session()?.identifier !== identifier) {
        return throwError(() => error);
      }

      const retry = (token: string) =>
        next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })).pipe(
          catchError((retryError: unknown) => {
            if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
              auth.clearSession();
            }
            return throwError(() => retryError);
          }),
        );

      return currentToken !== accessToken
        ? retry(currentToken)
        : auth.refresh().pipe(switchMap((response) => retry(response.accessToken)));
    }),
  );
};
