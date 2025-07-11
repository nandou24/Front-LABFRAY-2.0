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
    console.log('Enviando valores desde registro recurso humano');

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

  getPersonalSaludParaConsultas(params: {
    especialidad?: string;
    profesion?: string;
  }): Observable<IRecHumano[]> {
    let httpParams = new HttpParams();

    if (params.especialidad) {
      httpParams = httpParams.set('especialidad', params.especialidad);
    } else if (params.profesion) {
      httpParams = httpParams.set('profesion', params.profesion);
    }

    return this._http
      .get<IGetPersonalSaludParaConsultas>(
        `${environment.baseUrl}/api/recursoHumano/findPersonalSaludParaConsultas`,
        { params: httpParams },
      )
      .pipe(map((data) => data.recHumanos));
  }
}
