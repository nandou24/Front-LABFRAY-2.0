import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { AuthService } from '../../auth/auth.service';

import {
  IAceptarMuestraDTO,
  IAccionMuestraResponse,
  IAnularEvidenciaMuestraDTO,
  IAnularEvidenciaMuestraResponse,
  IAnularMuestraDTO,
  IAnularMuestraResponse,
  IConsultaMuestrasLaboratorioResponse,
  IDetalleMuestraLaboratorioResponse,
  IEvidenciasMuestraResponse,
  IInicializarMuestrasResponse,
  IRechazarMuestraDTO,
  IRechazarMuestraResponse,
  IRecibirMuestraDTO,
  IRecolectarMuestraDTO,
  IRegistrarEvidenciaMuestraResponse,
  IReintentarMuestraResponse,
  EtapaEvidenciaMuestra,
  IBandejaTomaMuestrasResponse,
} from '../../../models/Gestion/muestraLaboratorio.models';

@Injectable({
  providedIn: 'root',
})
export class MuestraLaboratorioService {
  private readonly apiUrl = `${environment.baseUrl}/api/muestraLaboratorio`;

  private readonly http = inject(HttpClient);

  private readonly auth = inject(AuthService);

  // ====== Inicializar muestras ======

  inicializarMuestras(
    solicitudAtencionId: string,
  ): Observable<IInicializarMuestrasResponse> {
    return this.http.post<IInicializarMuestrasResponse>(
      `${this.apiUrl}/inicializar/${solicitudAtencionId}`,
      {},
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener bandeja operativa ======

  obtenerBandeja(
    fechaInicio: string,
    fechaFin: string,
    terminoBusqueda = '',
  ): Observable<IBandejaTomaMuestrasResponse> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('terminoBusqueda', terminoBusqueda.trim());

    return this.http.get<IBandejaTomaMuestrasResponse>(
      `${this.apiUrl}/bandeja`,
      {
        headers: this.auth.getAuthHeaders(),
        params,
      },
    );
  }

  // ====== Registrar recolección ======

  recolectarMuestra(
    muestraLaboratorioId: string,
    body: IRecolectarMuestraDTO,
  ): Observable<IAccionMuestraResponse> {
    return this.http.put<IAccionMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/recolectar`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar recepción ======

  recibirMuestra(
    muestraLaboratorioId: string,
    body: IRecibirMuestraDTO = {},
  ): Observable<IAccionMuestraResponse> {
    return this.http.put<IAccionMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/recibir`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar aceptación ======

  aceptarMuestra(
    muestraLaboratorioId: string,
    body: IAceptarMuestraDTO = {},
  ): Observable<IAccionMuestraResponse> {
    return this.http.put<IAccionMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/aceptar`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar rechazo ======

  rechazarMuestra(
    muestraLaboratorioId: string,
    body: IRechazarMuestraDTO,
  ): Observable<IRechazarMuestraResponse> {
    return this.http.put<IRechazarMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/rechazar`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Anular muestra ======

  anularMuestra(
    muestraLaboratorioId: string,
    body: IAnularMuestraDTO,
  ): Observable<IAnularMuestraResponse> {
    return this.http.put<IAnularMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/anular`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Generar reintento ======

  generarReintento(
    muestraLaboratorioId: string,
  ): Observable<IReintentarMuestraResponse> {
    return this.http.post<IReintentarMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/reintentar`,
      {},
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Consultar por solicitud ======

  obtenerPorSolicitud(
    solicitudAtencionId: string,
  ): Observable<IConsultaMuestrasLaboratorioResponse> {
    return this.http.get<IConsultaMuestrasLaboratorioResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}`,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Consultar por código laboratorio ======

  obtenerPorCodigoLaboratorio(
    codigoLaboratorio: string,
  ): Observable<IConsultaMuestrasLaboratorioResponse> {
    const codigo = encodeURIComponent(codigoLaboratorio.trim());

    return this.http.get<IConsultaMuestrasLaboratorioResponse>(
      `${this.apiUrl}/codigo/${codigo}`,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Consultar detalle ======

  obtenerDetalleMuestra(
    muestraLaboratorioId: string,
  ): Observable<IDetalleMuestraLaboratorioResponse> {
    return this.http.get<IDetalleMuestraLaboratorioResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}`,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar evidencia ======

  registrarEvidencia(
    muestraLaboratorioId: string,
    imagen: File,
    etapa: EtapaEvidenciaMuestra,
    observacion?: string,
  ): Observable<IRegistrarEvidenciaMuestraResponse> {
    const formData = new FormData();

    formData.append('imagen', imagen);

    formData.append('etapa', etapa);

    if (typeof observacion === 'string' && observacion.trim()) {
      formData.append('observacion', observacion.trim());
    }

    return this.http.post<IRegistrarEvidenciaMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/evidencias`,
      formData,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Consultar evidencias ======

  obtenerEvidencias(
    muestraLaboratorioId: string,
    incluirAnuladas = false,
  ): Observable<IEvidenciasMuestraResponse> {
    const params = new HttpParams().set(
      'incluirAnuladas',
      String(incluirAnuladas),
    );

    return this.http.get<IEvidenciasMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/evidencias`,
      {
        headers: this.auth.getAuthHeaders(),
        params,
      },
    );
  }

  // ====== Anular evidencia ======

  anularEvidencia(
    muestraLaboratorioId: string,
    evidenciaId: string,
    body: IAnularEvidenciaMuestraDTO,
  ): Observable<IAnularEvidenciaMuestraResponse> {
    return this.http.put<IAnularEvidenciaMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/evidencias/${evidenciaId}/anular`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }
}
