import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Department } from '../models/department';
import { DepartmentFilter } from '../models/department-filter';
import { PageResponse } from '../models/page-response.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.baseUrl + "/api/departments";


  getDepartments(filters: DepartmentFilter = {}): Observable<Department[]> {
    return this.http.get<Department[]>(this.url, {
      params: this.buildParams(filters)
    });
  }
  postDepartment(name: string) {
    return this.http.post<Department>(this.url, {name});
  }


  buildParams(filters: DepartmentFilter = {}) {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 0);

    if (filters.active) params.set('active', filters.active)
    if (filters.id_department) params.set('id_department', filters.id_department)
    if (filters.name) params.set('name', filters.name)

    return params;
  }
}
