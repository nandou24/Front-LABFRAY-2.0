import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import {
  IEspecialidad,
  IEspecialidadPostResponseDTO,
  IGetLastEspecialidades,
} from '../../../models/Mantenimiento/especialidad.models';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EspecialidadService {
  constructor(private _http: HttpClient) {}

  private readonly apiUrl = `${environment.baseUrl}/api/especialidad`;

  public registrarEspecialidad(body: IEspecialidad) {
    console.log('Enviando valores desde registro especialidad');

    return this._http.post<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/newEspecialidad`,
      body,
    );
  }

  actualizarEspecialidad(
    codEspecialidad: string,
    Especialidad: IEspecialidad,
  ): Observable<any> {
    return this._http.put<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/${codEspecialidad}`,
      Especialidad,
    );
  }

  eliminarEspecialidad(codEspecialidad: string): Observable<any> {
    return this._http.delete<IEspecialidadPostResponseDTO>(
      `${this.apiUrl}/${codEspecialidad}`,
    );
  }

  getAllEspecialidades(): Observable<IEspecialidad[]> {
    console.log('Obteniendo todas las Especialidades en service');
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
