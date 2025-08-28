import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import {
  IArqueoCaja,
  IArqueoPostDTO,
  IArqueoResponse,
  IGetArqueos,
  IResumenDiario,
  IDetalleMovimientoArqueo,
} from '../../models/Caja/arqueo.models';
import { IPago } from '../../models/Gestion/pagos.models';

@Injectable({
  providedIn: 'root',
})
export class ArqueoCajaService {
  constructor() {}

  private readonly apiUrl = `${environment.baseUrl}/api/arqueo-caja`;
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  /**
   * Crear un nuevo arqueo de caja
   */
  crearArqueo(body: IArqueoPostDTO): Observable<IArqueoResponse> {
    return this._http.post<IArqueoResponse>(`${this.apiUrl}/crear`, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  /**
   * Obtener el último arqueo abierto (si existe)
   */
  getArqueoAbierto(): Observable<IArqueoCaja | null> {
    return this._http
      .get<IArqueoResponse>(`${this.apiUrl}/abierto`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((response) =>
          response.ok && response.data ? response.data : null,
        ),
      );
  }

  /**
   * Cerrar un arqueo existente
   */
  cerrarArqueo(
    codArqueo: string,
    body: IArqueoPostDTO,
  ): Observable<IArqueoResponse> {
    return this._http.put<IArqueoResponse>(
      `${this.apiUrl}/cerrar/${codArqueo}`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  /**
   * Obtener arqueos por rango de fechas
   */
  getArqueosByDateRange(
    fechaInicio: string,
    fechaFin: string,
    sede?: string,
  ): Observable<IArqueoCaja[]> {
    let params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    if (sede) {
      params = params.set('sede', sede);
    }

    return this._http
      .get<IGetArqueos>(`${this.apiUrl}/rango-fechas`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((response) => response.arqueos || []));
  }

  /**
   * Obtener detalle de movimientos de efectivo para un día específico
   */
  getMovimientosEfectivoDia(
    fecha: string,
    sede?: string,
  ): Observable<IDetalleMovimientoArqueo[]> {
    let params = new HttpParams().set('fecha', fecha);

    if (sede) {
      params = params.set('sede', sede);
    }

    return this._http.get<IDetalleMovimientoArqueo[]>(
      `${this.apiUrl}/movimientos-efectivo`,
      {
        params,
        headers: this._auth.getAuthHeaders(),
      },
    );
  }

  /**
   * Obtener resumen diario de pagos en efectivo
   */
  getResumenDiario(fecha: string, sede?: string): Observable<IResumenDiario> {
    let params = new HttpParams().set('fecha', fecha);

    if (sede) {
      params = params.set('sede', sede);
    }

    return this._http.get<IResumenDiario>(`${this.apiUrl}/resumen-diario`, {
      params,
      headers: this._auth.getAuthHeaders(),
    });
  }

  /**
   * Obtener arqueos recientes
   */
  getUltimosArqueos(cantidad: number = 10): Observable<IArqueoCaja[]> {
    const params = new HttpParams().set('cantidad', cantidad.toString());

    return this._http
      .get<IGetArqueos>(`${this.apiUrl}/ultimos`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((response) => response.arqueos || []));
  }

  /**
   * Buscar arqueos por término
   */
  buscarArqueos(termino: string): Observable<IArqueoCaja[]> {
    const params = new HttpParams().set('termino', termino);

    return this._http
      .get<IGetArqueos>(`${this.apiUrl}/buscar`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((response) => response.arqueos || []));
  }

  /**
   * Obtener arqueo por código
   */
  getArqueoPorCodigo(codArqueo: string): Observable<IArqueoCaja | null> {
    return this._http
      .get<IArqueoResponse>(`${this.apiUrl}/${codArqueo}`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((response) =>
          response.ok && response.data ? response.data : null,
        ),
      );
  }

  /**
   * Anular un arqueo
   */
  anularArqueo(codArqueo: string, motivo: string): Observable<IArqueoResponse> {
    const body = { motivo };

    return this._http.put<IArqueoResponse>(
      `${this.apiUrl}/anular/${codArqueo}`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
