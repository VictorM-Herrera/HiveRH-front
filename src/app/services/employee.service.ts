import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { EmployeeFilter } from '../models/employee/employee-filter.model';
import { Employee } from '../models/employee/employee.model';
import { EmployeeUpdate } from '../models/employee/employee-update.model';
import { PageResponse } from '../models/page-response.models';
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

  getEmployees(filters: EmployeeFilter = {}): Observable<PageResponse<Employee>> {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    for (const [name, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        params = params.set(name, value);
      }
    }
    return this.http.get<PageResponse<Employee>>(`${this.baseUrl}/api/employees`, { params });
  }

  getEmployee(dni: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/api/employees/${dni}`);
  }

  updateEmployee(dni: string, data: EmployeeUpdate): Observable<Employee> {
    return this.http.patch<Employee>(`${this.baseUrl}/api/employees/${dni}`, data).pipe(
      tap((employee) => {
        if (this._currentEmployee()?.dni === dni) this._currentEmployee.set(employee);
      }),
    );
  }

  updateProfilePicture(dni: string, file: File): Observable<string | null> {
    const data = new FormData();
    data.append('dni', dni);
    data.append('file', file);
    return this.http
      .patch(`${this.baseUrl}/api/employees/picture`, data)
      .pipe(switchMap(() => this.loadProfilePicture(dni)));
  }

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
  getProfilePicture(dni: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/employees/picture/${dni}`, {
      responseType: 'blob',
    });
  }
  loadProfilePicture(dni: string): Observable<string | null> {
    return this.getProfilePicture(dni).pipe(
      map((blob) => (blob.size ? URL.createObjectURL(blob) : null)),
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
