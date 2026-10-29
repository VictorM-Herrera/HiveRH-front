import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { map, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private readonly _http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly _token = signal<string | null>(null)
  readonly token = this._token.asReadonly();

  loadToken():Observable<string>{
    return this._http.get<{token:string}>(`${this.baseUrl}/api/auth/csrf`,{
      withCredentials:true
    }).pipe(
      map(response => response.token),tap(token => {
        this._token.set(token)}));
  }
}
