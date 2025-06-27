import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ISolicitudAtencion,
  ISolicitudAtencionPostDTO,
  ISolicitudAtencionPostResponse,
} from '../../../models/solicitudAtencion.models';
import { environment } from '../../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class SolicitudAtencionService {
  private readonly apiUrl = `${environment.baseUrl}/api/solicitudAtencion`; // Ajusta la URL base según tu backend

  constructor(private http: HttpClient) {}

  createSolicitudAtencion(
    data: ISolicitudAtencionPostDTO,
  ): Observable<ISolicitudAtencionPostResponse> {
    return this.http.post<ISolicitudAtencionPostResponse>(
      `${this.apiUrl}`,
      data,
    );
  }

  updateSolicitudAtencion(
    id: string,
    data: Partial<ISolicitudAtencionPostDTO>,
  ): Observable<ISolicitudAtencionPostResponse> {
    return this.http.put<ISolicitudAtencionPostResponse>(
      `${this.apiUrl}/${id}`,
      data,
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

    return this.http.get<ISolicitudAtencion[]>(`${this.apiUrl}/findTerm`, {
      params,
    });
  }

  buscarPorTermino(termino: string): Observable<ISolicitudAtencion[]> {
    return this.http.get<ISolicitudAtencion[]>(
      `${this.apiUrl}?terminoBusqueda=${termino}`,
    );
  }
}
