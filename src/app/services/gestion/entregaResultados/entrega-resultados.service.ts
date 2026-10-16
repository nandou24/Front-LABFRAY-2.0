import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import {
  IAccesoPublicoResultadosResponse,
  IBandejaEntregaResponse,
  ICrearDespachoSolicitudBody,
  IDespachoResultadoResponse,
  IDespachosResultadoResponse,
  IEnvioCorreoDespachoResponse,
  IEnvioWhatsappDespachoResponse,
  IInformeEntregable,
  IRegistroEntregaResponse,
  IRegistrarEntregaBody,
} from '../../../models/Gestion/entregaResultadoLaboratorio.models';

@Injectable({ providedIn: 'root' })
export class EntregaResultadosService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/resultadoLaboratorio/entrega`;
  private readonly resultadoApiUrl = `${environment.baseUrl}/api/resultadoLaboratorio`;

  // ====== Bandeja para Recepción ======
  obtenerBandeja(
    fechaInicio: string,
    fechaFin: string,
    terminoBusqueda = '',
    empresaId = '',
  ): Observable<IBandejaEntregaResponse> {
    return this._http.get<IBandejaEntregaResponse>(`${this.apiUrl}/bandeja`, {
      headers: this._auth.getAuthHeaders(),
      params: {
        fechaInicio,
        fechaFin,
        ...(terminoBusqueda ? { terminoBusqueda } : {}),
        ...(empresaId ? { empresaId } : {}),
      },
    });
  }

  // ====== Vencidos críticos sin límite de fecha ======
  obtenerVencidos(
    terminoBusqueda = '',
    empresaId = '',
  ): Observable<IBandejaEntregaResponse> {
    return this._http.get<IBandejaEntregaResponse>(
      `${this.resultadoApiUrl}/alertas-vencidas`,
      {
        headers: this._auth.getAuthHeaders(),
        params: {
          ...(terminoBusqueda ? { terminoBusqueda } : {}),
          ...(empresaId ? { empresaId } : {}),
        },
      },
    );
  }

  // ====== Informe vigente solo con pruebas liberadas ======
  obtenerInforme(solicitudAtencionId: string): Observable<IInformeEntregable> {
    return this._http.get<IInformeEntregable>(`${this.apiUrl}/solicitud/${solicitudAtencionId}`, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  // ====== Clave de idempotencia por acción ======
  crearClaveIdempotencia(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    return `DSP-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }

  // ====== Preparar despacho común ======
  crearDespacho(
    solicitudAtencionId: string,
    body: ICrearDespachoSolicitudBody,
  ): Observable<IDespachoResultadoResponse> {
    return this._http.post<IDespachoResultadoResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}/despachos`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }


  // ====== Enviar correo automático ======
  enviarCorreoDespacho(
    despachoId: string,
    pdf?: Blob | null,
    nombreArchivo?: string | null,
  ): Observable<IEnvioCorreoDespachoResponse> {
    const formData = new FormData();

    if (pdf && nombreArchivo) {
      formData.append('informePdf', pdf, nombreArchivo);
    }

    return this._http.post<IEnvioCorreoDespachoResponse>(
      `${this.apiUrl}/despachos/${despachoId}/enviar-correo`,
      formData,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Enviar WhatsApp automático ======
  enviarWhatsappDespacho(
    despachoId: string,
  ): Observable<IEnvioWhatsappDespachoResponse> {
    return this._http.post<IEnvioWhatsappDespachoResponse>(
      `${this.apiUrl}/despachos/${despachoId}/enviar-whatsapp`,
      {},
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Resolver visor público sin JWT ======
  resolverAccesoPublico(
    token: string,
  ): Observable<IAccesoPublicoResultadosResponse> {
    return this._http.post<IAccesoPublicoResultadosResponse>(
      `${this.apiUrl}/despachos/acceso`,
      { token },
    );
  }

  // ====== Historial técnico de despachos ======
  obtenerDespachos(
    solicitudAtencionId: string,
  ): Observable<IDespachosResultadoResponse> {
    return this._http.get<IDespachosResultadoResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}/despachos`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  obtenerDespacho(despachoId: string): Observable<IDespachoResultadoResponse> {
    return this._http.get<IDespachoResultadoResponse>(
      `${this.apiUrl}/despachos/${despachoId}`,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  cancelarDespacho(
    despachoId: string,
    motivo: string,
  ): Observable<IDespachoResultadoResponse> {
    return this._http.post<IDespachoResultadoResponse>(
      `${this.apiUrl}/despachos/${despachoId}/cancelar`,
      { motivo },
      { headers: this._auth.getAuthHeaders() },
    );
  }

  revocarEnlaceDespacho(
    despachoId: string,
    motivo: string,
  ): Observable<IDespachoResultadoResponse> {
    return this._http.post<IDespachoResultadoResponse>(
      `${this.apiUrl}/despachos/${despachoId}/revocar-enlace`,
      { motivo },
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Registrar entrega efectiva ======
  registrarEntrega(solicitudAtencionId: string, body: IRegistrarEntregaBody): Observable<IRegistroEntregaResponse> {
    return this._http.post<IRegistroEntregaResponse>(
      `${this.apiUrl}/solicitud/${solicitudAtencionId}/entregas`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
