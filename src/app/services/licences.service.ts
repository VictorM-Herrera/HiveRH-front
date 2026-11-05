import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CertificateInfo,
  License,
  LicenseFilters,
  LicenseRequest,
  LicenseReviewRequest,
  MyLicenseFilters,
} from '../models/license.models';
import { PageResponse } from '../models/page-response.models';

@Injectable({
  providedIn: 'root',
})
export class LicencesService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.baseUrl}/api`;
  private readonly _licensesPage = signal<PageResponse<License> | null>(null);

  readonly licensesPage = this._licensesPage.asReadonly();
  readonly licenses = computed(() => this._licensesPage()?.element ?? []);

  getLicenses(filters: LicenseFilters = {}): Observable<PageResponse<License>> {
    let params = this.buildParams(filters);
    if (filters.dniEmployee) {
      params = params.set('dniEmployee', filters.dniEmployee);
    }
    return this.http.get<PageResponse<License>>(`${this.api}/licenses`, { params });
  }

  getMyLicenses(filters: MyLicenseFilters = {}): Observable<PageResponse<License>> {
    return this.http
      .get<PageResponse<License>>(`${this.api}/licenses/me`, {
        params: this.buildParams(filters),
      })
      .pipe(tap((response) => this._licensesPage.set(response)));
  }

  getLicense(id: number): Observable<License> {
    return this.http.get<License>(`${this.api}/licenses/${id}`);
  }

  reviewLicense(id: number, request: LicenseReviewRequest): Observable<License> {
    return this.http.patch<License>(`${this.api}/licenses/${id}`, request);
  }

  createLicense(request: LicenseRequest): Observable<License> {
    return this.http.post<License>(`${this.api}/licenses`, request);
  }

  uploadCertificate(idLicense: number, file: File): Observable<number> {
    const data = new FormData();
    data.append('idLicense', String(idLicense));
    data.append('description', file.name.slice(0, 255));
    data.append('file', file, file.name.replace(/\.pdf$/i, '.pdf'));

    return this.http
      .post<{ idCertificate: number }>(`${this.api}/certificates`, data)
      .pipe(map(({ idCertificate }) => idCertificate));
  }

  downloadCertificate(id: number): Observable<Blob> {
    return this.http.get(`${this.api}/certificate/${id}`, { responseType: 'blob' });
  }

  getCertificateInfo(id: number): Observable<CertificateInfo> {
    return this.http.get<CertificateInfo>(`${this.api}/certificate-info`, { params: { id } });
  }

  clearLicenses(): void {
    this._licensesPage.set(null);
  }

  private buildParams(filters: MyLicenseFilters): HttpParams {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 20)
      .set('sort', filters.sort ?? 'requestDate,desc');
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.isPaid !== undefined) {
      params = params.set('isPaid', filters.isPaid);
    }
    return params;
  }
}
