import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ISolicitudAtencion,
  ISolicitudAtencionPostResponse,
} from '../../../models/Gestion/solicitudAtencion.models';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SolicitudAtencionService {
  private readonly apiUrl = `${environment.baseUrl}/api/solicitudAtencion`; // Ajusta la URL base según tu backend

  constructor() {}

  private readonly http = inject(HttpClient);
  private readonly _auth = inject(AuthService);

  createSolicitudAtencion(
    data: ISolicitudAtencion,
  ): Observable<ISolicitudAtencionPostResponse> {
    return this.http.post<ISolicitudAtencionPostResponse>(
      `${this.apiUrl}`,
      data,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  updateSolicitudAtencion(
    id: string,
    data: Partial<ISolicitudAtencion>,
  ): Observable<ISolicitudAtencionPostResponse> {
    return this.http.put<ISolicitudAtencionPostResponse>(
      `${this.apiUrl}/${id}`,
      data,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  // getAllbyDate(): Observable<ISolicitudAtencion[]> {
  //   return this.http.get<ISolicitudAtencion[]>(`${this.apiUrl}`);
  // }

  getAllByDateRange(
    start: string,
    end: string,
    termino: string,
  ): Observable<ISolicitudAtencion[]> {
    const params = new HttpParams()
      .set('fechaInicio', start)
      .set('fechaFin', end)
      .set('terminoBusqueda', termino);

    return this.http.get<ISolicitudAtencion[]>(
      `${this.apiUrl}/findByRangoFechas`,
      {
        params,
      },
    );
  }

  buscarPorTermino(termino: string): Observable<ISolicitudAtencion[]> {
    return this.http.get<ISolicitudAtencion[]>(
      `${this.apiUrl}?terminoBusqueda=${termino}`,
    );
  }
}
