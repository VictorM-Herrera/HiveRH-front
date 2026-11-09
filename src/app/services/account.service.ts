import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Account } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly _account = signal<Account | null>(null);

  readonly account = this._account.asReadonly();
  readonly email = computed(() => this._account()?.email ?? '');

  loadAccount(): Observable<Account> {
    return this.http
      .get<Account>(`${this.baseUrl}/api/accounts/me`)
      .pipe(tap((account) => this._account.set(account)));
  }

  getAccountByDni(dni: string): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/api/accounts/${encodeURIComponent(dni)}`);
  }

  updateRole(dni: string, rol: Account['rol']): Observable<Account> {
    return this.http.patch<Account>(`${this.baseUrl}/api/accounts/${encodeURIComponent(dni)}/rol`, {
      rol,
    });
  }

  updateEmail(email: string): Observable<Account> {
    return this.http
      .patch<Account>(`${this.baseUrl}/api/accounts/me/email`, { email })
      .pipe(tap((account) => this._account.set(account)));
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<Account> {
    return this.http
      .patch<Account>(`${this.baseUrl}/api/accounts/me/password`, { currentPassword, newPassword })
      .pipe(tap((account) => this._account.set(account)));
  }

  clearAccount(): void {
    this._account.set(null);
  }
}
