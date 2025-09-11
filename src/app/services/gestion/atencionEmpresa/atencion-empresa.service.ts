import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IAtencionEmp } from '../../../models/Gestion/atencionEmpresa.models';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AtencionEmpresaService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);
  private readonly apiUrl = `${environment.baseUrl}/api/atencionEmpresa`;

  /**
   * Crear nueva atención empresarial
   * POST /api/atencionEmpresa
   */
  public crearAtencionEmpresa(body: IAtencionEmp): Observable<any> {
    return this._http.post<any>(this.apiUrl, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  /**
   * Obtener atenciones empresariales recientes
   * GET /api/atencionEmpresa/ultimas
   */
  public getUltimasAtencionesEmpresa(): Observable<IAtencionEmp[]> {
    return this._http
      .get<{ atenciones: IAtencionEmp[] }>(`${this.apiUrl}/ultimas`, {
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.atenciones));
  }

  /**
   * Buscar atenciones empresariales por término
   * GET /api/atencionEmpresa/buscar
   */
  public buscarAtencionesEmpresa(terminoBusqueda: string): Observable<IAtencionEmp[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<{ atenciones: IAtencionEmp[] }>(`${this.apiUrl}/buscar`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(map((data) => data.atenciones));
  }

  /**
   * Obtener atención empresarial por ID
   * GET /api/atencionEmpresa/:id
   */
  public obtenerAtencionEmpresaPorId(id: string): Observable<IAtencionEmp> {
    return this._http.get<IAtencionEmp>(`${this.apiUrl}/${id}`, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  /**
   * Actualizar atención empresarial
   * PUT /api/atencionEmpresa/:id
   */
  public actualizarAtencionEmpresa(id: string, body: IAtencionEmp): Observable<any> {
    return this._http.put<any>(`${this.apiUrl}/${id}`, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }
}
