import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import {
  EstadoDiaNoLaborable,
  IDiaNoLaborable,
  IDiaNoLaborableResponseDTO,
  IGetDiasNoLaborables,
} from '../../../models/Mantenimiento/diaNoLaborable.models';

@Injectable({
  providedIn: 'root',
})
export class DiaNoLaborableService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  private readonly apiUrl = `${environment.baseUrl}/api/pruebaLab/dias-no-laborables`;

  public getDiasNoLaborables(params?: {
    anio?: number;
    estado?: EstadoDiaNoLaborable | '';
    search?: string;
  }): Observable<IDiaNoLaborable[]> {
    let httpParams = new HttpParams();

    if (params?.anio) {
      httpParams = httpParams.set('anio', String(params.anio));
    }

    if (params?.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }

    if (params?.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this._http
      .get<IGetDiasNoLaborables>(this.apiUrl, {
        params: httpParams,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((respuesta) => respuesta.diasNoLaborables));
  }

  public crearDiaNoLaborable(
    body: IDiaNoLaborable,
  ): Observable<IDiaNoLaborableResponseDTO> {
    return this._http.post<IDiaNoLaborableResponseDTO>(this.apiUrl, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  public actualizarDiaNoLaborable(
    id: string,
    body: IDiaNoLaborable,
  ): Observable<IDiaNoLaborableResponseDTO> {
    return this._http.put<IDiaNoLaborableResponseDTO>(
      `${this.apiUrl}/${id}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  public cambiarEstadoDiaNoLaborable(
    id: string,
    estadoDiaNoLaborable: EstadoDiaNoLaborable,
  ): Observable<IDiaNoLaborableResponseDTO> {
    return this._http.put<IDiaNoLaborableResponseDTO>(
      `${this.apiUrl}/${id}/estado`,
      { estadoDiaNoLaborable },
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
