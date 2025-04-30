import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IGetLastPruebasLab, IPruebaLab, IPruebaLabPostDTO } from '../../../models/pruebaLab.models';
import { environment } from '../../../../../environments/enviroment';
import { catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PruebaLabService {

  constructor(
    private _http: HttpClient
  ) { }

  public registrarPruebaLab(body: IPruebaLab){
    console.log("Enviando valores desde servicio")
    
    return this._http
      .post<IPruebaLabPostDTO>(
        `${environment.baseUrl}/api/pruebaLab/newPruebaLab`,body
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

  getLastPruebasLab(): Observable<IPruebaLab[]> {
      return this._http
        .get<IGetLastPruebasLab>(
          `${environment.baseUrl}/api/pruebaLab/last30`
        )
        .pipe(map((data) => {
          return data.pruebasLab;
        }));        
  }

  getPruebaLab(terminoBusqueda : any): Observable<IPruebaLab[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastPruebasLab>(
        `${environment.baseUrl}/api/pruebaLab/findTerm`,{params}
      )
      .pipe(map((data) => data.pruebasLab));
  }
  
    
  public actualizarPruebaLab(codPruebaLab: string, body: IPruebaLab){
    
    console.log(body)
    return this._http
      .put<IPruebaLabPostDTO>(
        `${environment.baseUrl}/api/pruebaLab/${codPruebaLab}/updatePrueba`,body
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
