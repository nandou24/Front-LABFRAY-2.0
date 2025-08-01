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

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  registrarPago(body: IPago) {
    console.log('Enviando pago desde servicio', body);

    return this._http.post<IPagoPostDTOResponse>(
      `${environment.baseUrl}/api/pagos/newPagoPersona`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getDetallePago(codCoti: string): Observable<IDetallePago[]> {
    const params = new HttpParams().set('codCoti', codCoti);
    return this._http
      .get<IGetDetallePago>(`${environment.baseUrl}/api/pagos/findPayDetail`, {
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
      .get<IGetLastPagos>(`${environment.baseUrl}/api/pagos/latest`, { params })
      .pipe(
        map((data) => {
          return data.pagos;
        }),
      );
  }

  anularPago(
    codPago: string,
    motivo: string,
    observacion: string | null,
  ): Observable<IPagoPostDTOResponse> {
    const body = { motivo, observacion };

    return this._http.put<IPagoPostDTOResponse>(
      `${environment.baseUrl}/api/pagos/anularPago/${codPago}`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
