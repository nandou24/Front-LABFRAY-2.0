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
  ICorregirEvaluacionMuestraDTO,
  ICorregirEvaluacionMuestraResponse,
  IDetalleMuestraLaboratorioResponse,
  IEvidenciasMuestraResponse,
  IInicializarMuestrasResponse,
  IRechazarMuestraResponse,
  IRecibirMuestraDTO,
  IRecolectarMuestraDTO,
  IRegistrarEvidenciaMuestraResponse,
  IReintentarMuestraResponse,
  EtapaEvidenciaMuestra,
  IBandejaTomaMuestrasResponse,
  IRecoleccionMasivaDisponiblesResponse,
  IRecolectarMuestrasMasivamenteDTO,
  IRecolectarMuestrasMasivamenteResponse,
  IRecepcionMasivaDisponiblesResponse,
  IRecibirMuestrasMasivamenteDTO,
  IRecibirMuestrasMasivamenteResponse,
  IAceptacionMasivaDisponiblesResponse,
  IAceptarMuestrasMasivamenteDTO,
  IAceptarMuestrasMasivamenteResponse,
  OrigenAtencionBandejaMuestra,
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

  // ====== Obtener candidatos para recolección masiva ======

  obtenerMuestrasRecoleccionMasiva(
    fechaInicio: string,
    fechaFin: string,
    origenAtencion?: OrigenAtencionBandejaMuestra,
    terminoBusqueda = '',
  ): Observable<IRecoleccionMasivaDisponiblesResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('terminoBusqueda', terminoBusqueda.trim());

    if (origenAtencion) {
      params = params.set('origenAtencion', origenAtencion);
    }

    return this.http.get<IRecoleccionMasivaDisponiblesResponse>(
      `${this.apiUrl}/masiva/recoleccion`,
      {
        headers: this.auth.getAuthHeaders(),
        params,
      },
    );
  }

  // ====== Registrar recolección masiva ======

  recolectarMuestrasMasivamente(
    body: IRecolectarMuestrasMasivamenteDTO,
  ): Observable<IRecolectarMuestrasMasivamenteResponse> {
    return this.http.put<IRecolectarMuestrasMasivamenteResponse>(
      `${this.apiUrl}/masiva/recolectar`,
      body,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener candidatos para recepción masiva ======

  obtenerMuestrasRecepcionMasiva(
    fechaInicio: string,
    fechaFin: string,
    origenAtencion?: OrigenAtencionBandejaMuestra,
    terminoBusqueda = '',
  ): Observable<IRecepcionMasivaDisponiblesResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('terminoBusqueda', terminoBusqueda.trim());

    if (origenAtencion) {
      params = params.set('origenAtencion', origenAtencion);
    }

    return this.http.get<IRecepcionMasivaDisponiblesResponse>(
      `${this.apiUrl}/masiva/recepcion`,
      {
        headers: this.auth.getAuthHeaders(),
        params,
      },
    );
  }

  // ====== Registrar recepción masiva ======

  recibirMuestrasMasivamente(
    body: IRecibirMuestrasMasivamenteDTO,
    imagenGrupal?: File,
  ): Observable<IRecibirMuestrasMasivamenteResponse> {
    if (!imagenGrupal) {
      return this.http.put<IRecibirMuestrasMasivamenteResponse>(
        `${this.apiUrl}/masiva/recibir`,
        body,
        {
          headers: this.auth.getAuthHeaders(),
        },
      );
    }

    const formData = new FormData();

    formData.append(
      'muestraLaboratorioIds',
      JSON.stringify(body.muestraLaboratorioIds),
    );

    if (body.observacionRecepcion?.trim()) {
      formData.append(
        'observacionRecepcion',
        body.observacionRecepcion.trim(),
      );
    }

    formData.append('imagen', imagenGrupal);

    return this.http.put<IRecibirMuestrasMasivamenteResponse>(
      `${this.apiUrl}/masiva/recibir`,
      formData,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Obtener candidatos para aceptación masiva ======

  obtenerMuestrasAceptacionMasiva(
    fechaInicio: string,
    fechaFin: string,
    origenAtencion?: OrigenAtencionBandejaMuestra,
    terminoBusqueda = '',
  ): Observable<IAceptacionMasivaDisponiblesResponse> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin)
      .set('terminoBusqueda', terminoBusqueda.trim());

    if (origenAtencion) {
      params = params.set('origenAtencion', origenAtencion);
    }

    return this.http.get<IAceptacionMasivaDisponiblesResponse>(
      `${this.apiUrl}/masiva/aceptacion`,
      {
        headers: this.auth.getAuthHeaders(),
        params,
      },
    );
  }

  // ====== Registrar aceptación masiva ======

  aceptarMuestrasMasivamente(
    body: IAceptarMuestrasMasivamenteDTO,
    imagenGrupal?: File,
  ): Observable<IAceptarMuestrasMasivamenteResponse> {
    if (!imagenGrupal) {
      return this.http.put<IAceptarMuestrasMasivamenteResponse>(
        `${this.apiUrl}/masiva/aceptar`,
        body,
        {
          headers: this.auth.getAuthHeaders(),
        },
      );
    }

    const formData = new FormData();

    formData.append(
      'muestraLaboratorioIds',
      JSON.stringify(body.muestraLaboratorioIds),
    );

    if (body.observacionAceptacion?.trim()) {
      formData.append(
        'observacionAceptacion',
        body.observacionAceptacion.trim(),
      );
    }

    formData.append('imagen', imagenGrupal);

    return this.http.put<IAceptarMuestrasMasivamenteResponse>(
      `${this.apiUrl}/masiva/aceptar`,
      formData,
      {
        headers: this.auth.getAuthHeaders(),
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

  // ====== Corregir evaluación ======

  corregirEvaluacionMuestra(
    muestraLaboratorioId: string,
    body: ICorregirEvaluacionMuestraDTO,
    imagen?: File,
  ): Observable<ICorregirEvaluacionMuestraResponse> {
    const formData = new FormData();

    formData.append('motivoCorreccion', body.motivoCorreccion.trim());
    formData.append(
      'nombreUsuarioAutorizador',
      body.nombreUsuarioAutorizador.trim(),
    );
    formData.append('passwordAutorizador', body.passwordAutorizador);

    if (imagen) {
      formData.append('imagen', imagen);
    }

    return this.http.put<ICorregirEvaluacionMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/corregir-evaluacion`,
      formData,
      {
        headers: this.auth.getAuthHeaders(),
      },
    );
  }

  // ====== Registrar rechazo ======

  rechazarMuestra(
    muestraLaboratorioId: string,
    motivoRechazo: string,
    imagen: File,
  ): Observable<IRechazarMuestraResponse> {
    const formData = new FormData();

    formData.append('motivoRechazo', motivoRechazo.trim());

    formData.append('imagen', imagen);

    return this.http.put<IRechazarMuestraResponse>(
      `${this.apiUrl}/${muestraLaboratorioId}/rechazar`,
      formData,
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
