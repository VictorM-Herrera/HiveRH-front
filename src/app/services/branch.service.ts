import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Branch, BranchRequest, BranchUpdate } from '../models/branch.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.baseUrl}/api/branches`;

  getBranches() {
    return this.http.get<Branch[]>(this.url);
  }

  postBranch(branch: BranchRequest) {
    return this.http.post<Branch>(this.url, branch);
  }

  updateBranch(id: number, branch: BranchUpdate) {
    return this.http.put<Branch>(`${this.url}/${id}`, branch);
  }

  deleteBranch(id: number) {
    return this.http.delete<Branch>(`${this.url}/${id}`);
  }

  getBranchByID(id: number) {
    return this.http.get<Branch>(`${this.url}/${id}`);
  }
}
