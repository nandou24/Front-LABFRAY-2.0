import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IRefMedico, IRefMedicoPostDTO, IGetLastRefMedico } from '../../../models/referenciaMedico.models';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ReferenciaMedicoService {

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) { }

  public registrarRefMedico(body: IRefMedico){
    return this._http
      .post<IRefMedicoPostDTO>(
        `${environment.baseUrl}/api/referenciaMedico/newRefMedico`,body
      )
  }

  getLastRefMedicos(cantidad:number): Observable<IRefMedico[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastRefMedico>(
        `${environment.baseUrl}/api/referenciaMedico/latest`,{params}
      )
      .pipe(map((data) => {
        return data.refMedicos;
      })); 
  }

  getRefMedico(terminoBusqueda : any): Observable<IRefMedico[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastRefMedico>(
        `${environment.baseUrl}/api/referenciaMedico/findTerm`,{params}
      )
      .pipe(map((data) => data.refMedicos));
  }

  public actualizarRefMedico(codRefMedico: string, body: IRefMedico){
    return this._http
      .put<IRefMedicoPostDTO>(
        `${environment.baseUrl}/api/referenciaMedico/${codRefMedico}/updateRefMedico`,body
      )
  }
}
