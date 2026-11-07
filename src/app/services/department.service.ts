import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Department } from '../models/department.model';
import { DepartmentFilter } from '../models/department-filter';
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
    return this.http.post<Department>(this.url, {'name': name});
  }
  patchDeparment(id:number, status:boolean){
    return this.http.patch<Department>(`${this.url}/${id}/status`, {'active': status})
  }
  putDepartment(id:number, name:string){
    return this.http.put<Department>(`${this.url}/${id}`, {'name': name})
  }


  buildParams(filters: DepartmentFilter = {}) {
    let params = new HttpParams()
      .set('page', filters.page ?? 0)
      .set('size', filters.size ?? 0);

    if (filters.active !== undefined) params = params.set('active', filters.active);
    if (filters.id_department !== undefined) {
      params = params.set('id_department', filters.id_department);
    }
    if (filters.name) params = params.set('name', filters.name);

    return params;
  }
}
