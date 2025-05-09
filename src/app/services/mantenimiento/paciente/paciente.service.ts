import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/enviroment';
import { IGetLastPatients, IPaciente, IPacientePostDTO } from '../../../models/paciente.mdoles';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  constructor(
    private readonly _http: HttpClient,
    private _router: Router
  ) { }

  private readonly apiUrl = `${environment.baseUrl}/api/paciente`;

  public registrarPaciente(body: IPaciente){
    console.log("Enviando valores desde servicio")
    
    return this._http
      .post<IPacientePostDTO>(
        `${environment.baseUrl}/api/paciente/newPaciente`,body
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

  getLastPatients(cantidad:number): Observable<IPaciente[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastPatients>(
        `${this.apiUrl}/latest`,{params}
      )
      .pipe(map((data) => {
        return data.pacientes;
      }));
      
      // .pipe(
      //   map(res => res.pacientes),
      //   catchError(err => {
      //     console.error('Error al obtener pacientes:', err);
      //     return of([]); // o throwError si prefieres propagarlo
      //   })
  }

  getLastPatientsCotizacion(cantidad:number): Observable<IPaciente[]> {
    const params = new HttpParams().set('cant',cantidad) 
    return this._http
      .get<IGetLastPatients>(
        `${environment.baseUrl}/api/paciente/latestCotizacion`,{params}
      )
      .pipe(map((data) => {
        return data.pacientes;
      }));        
  }

  getPatient(terminoBusqueda : any): Observable<IPaciente[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastPatients>(
        `${environment.baseUrl}/api/paciente/findTerm`,{params}
      )
      .pipe(map((data) => data.pacientes));
  }

  getPatientCotizacion(terminoBusqueda : any): Observable<IPaciente[]> {
    const params = new HttpParams().set('search',terminoBusqueda)
    return this._http
      .get<IGetLastPatients>(
        `${environment.baseUrl}/api/paciente/findTermCotizacion`,{params}
      )
      .pipe(map((data) => data.pacientes));
  }
  
  public actualizarPaciente(nroHC: string, body: IPaciente){
    
    return this._http
      .put<IPacientePostDTO>(
        `${environment.baseUrl}/api/paciente/${nroHC}/updatePatient`,body
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
