import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  IGetLastRoles,
  IRol,
  IRolPostDTO,
} from '../../../models/permisos/roles.models';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  private readonly apiUrl = `${environment.baseUrl}/api/roles`;

  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  registrarRol(rol: IRol): Observable<IRolPostDTO> {
    return this._http.post<IRolPostDTO>(`${this.apiUrl}/newRol`, rol, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  actualizarRol(codRol: string, rol: IRol): Observable<IRolPostDTO> {
    return this._http.put<IRolPostDTO>(`${this.apiUrl}/${codRol}`, rol, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  eliminarRol(codRol: string): Observable<IRolPostDTO> {
    return this._http.delete<IRolPostDTO>(`${this.apiUrl}/${codRol}`, {
      headers: this._auth.getAuthHeaders(),
    });
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
