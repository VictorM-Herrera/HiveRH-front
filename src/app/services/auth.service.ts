import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf.service';
import { map, Observable, of, switchMap, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export interface loginDTO{
  identifier:string,
  password:string
}
export interface User{
  accessToken:string,
  email:string,
  name:string
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _csrf = inject(CsrfService);
  private readonly url = environment.baseUrl;
  private readonly http = inject(HttpClient);
  private readonly _accessToken = signal<string|null>(null);
  private readonly _user = signal<User|null>(null)

  readonly accessToken = this._accessToken.asReadonly();

  constructor(){
  
    const u = localStorage.getItem('user');
    if(u) { this._user.set(JSON.parse(u)) }

    effect(() => {
      const user = this._user();
      if(user)
        localStorage.setItem('user', JSON.stringify(user))
      else
        localStorage.removeItem('user');
    })
  }

  private readonly headers = {
      withCredentials:true,
      headers:{
        'X-XSRF-TOKEN': this._csrf.token()!
      }
  }


  login(data:loginDTO):Observable<boolean>{
    return this.http.post<{accessToken: string}>(this.url+"/api/auth/login", data, this.headers).pipe(
      tap(token => this._accessToken.set(token.accessToken || null)),
      map(data => !data.accessToken)
    );
  }
}
