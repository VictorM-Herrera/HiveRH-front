import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Position } from '../models/position';

@Injectable({
  providedIn: 'root',
})
export class PositionService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.baseUrl+"/api/positions"


  getPositions(){
    return this.http.get<Position[]>(this.url);
  }
}
