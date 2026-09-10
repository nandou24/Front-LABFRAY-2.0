import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

import {
  EstadoLaboratorioReferencia,
  IGetLaboratoriosReferencia,
  ILaboratorioReferencia,
  ILaboratorioReferenciaResponseDTO,
} from '../../../models/Mantenimiento/laboratorioReferencia.models';

@Injectable({
  providedIn: 'root',
})
export class LaboratorioReferenciaService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  // ====== Registrar ======

  public registrarLaboratorioReferencia(
    body: ILaboratorioReferencia,
  ): Observable<ILaboratorioReferenciaResponseDTO> {
    return this._http.post<ILaboratorioReferenciaResponseDTO>(
      `${environment.baseUrl}/api/laboratorioReferencia`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener todos ======

  public getLaboratoriosReferencia(): Observable<ILaboratorioReferencia[]> {
    return this._http
      .get<IGetLaboratoriosReferencia>(
        `${environment.baseUrl}/api/laboratorioReferencia`,
        {
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.laboratoriosReferencia));
  }

  // ====== Obtener por estado ======

  public getLaboratoriosReferenciaPorEstado(
    estado: EstadoLaboratorioReferencia,
  ): Observable<ILaboratorioReferencia[]> {
    const params = new HttpParams().set('estado', estado);

    return this._http
      .get<IGetLaboratoriosReferencia>(
        `${environment.baseUrl}/api/laboratorioReferencia`,
        {
          params,
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.laboratoriosReferencia));
  }

  // ====== Obtener activos ======

  public getLaboratoriosReferenciaActivos(): Observable<
    ILaboratorioReferencia[]
  > {
    return this.getLaboratoriosReferenciaPorEstado('ACTIVO');
  }

  // ====== Buscar ======

  public buscarLaboratoriosReferencia(
    termino: string,
  ): Observable<ILaboratorioReferencia[]> {
    const params = new HttpParams().set('search', termino.trim());

    return this._http
      .get<IGetLaboratoriosReferencia>(
        `${environment.baseUrl}/api/laboratorioReferencia`,
        {
          params,
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.laboratoriosReferencia));
  }

  // ====== Buscar activos ======

  public buscarLaboratoriosReferenciaActivos(
    termino: string,
  ): Observable<ILaboratorioReferencia[]> {
    const params = new HttpParams()
      .set('estado', 'ACTIVO')
      .set('search', termino.trim());

    return this._http
      .get<IGetLaboratoriosReferencia>(
        `${environment.baseUrl}/api/laboratorioReferencia`,
        {
          params,
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.laboratoriosReferencia));
  }

  // ====== Obtener por ID ======

  public getLaboratorioReferenciaPorId(
    id: string,
  ): Observable<ILaboratorioReferencia> {
    return this._http
      .get<ILaboratorioReferenciaResponseDTO>(
        `${environment.baseUrl}/api/laboratorioReferencia/${id}`,
        {
          headers: this._auth.getAuthHeaders(),
        },
      )
      .pipe(map((data) => data.laboratorioReferencia));
  }

  // ====== Actualizar ======

  public actualizarLaboratorioReferencia(
    id: string,
    body: ILaboratorioReferencia,
  ): Observable<ILaboratorioReferenciaResponseDTO> {
    return this._http.put<ILaboratorioReferenciaResponseDTO>(
      `${environment.baseUrl}/api/laboratorioReferencia/${id}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Cambiar estado ======

  public cambiarEstadoLaboratorioReferencia(
    id: string,
    estadoLaboratorioReferencia: EstadoLaboratorioReferencia,
  ): Observable<ILaboratorioReferenciaResponseDTO> {
    return this._http.put<ILaboratorioReferenciaResponseDTO>(
      `${environment.baseUrl}/api/laboratorioReferencia/${id}/estado`,
      {
        estadoLaboratorioReferencia,
      },
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
