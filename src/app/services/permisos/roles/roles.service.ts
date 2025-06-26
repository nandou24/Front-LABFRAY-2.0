import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  IGetLastRoles,
  IRol,
  IRolPostDTO,
} from '../../../models/permisos/roles.models';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly apiUrl = `${environment.baseUrl}/api/roles`;

  constructor(private readonly _http: HttpClient) {}

  registrarRol(rol: IRol): Observable<IRolPostDTO> {
    return this._http.post<IRolPostDTO>(`${this.apiUrl}/newRol`, rol);
  }

  actualizarRol(codRol: string, rol: IRol): Observable<IRolPostDTO> {
    return this._http.put<IRolPostDTO>(`${this.apiUrl}/${codRol}`, rol);
  }

  eliminarRol(codRol: string): Observable<IRolPostDTO> {
    return this._http.delete<IRolPostDTO>(`${this.apiUrl}/${codRol}`);
  }

  getAllRoles(): Observable<IRol[]> {
    return this._http
      .get<IGetLastRoles>(`${this.apiUrl}/latest`)
      .pipe(map((data) => data.roles));
  }

  getRolBusqueda(terminoBusqueda: string): Observable<IRol[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastRoles>(`${this.apiUrl}/findTerm`, { params })
      .pipe(map((data) => data.roles));
  }
}
