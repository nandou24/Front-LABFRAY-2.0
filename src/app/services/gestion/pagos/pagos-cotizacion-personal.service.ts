import { inject, Injectable } from '@angular/core';
import {
  IDetallePago,
  IGetDetallePago,
  IGetLastPagos,
  IPago,
  IPagoPostDTOResponse,
} from '../../../models/Gestion/pagos.models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PagosCotizacionPersonalService {
  constructor() {}
  private readonly apiUrl = `${environment.baseUrl}/api/pagos`;
  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  registrarPago(body: IPago) {
    console.log('Enviando pago desde servicio', body);

    return this._http.post<IPagoPostDTOResponse>(
      `${this.apiUrl}/newPagoPersona`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getDetallePago(codCoti: string): Observable<IDetallePago[]> {
    const params = new HttpParams().set('codCoti', codCoti);
    return this._http
      .get<IGetDetallePago>(`${this.apiUrl}/findPayDetail`, {
        params,
      })
      .pipe(
        map((data) => {
          return data.detallePago;
        }),
      );
  }

  getPagos(cantidad: number): Observable<IPago[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastPagos>(`${this.apiUrl}/latest`, { params })
      .pipe(
        map((data) => {
          return data.pagos;
        }),
      );
  }

  getPago(terminoBusqueda: any): Observable<IPago[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastPagos>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.pagos));
  }

  getAllByDateRange(
    start: string,
    end: string,
    termino: string,
  ): Observable<IPago[]> {
    const params = new HttpParams()
      .set('fechaInicio', start)
      .set('fechaFin', end)
      .set('terminoBusqueda', termino);

    return this._http.get<IPago[]>(`${this.apiUrl}/findReport`, {
      params,
    });
  }

  anularPago(
    codPago: string,
    motivo: string,
    observacion: string | null,
  ): Observable<IPagoPostDTOResponse> {
    const body = { motivo, observacion };

    return this._http.put<IPagoPostDTOResponse>(
      `${this.apiUrl}/anularPago/${codPago}`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
