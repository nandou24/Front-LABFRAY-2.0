import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import {
  ICotizacion,
  ICotizacionPostDTO,
  IGetLastCotizacion,
} from '../../../models/cotizacionPersona.models';

@Injectable({
  providedIn: 'root',
})
export class CotizacionPersonalService {
  constructor(private _http: HttpClient) {}

  public generarCotizacion(body: ICotizacion) {
    console.log('Enviando valores desde cotizacion.service');

    return this._http.post<ICotizacionPostDTO>(
      `${environment.baseUrl}/api/cotizacion/newCotizacionPersona`,
      body,
    );
  }

  generarNuevaVersion(body: ICotizacion) {
    console.log('Enviando valores desde cotizacion.service', body);

    return this._http.post<ICotizacionPostDTO>(
      `${environment.baseUrl}/api/cotizacion/newVersionCotizacionPersona`,
      body,
    );
  }

  getLastCotizacion(cantidad: number): Observable<ICotizacion[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastCotizacion>(`${environment.baseUrl}/api/cotizacion/latest`, {
        params,
      })
      .pipe(
        map((data) => {
          return data.cotizaciones;
        }),
      );
  }

  getCotizacion(terminoBusqueda: any): Observable<ICotizacion[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastCotizacion>(
        `${environment.baseUrl}/api/cotizacion/findTerm`,
        { params },
      )
      .pipe(map((data) => data.cotizaciones));
  }

  getLatestCotizacioPorPagar(cantidad: number): Observable<ICotizacion[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastCotizacion>(
        `${environment.baseUrl}/api/cotizacion/latestPorPagar`,
        { params },
      )
      .pipe(
        map((data) => {
          return data.cotizaciones;
        }),
      );
  }

  verificarHcRegistrada(codCotizacion: string): Observable<boolean> {
    const params = new HttpParams().set('codCotizacion', codCotizacion);
    return this._http
      .get<{
        hcRegistrada: boolean;
      }>(`${environment.baseUrl}/api/cotizacion/findHC`, { params })
      .pipe(map((response) => response.hcRegistrada));
  }
}
