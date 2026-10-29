import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf.service';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthResponse, AuthSession, loginDTO } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _csrf = inject(CsrfService);
  private readonly url = environment.baseUrl;
  private readonly http = inject(HttpClient);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _session = signal<AuthSession | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly session = this._session.asReadonly();

  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly roles = computed(() => this._session()?.roles ?? []);

  login(data: loginDTO): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.url}/api/auth/login`, data, this.getAuthOptions())
      .pipe(tap((response) => this.setSession(response)));
  }

  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.url}/api/auth/refresh`, {}, this.getAuthOptions())
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.url}/api/auth/logout`, {}, this.getAuthOptions())
      .pipe(finalize(() => this.clearSession()));
  }

  private setSession(response: AuthResponse): void {
    this._accessToken.set(response.accessToken);
    this._session.set({
      identifier: response.identifier,
      roles: response.roles,
      mustChangePassword: response.mustChangePassword,
    });
  }
  initializeSession(): Observable<void> {
    return this._csrf.loadToken().pipe(
      switchMap(() => this.refresh()),
      map(() => void 0),

      catchError(() => {
        this.clearSession();
        return of(void 0);
      }),
    );
  }

  private clearSession(): void {
    this._accessToken.set(null);
    this._session.set(null);
  }

  private getAuthOptions() {
    const csrfToken = this._csrf.token();
    if (!csrfToken) throw new Error('CSRF Token no inicializado');

    return {
      withCredentials: true,
      headers: {
        'X-XSRF-TOKEN': csrfToken,
      },
    };
  }
}
