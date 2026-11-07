import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Position, PositionFilters } from '../models/position.model';

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.baseUrl}/api/positions`;

  getPositions(filters: PositionFilters = {}) {
    let params = new HttpParams();
    if (filters.name) {
      params = params.set('name', filters.name);
    }
    if (filters.active !== undefined) {
      params = params.set('active', filters.active);
    }
    return this.http.get<Position[]>(this.url, { params });
  }

  postPosition(name: string) {
    return this.http.post<Position>(this.url, { name });
  }

  updatePosition(id: number, name: string) {
    return this.http.put<Position>(`${this.url}/${id}`, { name });
  }

  patchPosition(id: number, active: boolean) {
    return this.http.patch<Position>(`${this.url}/${id}/status`, { active });
  }
}
