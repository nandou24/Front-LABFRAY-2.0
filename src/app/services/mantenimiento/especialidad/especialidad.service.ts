import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import {
  IEspecialidad,
  IEspecialidadPostResponseDTO,
  IGetLastEspecialidades,
} from '../../../models/Mantenimiento/especialidad.models';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class EspecialidadService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/especialidad`;
  private readonly _auth = inject(AuthService);

  public registrarEspecialidad(body: IEspecialidad) {
    console.log('Enviando valores desde registro especialidad');

    return this._http.post<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/newEspecialidad`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  actualizarEspecialidad(
    codEspecialidad: string,
    Especialidad: IEspecialidad,
  ): Observable<any> {
    return this._http.put<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/${codEspecialidad}`,
      Especialidad,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  eliminarEspecialidad(codEspecialidad: string): Observable<any> {
    return this._http.delete<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/${codEspecialidad}`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getAllEspecialidad(): Observable<IEspecialidad[]> {
    console.log('Obteniendo todas las especialidades en service');
    return this._http.get<IGetLastEspecialidades>(`${this.apiUrl}/latest`).pipe(
      map((data) => {
        return data.especialidades;
      }),
    );
  }

  getEspecialidadPorBusqueda(
    terminoBusqueda: any,
  ): Observable<IEspecialidad[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastEspecialidades>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.especialidades));
  }

  getEspecialidadesPorProfesion(
    idProfesion: string,
  ): Observable<IEspecialidad[]> {
    return this._http
      .get<IGetLastEspecialidades>(`${this.apiUrl}/profesion/${idProfesion}`)
      .pipe(map((resp) => resp.especialidades));
  }
}
