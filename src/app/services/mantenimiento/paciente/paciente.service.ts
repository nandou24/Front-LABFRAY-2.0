import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/enviroment';
import {
  IGetLastPatients,
  IGetPatientbyId,
  IPaciente,
  IPacientePostDTO,
  IPacientePostReturnDTO,
} from '../../../models/Mantenimiento/paciente.models';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PacienteService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/paciente`;
  private readonly _auth = inject(AuthService);

  registrarPaciente(body: IPaciente): Observable<IPacientePostDTO> {
    console.log('Datos del paciente:', body);

    return this._http.post<IPacientePostDTO>(
      `${this.apiUrl}/newPaciente`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  getLastPatients(cantidad: number): Observable<IPaciente[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastPatients>(`${this.apiUrl}/latest`, { params })
      .pipe(
        map((data) => {
          return data.pacientes;
        }),
      );
  }

  getPatient(terminoBusqueda: any): Observable<IPaciente[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastPatients>(`${this.apiUrl}/findTerm`, {
        params,
      })
      .pipe(map((data) => data.pacientes));
  }

  getPatientbyId(id: any): Observable<IPaciente> {
    const params = new HttpParams().set('search', id);
    return this._http
      .get<IGetPatientbyId>(`${this.apiUrl}/findTermById`, {
        params,
      })
      .pipe(map((data) => data.paciente));
  }

  getLastPatientsCotizacion(cantidad: number): Observable<IPaciente[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetLastPatients>(`${this.apiUrl}/latestCotizacion`, { params })
      .pipe(
        map((data) => {
          return data.pacientes;
        }),
      );
  }

  getPatientCotizacion(terminoBusqueda: any): Observable<IPaciente[]> {
    const params = new HttpParams().set('search', terminoBusqueda);
    return this._http
      .get<IGetLastPatients>(`${this.apiUrl}/findTermCotizacion`, { params })
      .pipe(map((data) => data.pacientes));
  }

  public actualizarPaciente(body: IPaciente) {
    return this._http.put<IPacientePostDTO>(
      `${this.apiUrl}/updatePatient`,
      body,
      { headers: this._auth.getAuthHeaders() },
    );
  }

  registrarPacienteDesdeCotizacion(pacienteData: any): Observable<any> {
    return this._http.post<IPacientePostReturnDTO>(
      `${this.apiUrl}/newPatientWhitoutHC`,
      pacienteData,
    );
  }
}
