import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IGetLastRecHumano, IRecHumano, IRecHumanoPostDTO } from '../../../models/recursoHumano.models';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class RecursoHumanoService {

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) { }

  public registrarRecHumano(body: IRecHumano){
    console.log("Enviando valores desde registro recurso humano")
    
    return this._http
      .post<IRecHumanoPostDTO>(
        `${environment.baseUrl}/api/recursoHumano/newRecHumano`,body
      )

  }

  getLastRecHumanos(cantidad:number): Observable<IRecHumano[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/latest`,{params}
      )
      .pipe(map((data) => {
        return data.recHumanos;
      })); 
  }

  getRecursosSolicitantes(cantidad:number): Observable<IRecHumano[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastRecHumano>(
      `${environment.baseUrl}/api/recursoHumano/latestSolicitantes`,{params}
      )
      .pipe(map((data) => {
        return data.recHumanos;
      })); ;
      
  }

  getRecHumano(terminoBusqueda : any): Observable<IRecHumano[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/findTerm`,{params}
      )
      .pipe(map((data) => data.recHumanos));
  }

  getSolicitante(terminoBusqueda : any): Observable<IRecHumano[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastRecHumano>(
        `${environment.baseUrl}/api/recursoHumano/findTermSolicitante`,{params}
      )
      .pipe(map((data) => data.recHumanos));
  }

  
  public actualizarRecHumano(codRecHumano: string, body: IRecHumano){
    
    return this._http
      .put<IRecHumanoPostDTO>(
        `${environment.baseUrl}/api/recursoHumano/${codRecHumano}/updateRecHumano`,body
      )
      .pipe(
        map((data) => {
          if (data.ok) {
            return data.ok;
          } else {
            throw new Error('ERROR');
          }
        }),
        catchError((err) => {
          console.log(err.error.msg);
          Swal.fire({
            title: 'ERROR!',
            text: err.error.msg,
            icon: 'error',
            confirmButtonText: 'Ok',
          });
          return of('ERROR');
        })
      );
  }
}
