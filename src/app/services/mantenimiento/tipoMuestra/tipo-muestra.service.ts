import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

import {
  IGetTiposMuestra,
  ITipoMuestra,
  ITipoMuestraResponseDTO,
} from '../../../models/Mantenimiento/tipoMuestra.models';

@Injectable({
  providedIn: 'root',
})
export class TipoMuestraService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  // ==========================================================
  // REGISTRAR
  // ==========================================================
  public registrarTipoMuestra(body: ITipoMuestra) {
    return this._http.post<ITipoMuestraResponseDTO>(
      `${environment.baseUrl}/api/tipoMuestra`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ==========================================================
  // OBTENER TODOS
  // ==========================================================
  getTiposMuestra(): Observable<ITipoMuestra[]> {
    return this._http
      .get<IGetTiposMuestra>(`${environment.baseUrl}/api/tipoMuestra`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.tiposMuestra));
  }

  // ==========================================================
  // OBTENER POR ESTADO
  // ==========================================================
  getTiposMuestraPorEstado(
    estado: 'ACTIVO' | 'INACTIVO',
  ): Observable<ITipoMuestra[]> {
    const params = new HttpParams().set('estado', estado);

    return this._http
      .get<IGetTiposMuestra>(`${environment.baseUrl}/api/tipoMuestra`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.tiposMuestra));
  }

  // ==========================================================
  // OBTENER ACTIVOS
  // ==========================================================
  getTiposMuestraActivos(): Observable<ITipoMuestra[]> {
    return this.getTiposMuestraPorEstado('ACTIVO');
  }

  // ==========================================================
  // OBTENER POR ID
  // ==========================================================
  getTipoMuestraPorId(id: string): Observable<ITipoMuestra> {
    return this._http
      .get<ITipoMuestraResponseDTO>(
        `${environment.baseUrl}/api/tipoMuestra/${id}`,
        {
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.tipoMuestra));
  }

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================
  public actualizarTipoMuestra(id: string, body: ITipoMuestra) {
    return this._http.put<ITipoMuestraResponseDTO>(
      `${environment.baseUrl}/api/tipoMuestra/${id}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ==========================================================
  // CAMBIAR ESTADO
  // ==========================================================
  public cambiarEstadoTipoMuestra(
    id: string,
    estadoTipoMuestra: 'ACTIVO' | 'INACTIVO',
  ) {
    return this._http.put<ITipoMuestraResponseDTO>(
      `${environment.baseUrl}/api/tipoMuestra/${id}/estado`,
      {
        estadoTipoMuestra,
      },
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
