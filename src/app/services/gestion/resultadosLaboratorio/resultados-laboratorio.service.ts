import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

import {
  IBandejaResultadosLaboratorioResponse,
  IAnularResultadoDTO,
  IAnularResultadoResponse,
  IInicializarResultadosResponse,
  ILiberarResultadoDTO,
  ILiberarResultadoResponse,
  IRegistrarResultadoItemDTO,
  IRegistrarResultadoItemResponse,
  IRegistrarResultadosMasivosDTO,
  IRegistrarResultadosMasivosResponse,
  IResultadoPorIdResponse,
  IResultadosLiberadosResponse,
  IResultadosPorSolicitudResponse,
  IValidarResultadoDTO,
  IValidarResultadoResponse,
  IValidarResultadosMasivosDTO,
  IValidarResultadosMasivosResponse,
  IReabrirResultadoResponse,
} from '../../../models/Gestion/resultadoLaboratorio.models';

@Injectable({
  providedIn: 'root',
})
export class ResultadoLaboratorioService {
  private readonly apiUrl = `${environment.baseUrl}/api/resultadoLaboratorio`;

  private readonly _http = inject(HttpClient);

  private readonly _auth = inject(AuthService);

  // ====== Obtener bandeja de resultados ======

  obtenerBandeja(
    fechaInicio: string,
    fechaFin: string,
    terminoBusqueda = '',
  ): Observable<IBandejaResultadosLaboratorioResponse> {
    return this._http.get<IBandejaResultadosLaboratorioResponse>(
      `${this.apiUrl}/bandeja`,
      {
        headers: this._auth.getAuthHeaders(),
        params: {
          fechaInicio,
          fechaFin,
          ...(terminoBusqueda ? { terminoBusqueda } : {}),
        },
      },
    );
  }

  // ====== Inicializar resultados ======

  inicializarResultados(
    solicitudAtencionId: string,
  ): Observable<IInicializarResultadosResponse> {
    return this._http.post<IInicializarResultadosResponse>(
      `${this.apiUrl}/inicializar/${solicitudAtencionId}`,
      {},
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Preparar resultados para gestión ======

  prepararResultadosSolicitud(
    solicitudAtencionId: string,
  ): Observable<IResultadosPorSolicitudResponse> {
    return this.inicializarResultados(solicitudAtencionId).pipe(
      switchMap(() => this.obtenerResultadosPorSolicitud(solicitudAtencionId)),
    );
  }

  // ====== Obtener resultados por solicitud ======

  obtenerResultadosPorSolicitud(
    solicitudAtencionId: string,
  ): Observable<IResultadosPorSolicitudResponse> {
    return this._http.get<IResultadosPorSolicitudResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}`,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener resultado por id ======

  obtenerResultadoPorId(
    resultadoLaboratorioId: string,
  ): Observable<IResultadoPorIdResponse> {
    return this._http.get<IResultadoPorIdResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}`,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener resultados liberados ======

  obtenerResultadosLiberados(
    solicitudAtencionId: string,
  ): Observable<IResultadosLiberadosResponse> {
    return this._http.get<IResultadosLiberadosResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}/liberados`,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar o editar Item ======

  registrarEditarResultadoItem(
    resultadoLaboratorioId: string,
    itemResultadoId: string,
    body: IRegistrarResultadoItemDTO,
  ): Observable<IRegistrarResultadoItemResponse> {
    return this._http.put<IRegistrarResultadoItemResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/items/${itemResultadoId}`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar resultados masivos ======

  registrarResultadosMasivos(
    resultadoLaboratorioId: string,
    body: IRegistrarResultadosMasivosDTO,
  ): Observable<IRegistrarResultadosMasivosResponse> {
    return this._http.put<IRegistrarResultadosMasivosResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/items`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Revisar informe antes de validar ======

  revisarResultadoAntesValidacion(
    resultadoLaboratorioId: string,
    body: IRegistrarResultadosMasivosDTO,
  ): Observable<IRegistrarResultadosMasivosResponse> {
    return this._http.put<IRegistrarResultadosMasivosResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/revision-items`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Validar resultados masivamente ======

  validarResultadosMasivamente(
    body: IValidarResultadosMasivosDTO,
  ): Observable<IValidarResultadosMasivosResponse> {
    return this._http.put<IValidarResultadosMasivosResponse>(
      `${this.apiUrl}/validar-masivo`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Validar resultado ======

  validarResultado(
    resultadoLaboratorioId: string,
    body: IValidarResultadoDTO = {},
  ): Observable<IValidarResultadoResponse> {
    return this._http.put<IValidarResultadoResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/validar`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Liberar resultado ======

  liberarResultado(
    resultadoLaboratorioId: string,
    body: ILiberarResultadoDTO = {},
  ): Observable<ILiberarResultadoResponse> {
    return this._http.put<ILiberarResultadoResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/liberar`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Anular resultado ======

  anularResultado(
    resultadoLaboratorioId: string,
    body: IAnularResultadoDTO,
  ): Observable<IAnularResultadoResponse> {
    return this._http.put<IAnularResultadoResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/anular`,
      body,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  // ====== Reabrir resultado anulado ======

  reabrirResultado(
    resultadoLaboratorioId: string,
  ): Observable<IReabrirResultadoResponse> {
    return this._http.put<IReabrirResultadoResponse>(
      `${this.apiUrl}/${resultadoLaboratorioId}/reabrir`,
      {},
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

}
