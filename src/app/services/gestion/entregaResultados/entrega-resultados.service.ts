import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import {
  IBandejaEntregaResponse,
  IInformeEntregable,
  IRegistroEntregaResponse,
  IRegistrarEntregaBody,
} from '../../../models/Gestion/entregaResultadoLaboratorio.models';

@Injectable({ providedIn: 'root' })
export class EntregaResultadosService {
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/resultadoLaboratorio/entrega`;

  // ====== Bandeja para Recepción ======
  obtenerBandeja(fechaInicio: string, fechaFin: string, terminoBusqueda = ''): Observable<IBandejaEntregaResponse> {
    return this._http.get<IBandejaEntregaResponse>(`${this.apiUrl}/bandeja`, {
      headers: this._auth.getAuthHeaders(),
      params: { fechaInicio, fechaFin, ...(terminoBusqueda ? { terminoBusqueda } : {}) },
    });
  }

  // ====== Informe vigente solo con pruebas liberadas ======
  obtenerInforme(solicitudAtencionId: string): Observable<IInformeEntregable> {
    return this._http.get<IInformeEntregable>(`${this.apiUrl}/solicitud/${solicitudAtencionId}`, {
      headers: this._auth.getAuthHeaders(),
    });
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
