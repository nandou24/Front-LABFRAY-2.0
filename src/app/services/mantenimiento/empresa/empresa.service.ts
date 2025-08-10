import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import {
  IEmpresa,
  IEmpresaPostDTO,
  IEmpresaPostReturnDTO,
  IGetEmpresas,
  IGetEmpresaById,
  IEmpresaUpdateDTO,
  IEmpresaDeleteDTO,
} from '../../../models/Mantenimiento/empresa.models';
import { AuthService } from '../../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  constructor() {}

  private readonly _http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/api/empresa`;
  private readonly _auth = inject(AuthService);

  registrarEmpresa(body: IEmpresa): Observable<IEmpresaPostDTO> {
    console.log('Datos de la empresa:', body);

    return this._http.post<IEmpresaPostDTO>(`${this.apiUrl}`, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  getLastEmpresas(cantidad: number): Observable<IEmpresa[]> {
    const params = new HttpParams().set('cant', cantidad);
    return this._http
      .get<IGetEmpresas>(`${this.apiUrl}`, {
        params,
        headers: this._auth.getAuthHeaders(),
      })
      .pipe(
        map((data) => {
          return data.empresas;
        }),
      );
  }

  getEmpresa(terminoBusqueda: any): Observable<IEmpresa[]> {
    const params = new HttpParams().set('termino', terminoBusqueda);
    return this._http
      .get<IGetEmpresas>(`${this.apiUrl}/findTerm`, {
        params,
      })
      .pipe(map((data) => data.empresas));
  }

  getEmpresaById(id: any): Observable<IEmpresa> {
    const params = new HttpParams().set('search', id);
    return this._http
      .get<IGetEmpresaById>(`${this.apiUrl}/findTermById`, {
        params,
      })
      .pipe(map((data) => data.empresa));
  }

  public actualizarEmpresa(body: IEmpresa): Observable<IEmpresaUpdateDTO> {
    console.log('Datos de la empresa a actualizar:', body);
    return this._http.put<IEmpresaUpdateDTO>(`${this.apiUrl}`, body, {
      headers: this._auth.getAuthHeaders(),
    });
  }

  public eliminarEmpresa(id: string): Observable<IEmpresaDeleteDTO> {
    return this._http.delete<IEmpresaDeleteDTO>(
      `${this.apiUrl}/deleteEmpresa/${id}`,
      { headers: this._auth.getAuthHeaders() },
    );
  }
}
