import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  MyVacationFilters,
  Vacation,
  VacationFilters,
  VacationRequest,
} from '../models/vacation.models';
import { Observable, tap } from 'rxjs';
import { PageResponse } from '../models/page-response.models';
import { environment } from '../../environments/environment';
import { CsrfService } from './csrf.service';

@Injectable({
  providedIn: 'root',
})
export class VacationService {
  private readonly http = inject(HttpClient);
  private readonly csrf = inject(CsrfService);
  private readonly baseUrl = environment.baseUrl;
  private readonly _vacationsPage = signal<PageResponse<Vacation> | null>(null);

  readonly vacationsPage = this._vacationsPage.asReadonly();
  readonly vacations = computed(() => this._vacationsPage()?.element ?? []);

  getVacations(filters: VacationFilters = {}): Observable<PageResponse<Vacation>> {
    return this.http
      .get<PageResponse<Vacation>>(`${this.baseUrl}/api/vacations`, {
        params: this.buildParams(filters),
      })
      .pipe(tap((response) => this._vacationsPage.set(response)));
  }

  getMyVacations(filters: MyVacationFilters = {}): Observable<PageResponse<Vacation>> {
    return this.http
      .get<PageResponse<Vacation>>(`${this.baseUrl}/api/vacations/me`, {
        params: this.buildParams(filters),
      })
      .pipe(tap((response) => this._vacationsPage.set(response)));
  }

  createVacation(request: VacationRequest): Observable<Vacation> {
    return this.http.post<Vacation>(
      `${this.baseUrl}/api/vacations`,
      request,
      this.getWriteOptions(),
    );
  }

  updateVacation(idVacation: number, request: VacationRequest): Observable<Vacation> {
    return this.http.put<Vacation>(
      `${this.baseUrl}/api/vacations/${idVacation}`,
      request,
      this.getWriteOptions(),
    );
  }

  clearVacations(): void {
    this._vacationsPage.set(null);
  }

  private getWriteOptions() {
    const token = this.csrf.token();
    if (!token) {
      throw new Error('No pudimos preparar la sesión. Recargá la página e intentá nuevamente.');
    }
    return {
      withCredentials: true,
      headers: { 'X-XSRF-TOKEN': token },
    };
  }

  private buildParams(filters: VacationFilters | MyVacationFilters): HttpParams {
    let params = new HttpParams().set('page', filters.page ?? 0).set('size', filters.size ?? 20);
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    if ('dniEmployee' in filters && filters.dniEmployee) {
      params = params.set('dniEmployee', filters.dniEmployee);
    }

    if ('fullName' in filters && filters.fullName) {
      params = params.set('fullName', filters.fullName);
    }

    return params;
  }
}
