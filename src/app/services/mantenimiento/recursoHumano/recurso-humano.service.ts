import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  IGetLastRecHumano,
  IGetPersonalSaludParaConsultas,
  IPersonalSaludParaConsultas,
  IRecHumano,
  IRecHumanoPostResponseDTO,
} from '../../../models/Mantenimiento/recursoHumano.models';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/enviroment';

@Injectable({
  providedIn: 'root',
})
export class RecursoHumanoService {
  constructor(
    private _http: HttpClient,
    private _router: Router,
  ) {}

  public registrarRecHumano(body: IRecHumano) {
    console.log('Enviando valores desde registro recurso humano', body);

    return this._http.post<IRecHumanoPostResponseDTO>(
      `${environment.baseUrl}/api/recursoHumano/newRecHumano`,
      body,
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
    );
  }

  getTodosPersonalSalud(): Observable<IRecHumano[]> {
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/traerProfesionalesQueAtiendenConsultas`,
      )
      .pipe(
        map((data) => {
          console.log('Recursos humanos obtenidos service:', data);
          return data.recHumanos;
        }),
      );
  }
}
