import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { Employee } from '../models/employee/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly _currentEmployee = signal<Employee|null>(null);

  readonly currentEmployee = this._currentEmployee.asReadonly();

  loadCurrentEmployee():Observable<Employee|null>{
    return this.getMe().pipe(
      tap(employee=>{
        this._currentEmployee.set(employee);
      }),catchError(err => {
        if (err.status=== 404) {
          this._currentEmployee.set(null);
          return of(null);
        }
        return throwError(()=> err);
      })
    )
  }

  clearCurrentEmployee():void{
    this._currentEmployee.set(null);
  }

  private getMe(): Observable<Employee>{
    return this.http.get<Employee>(`${this.baseUrl}/api/employees/me`)
  }


}
