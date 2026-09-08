import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

import {
  IGetTubosEnvases,
  ITuboEnvase,
  ITuboEnvaseResponseDTO,
} from '../../../models/Mantenimiento/tuboEnvase.models';

@Injectable({
  providedIn: 'root',
})
export class TuboEnvaseService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  // ==========================================================
  // REGISTRAR
  // ==========================================================
  public registrarTuboEnvase(body: ITuboEnvase) {
    return this._http.post<ITuboEnvaseResponseDTO>(
      `${environment.baseUrl}/api/tuboEnvase`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ==========================================================
  // OBTENER TODOS
  // ==========================================================
  getTubosEnvases(): Observable<ITuboEnvase[]> {
    return this._http
      .get<IGetTubosEnvases>(`${environment.baseUrl}/api/tuboEnvase`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.tubosEnvases));
  }

  // ==========================================================
  // OBTENER POR ESTADO
  // ==========================================================
  getTubosEnvasesPorEstado(
    estado: 'ACTIVO' | 'INACTIVO',
  ): Observable<ITuboEnvase[]> {
    const params = new HttpParams().set('estado', estado);

    return this._http
      .get<IGetTubosEnvases>(`${environment.baseUrl}/api/tuboEnvase`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.tubosEnvases));
  }

  // ==========================================================
  // OBTENER ACTIVOS
  // ==========================================================
  getTubosEnvasesActivos(): Observable<ITuboEnvase[]> {
    return this.getTubosEnvasesPorEstado('ACTIVO');
  }

  // ==========================================================
  // OBTENER POR ID
  // ==========================================================
  getTuboEnvasePorId(id: string): Observable<ITuboEnvase> {
    return this._http
      .get<ITuboEnvaseResponseDTO>(
        `${environment.baseUrl}/api/tuboEnvase/${id}`,
        {
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.tuboEnvase));
  }

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================
  public actualizarTuboEnvase(id: string, body: ITuboEnvase) {
    return this._http.put<ITuboEnvaseResponseDTO>(
      `${environment.baseUrl}/api/tuboEnvase/${id}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================
  public cambiarEstadoTuboEnvase(
    id: string,
    estadoTuboEnvase: 'ACTIVO' | 'INACTIVO',
  ) {
    return this._http.put<ITuboEnvaseResponseDTO>(
      `${environment.baseUrl}/api/tuboEnvase/${id}/estado`,
      {
        estadoTuboEnvase,
      },
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
