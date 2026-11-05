import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Department } from '../models/department';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.baseUrl+"/api/departments";


  getDepartments(){
    return this.http.get<Department[]>(this.url);
  }
}
