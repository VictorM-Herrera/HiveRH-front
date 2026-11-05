import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Branch } from '../models/branch';
import { environment } from '../../environments/environment';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient)
  private readonly url = environment.baseUrl+"/api/branches";

  


  getBranches(){
    return this.http.get<Branch[]>(this.url);
  }
}
