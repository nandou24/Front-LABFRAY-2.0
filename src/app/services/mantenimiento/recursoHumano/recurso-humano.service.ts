import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  IGetLastRecHumano,
  IRecHumano,
  IRecHumanoPostResponseDTO,
} from '../../../models/Mantenimiento/recursoHumano.models';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RecursoHumanoService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly _router = inject(Router);
  private readonly _auth = inject(AuthService);

  public registrarRecHumano(body: IRecHumano) {
    console.log('Enviando valores desde registro recurso humano', body);

    return this._http.post<IRecHumanoPostResponseDTO>(
      `${environment.baseUrl}/api/recursoHumano/newRecHumano`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getLastRecHumanos(cantidad: number): Observable<IRecHumano[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/latest`,
        { params },
      )
      .pipe(
        map((data) => {
          return data.recHumanos;
        }),
      );
  }

  getRecursosSolicitantes(cantidad: number): Observable<IRecHumano[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/latestSolicitantes`,
        { params },
      )
      .pipe(
        map((data) => {
          return data.recHumanos;
        }),
      );
  }

  getRecHumano(terminoBusqueda: any): Observable<IRecHumano[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/findTerm`,
        { params },
      )
      .pipe(map((data) => data.recHumanos));
  }

  getSolicitante(terminoBusqueda: any): Observable<IRecHumano[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/findTermSolicitante`,
        { params },
      )
      .pipe(map((data) => data.recHumanos));
  }

  public actualizarRecHumano(codRecHumano: string, body: IRecHumano) {
    return this._http.put<IRecHumanoPostResponseDTO>(
      `${environment.baseUrl}/api/recursoHumano/${codRecHumano}/updateRecHumano`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getTodosPersonalSalud(): Observable<IRecHumano[]> {
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/traerProfesionalesQueAtiendenConsultas`,
      )
      .pipe(
        map((data) => {
          return data.recHumanos;
        }),
      );
  }
}
