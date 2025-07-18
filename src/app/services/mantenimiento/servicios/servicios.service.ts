import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import {
  IGetLastServicio,
  IServicio,
  IServicioPostDTO,
} from '../../../models/Mantenimiento/servicios.models';

@Injectable({
  providedIn: 'root',
})
export class ServiciosService {
  constructor(private _http: HttpClient) {}

  getExamenesPorTipo(tipoExamen: string): Observable<any[]> {
    const params = new HttpParams().set('search', tipoExamen);

    return this._http.get<any>(
      `${environment.baseUrl}/api/servicio/tipoExamen`,
      { params },
    );
  }

  public registrarServicio(body: IServicio) {
    console.log('Datos del servicio:', body);
    return this._http.post<IServicioPostDTO>(
      `${environment.baseUrl}/api/servicio/newServicio`,
      body,
    );
  }

  getLastServicio(cantidad: number): Observable<IServicio[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastServicio>(`${environment.baseUrl}/api/servicio/latest`, {
        params,
      })
      .pipe(
        map((data) => {
          return data.servicios;
        }),
      );
  }

  getAllFavoritesServicios(): Observable<IServicio[]> {
    return this._http
      .get<IGetLastServicio>(
        `${environment.baseUrl}/api/servicio/latestFavorites`,
      )
      .pipe(
        map((data) => {
          return data.servicios;
        }),
      );
  }

  getAllServicios(): Observable<IServicio[]> {
    return this._http
      .get<IGetLastServicio>(`${environment.baseUrl}/api/servicio/latest`)
      .pipe(
        map((data) => {
          return data.servicios;
        }),
      );
  }

  getServicio(terminoBusqueda: any): Observable<IServicio[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastServicio>(`${environment.baseUrl}/api/servicio/findTerm`, {
        params,
      })
      .pipe(map((data) => data.servicios));
  }

  public actualizarServicio(codServicio: string, body: IServicio) {
    console.log('Datos del servicio a actualizar:', body);
    return this._http.put<IServicioPostDTO>(
      `${environment.baseUrl}/api/servicio/${codServicio}/updateServicio`,
      body,
    );
  }
}
