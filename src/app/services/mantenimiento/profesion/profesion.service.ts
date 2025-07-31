import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  IGetLastProfesiones,
  IProfesion,
  IProfesionPostResponseDTO,
} from '../../../models/Mantenimiento/profesion.models';
import { environment } from '../../../../environments/enviroment';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ProfesionService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/profesion`;
  private readonly _auth = inject(AuthService);

  public registrarProfesion(body: IProfesion) {
    console.log('Enviando valores desde registro profesion');

    return this._http.post<IProfesionPostResponseDTO>(
      `${this.apiUrl}/newProfesion`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  actualizarProfesion(
    codProfesion: string,
    Profesion: IProfesion,
  ): Observable<any> {
    return this._http.put<IProfesionPostResponseDTO>(
      `${this.apiUrl}/${codProfesion}`,
      Profesion,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  eliminarProfesion(codProfesion: string): Observable<any> {
    return this._http.delete<IProfesionPostResponseDTO>(
      `${this.apiUrl}/${codProfesion}`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getAllProfesions(): Observable<IProfesion[]> {
    return this._http.get<IGetLastProfesiones>(`${this.apiUrl}/latest`).pipe(
      map((data) => {
        return data.profesiones;
      }),
    );
  }

  getProfesionPorBusqueda(terminoBusqueda: any): Observable<IProfesion[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastProfesiones>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.profesiones));
  }
}
