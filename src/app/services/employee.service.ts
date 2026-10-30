import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { Employee } from '../models/employee/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;
  private readonly _currentEmployee = signal<Employee | null>(null);
  private readonly _profilePicture = signal<string | null>(null);

  readonly currentEmployee = this._currentEmployee.asReadonly();
  readonly profilePicture = this._profilePicture.asReadonly();

  loadCurrentEmployee(): Observable<Employee | null> {
    return this.getMe().pipe(
      tap((employee) => {
        this._currentEmployee.set(employee);
      }),
      catchError((err) => {
        if (err.status === 404) {
          this._currentEmployee.set(null);
          return of(null);
        }
        return throwError(() => err);
      }),
    );
  }

  clearCurrentEmployee(): void {
    this._currentEmployee.set(null);
    this.clearProfilePicture();
  }

  private getMe(): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/api/employees/me`);
  }
  private getProfilePicture(dni: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/employees/pictures/${dni}`, {
      responseType: 'blob',
    });
  }
  loadProfilePicture(dni: string): Observable<string | null> {
    return this.getProfilePicture(dni).pipe(
      map((blob) => URL.createObjectURL(blob)),
      tap((url) => {
        this.clearProfilePicture();
        this._profilePicture.set(url);
      }),
      catchError((err) => {
        this.clearProfilePicture();
        if (err.status === 404) return of(null);
        return throwError(() => err);
      }),
    );
  }
  private clearProfilePicture(): void {
    const url = this._profilePicture();

    if (url) {
      URL.revokeObjectURL(url);
    }

    this._profilePicture.set(null);
  }
}
