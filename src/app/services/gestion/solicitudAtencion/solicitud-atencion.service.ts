import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  ): Observable<ISolicitudAtencion[]> {
    return this.http.get<ISolicitudAtencion[]>(
      `${this.apiUrl}/findTerm?fechaInicio=${start}&fechaFin=${end}`,
    );
  }

  buscarPorTermino(termino: string): Observable<ISolicitudAtencion[]> {
    return this.http.get<ISolicitudAtencion[]>(
      `${this.apiUrl}?terminoBusqueda=${termino}`,
    );
  }
}
