import { Injectable } from '@angular/core';
import { IDetallePago, IGetDetallePago, IGetLastPagos, IPago, IPagoPostDTO } from '../../../models/pagos.models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/enviroment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagosCotizacionPersonalService {

  constructor(
    private _http: HttpClient
  ) { }

  registrarPago(body: IPago){
    console.log("Enviando valores desde servicio")

    return this._http
        .post<IPagoPostDTO>(
          `${environment.baseUrl}/api/pagos/newPagoPersona`,body
        )
  }

  getDetallePago(codCoti:string): Observable<IDetallePago[]> {
    const params = new HttpParams().set('codCoti',codCoti) 
    return this._http
      .get<IGetDetallePago>(
        `${environment.baseUrl}/api/pagos/findPayDetail`,{params}
      )
      .pipe(map((data) => {
        return data.detallePago;
      })
    );      
  }

  getPagos(cantidad:number): Observable<IPago[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastPagos>(
        `${environment.baseUrl}/api/pagos/latest`,{params}
      )
      .pipe(map((data) => {
        return data.pagos;
      })
    );      
  }

}
