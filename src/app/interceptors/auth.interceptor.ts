import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const accessToken = auth.accessToken();

  const apiCheck = req.url.startsWith(environment.baseUrl);
  const authEndpointCheck = req.url.includes('/api/auth/');

  if (!accessToken || !apiCheck || authEndpointCheck) {
    return next(req)
  }

  const authenticatedRequest = req.clone({
    setHeaders:{
      Authorization: `Bearer ${accessToken}`
    }
  })

  return next(authenticatedRequest);
};
