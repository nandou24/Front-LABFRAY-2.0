import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IGetLastProfesiones,
  IProfesion,
  IProfesionPostResponseDTO,
} from '../../../models/Mantenimiento/profesion.models';
import { environment } from '../../../../environments/enviroment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfesionService {
  constructor(private _http: HttpClient) {}

  private readonly apiUrl = `${environment.baseUrl}/api/profesion`;

  public registrarProfesion(body: IProfesion) {
    return this._http.post<IProfesionPostResponseDTO>(
      `${this.apiUrl}/newProfesion`,
      body,
    );
  }

  actualizarProfesion(
    codProfesion: string,
    Profesion: IProfesion,
  ): Observable<any> {
    return this._http.put<IProfesionPostResponseDTO>(
      `${this.apiUrl}/${codProfesion}`,
      Profesion,
    );
  }

  eliminarProfesion(codProfesion: string): Observable<any> {
    return this._http.delete<IProfesionPostResponseDTO>(
      `${this.apiUrl}/${codProfesion}`,
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
