import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf.service';
import {
  catchError,
  defer,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
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
  private readonly sessionEnded = new Subject<void>();
  private refreshRequest$: Observable<AuthResponse> | null = null;

  readonly accessToken = this._accessToken.asReadonly();
  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this.accessToken() !== null);
  readonly roles = computed(() => this._session()?.roles ?? []);

  login(data: loginDTO): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.url}/api/auth/login`, data, this.getAuthOptions())
      .pipe(
        tap((response) => {
          this.sessionEnded.next();
          this.setSession(response);
        }),
      );
  }

  refresh(): Observable<AuthResponse> {
    if (!this.refreshRequest$) {
      this.refreshRequest$ = defer(() =>
        this.http.post<AuthResponse>(`${this.url}/api/auth/refresh`, {}, this.getAuthOptions()),
      ).pipe(
        takeUntil(this.sessionEnded),
        tap((response) => this.setSession(response)),
        catchError((error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 401 || error.status === 403)
          ) {
            this.clearSession();
          }

          return throwError(() => error);
        }),
        finalize(() => (this.refreshRequest$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshRequest$;
  }

  logout(): Observable<void> {
    return defer(() => {
      this.sessionEnded.next();
      return this.http.post<void>(`${this.url}/api/auth/logout`, {}, this.getAuthOptions());
    }).pipe(finalize(() => this.clearSession()));
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

  clearSession(): void {
    this.sessionEnded.next();
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
