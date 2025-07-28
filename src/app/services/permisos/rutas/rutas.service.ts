import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import {
  IGetLastRutas,
  IRuta,
  IRutaPostDTO,
} from '../../../models/permisos/rutas.models';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RutasService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/rutas`;

  registrarRuta(ruta: IRuta): Observable<any> {
    return this._http.post<IRutaPostDTO>(`${this.apiUrl}/newRuta`, ruta);
  }

  actualizarRuta(codRuta: string, ruta: IRuta): Observable<any> {
    return this._http.put<IRutaPostDTO>(`${this.apiUrl}/${codRuta}`, ruta);
  }

  eliminarRuta(codRuta: string): Observable<any> {
    return this._http.delete<IRutaPostDTO>(`${this.apiUrl}/${codRuta}`);
  }

  getAllRutas(): Observable<IRuta[]> {
    return this._http.get<IGetLastRutas>(`${this.apiUrl}/latest`).pipe(
      map((data) => {
        return data.rutas;
      }),
    );
  }

  getRutaPorBusqueda(terminoBusqueda: any): Observable<IRuta[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastRutas>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.rutas));
  }
}
