import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ICotizacionEmpresa,
  ICotizacionPostDTO,
  IGetLastCotizacion,
} from '../../../../models/Gestion/cotizacionEmpresa.models';
import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class CotizacionEmpresaService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/cotizacionEmpresa`;

  /**
   * Crear nueva cotización empresarial
   * POST /api/cotizacionEmpresa
   */
  public crearCotizacionEmpresa(
    body: ICotizacionEmpresa,
  ): Observable<ICotizacionPostDTO> {
    console.log('Enviando valores desde cotizacionEmpresa.service');
    console.log('Valores enviados:', body);
    return this._http.post<ICotizacionPostDTO>(this.apiUrl, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  /**
   * Crear nueva versión de cotización empresarial
   * PUT /api/cotizacionEmpresa/nueva-version
   */
  public crearNuevaVersionCotizacionEmpresa(
    body: ICotizacionEmpresa,
  ): Observable<ICotizacionPostDTO> {
    console.log('Enviando nueva versión desde cotizacionEmpresa.service', body);
    return this._http.put<ICotizacionPostDTO>(
      `${this.apiUrl}/nueva-version`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  /**
   * Mostrar últimas cotizaciones empresariales (últimos 7 días)
   * GET /api/cotizacionEmpresa/ultimas
   */
  public getUltimasCotizacionesEmpresa(): Observable<ICotizacionEmpresa[]> {
    return this._http
      .get<IGetLastCotizacion>(`${this.apiUrl}/ultimas`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((data) => {
          return data.cotizaciones;
        }),
      );
  }

  /**
   * Mostrar cotizaciones empresariales por pagar
   * GET /api/cotizacionEmpresa/por-pagar
   */
  public getCotizacionesEmpresaPorPagar(): Observable<ICotizacionEmpresa[]> {
    return this._http
      .get<IGetLastCotizacion>(`${this.apiUrl}/por-pagar`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((data) => {
          return data.cotizaciones;
        }),
      );
  }

  /**
   * Mostrar cotizaciones empresariales pagadas
   * GET /api/cotizacionEmpresa/pagadas
   */
  public getCotizacionesEmpresaPagadas(): Observable<ICotizacionEmpresa[]> {
    return this._http
      .get<IGetLastCotizacion>(`${this.apiUrl}/pagadas`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((data) => {
          return data.cotizaciones;
        }),
      );
  }

  /**
   * Buscar cotizaciones empresariales por término
   * GET /api/cotizacionEmpresa/buscar
   */
  public buscarCotizacionesEmpresa(
    terminoBusqueda: string,
  ): Observable<ICotizacionEmpresa[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastCotizacion>(`${this.apiUrl}/buscar`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.cotizaciones));
  }

  /**
   * Obtener cotización empresarial por código
   * GET /api/cotizacionEmpresa/:codCotizacion
   */
  public obtenerCotizacionEmpresaPorCodigo(
    codCotizacion: string,
  ): Observable<ICotizacionEmpresa> {
    return this._http.get<ICotizacionEmpresa>(
      `${this.apiUrl}/${codCotizacion}`,
      {
        headers: this._auth.getAuthHeaders(),
      },
    );
  }
}
