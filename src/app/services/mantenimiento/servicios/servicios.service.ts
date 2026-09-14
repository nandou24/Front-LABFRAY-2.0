import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  IGetLaboratorioPorServicios,
  IGetLastServicio,
  IGetServiciosExpandidos,
  IServicio,
  IServicioExpandido,
  IServicioPostDTO,
} from '../../../models/Mantenimiento/servicios.models';

import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ServiciosService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

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
      { headers: this._auth.getAuthHeaders() },
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

  getAllFavoritesServiciosEmpresa(): Observable<IServicio[]> {
    return this._http
      .get<IGetLastServicio>(
        `${environment.baseUrl}/api/servicio/latestFavoritesEmpresa`,
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
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // ====== Obtener servicios expandidos ======
  public getServiciosExpandidos(
    servicioIds: string[],
  ): Observable<IServicioExpandido[]> {
    let params = new HttpParams();

    servicioIds.forEach((servicioId) => {
      params = params.append('servicioIds', servicioId);
    });

    return this._http
      .get<IGetServiciosExpandidos>(
        `${environment.baseUrl}/api/servicio/expandidos`,
        {
          params,
        },
      )
      .pipe(map((data) => data.serviciosExpandidos));
  }

  // ====== Obtener laboratorio por servicios ======
  public getPruebasLaboratorioItems(
    servicioIds: string[],
  ): Observable<IGetLaboratorioPorServicios> {
    let params = new HttpParams();

    servicioIds.forEach((servicioId) => {
      params = params.append('servicioIds', servicioId);
    });

    return this._http.get<IGetLaboratorioPorServicios>(
      `${environment.baseUrl}/api/servicio/pruebaLab-items`,
      {
        params,
      },
    );
  }
}
