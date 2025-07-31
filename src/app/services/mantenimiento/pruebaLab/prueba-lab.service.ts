import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  IGetLastPruebasLab,
  IPruebaLab,
  IPruebaLabPostDTO,
} from '../../../models/Mantenimiento/pruebaLab.models';
import { environment } from '../../../../environments/enviroment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PruebaLabService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/pruebaLab`;
  private readonly _auth = inject(AuthService);

  public registrarPruebaLab(body: IPruebaLab): Observable<IPruebaLabPostDTO> {
    console.log('Enviando valores desde servicio');

    return this._http.post<IPruebaLabPostDTO>(
      `${this.apiUrl}/newPruebaLab`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getLastPruebasLab(): Observable<IPruebaLab[]> {
    return this._http.get<IGetLastPruebasLab>(`${this.apiUrl}/last30`).pipe(
      map((data) => {
        return data.pruebasLab;
      }),
    );
  }

  getPruebaLab(terminoBusqueda: any): Observable<IPruebaLab[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastPruebasLab>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.pruebasLab));
  }

  public actualizarPruebaLab(
    codPruebaLab: string,
    body: IPruebaLab,
  ): Observable<IPruebaLabPostDTO> {
    console.log(body);
    return this._http.put<IPruebaLabPostDTO>(
      `${this.apiUrl}/${codPruebaLab}/updatePrueba`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
