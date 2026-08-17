import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../../environments/environment';
import {
  IProgramacionPostDTO,
  IProgramacionEmpresa,
  IGetProgramaciones,
  IGetProgramacionById,
} from '../../../../models/Gestion/programacionEmpresa.models';

@Injectable({
  providedIn: 'root',
})
export class ProgramacionEmpresaService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/programacionEmpresa`;

  public crearProgramacionEmpresa(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this._http.post<IProgramacionPostDTO>(this.apiUrl, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  // Alias para mantener consistencia semantica en llamadas de registro
  public registrarProgramacion(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this.crearProgramacionEmpresa(body);
  }

  public getLastProgramaciones(
    cantidad: number,
  ): Observable<IProgramacionEmpresa[]> {
    const params = new HttpParams().set('cant', cantidad);

    return this._http
      .get<IGetProgramaciones>(`${this.apiUrl}/latest`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.programaciones));
  }

  public getProgramacion(
    terminoBusqueda: string,
  ): Observable<IProgramacionEmpresa[]> {
    const params = new HttpParams().set('search', terminoBusqueda);

    return this._http
      .get<IGetProgramaciones>(`${this.apiUrl}/findTerm`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.programaciones));
  }

  public getProgramacionById(id: string): Observable<IProgramacionEmpresa> {
    const params = new HttpParams().set('search', id);

    return this._http
      .get<IGetProgramacionById>(`${this.apiUrl}/findTermById`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.programacion));
  }

  public actualizarProgramacion(
    body: IProgramacionEmpresa,
  ): Observable<IProgramacionPostDTO> {
    return this._http.put<IProgramacionPostDTO>(
      `${this.apiUrl}/updateProgramacion`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
