import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ILoginResponse } from '../../models/login.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private _http: HttpClient,
    private _router: Router,
  ) {}

  public login(
    nombreUsuario: string,
    password: string,
  ): Observable<ILoginResponse> {
    return this._http.post<ILoginResponse>(
      `${environment.baseUrl}/api/auth/login`,
      { nombreUsuario, password },
    );
  }

  public returnToLogin() {
    this._router.navigateByUrl('/auth/login');
  }

  public goToPages() {
    this._router.navigateByUrl('/pages/characteres');
  }

  guardarToken(token: string) {
    localStorage.setItem('token', token);

    const payload: any = this.decodeToken(token);
    if (payload?.rutas) {
      localStorage.setItem('rutasPermitidas', JSON.stringify(payload.rutas));
    }
  }

  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Token inválido', error);
      return null;
    }
  }

  // obtenerRutasDesdeToken(): any[] {
  //   const token = this.obtenerToken();
  //   if (!token) return [];

  //   try {
  //     const decoded: any = jwtDecode(token);
  //     return decoded.rutasPermitidas || []; // Asegúrate de que en el backend se guarden rutas completas, no solo los _id
  //   } catch (e) {
  //     console.error('Error al decodificar el token:', e);
  //     return [];
  //   }
  // }
  obtenerRutasPermitidas(): any[] {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
      const decoded: any = jwtDecode(token);
      return decoded.rutasPermitidas || [];
    } catch (error) {
      console.error('Token inválido', error);
      return [];
    }
  }

  obtenerDatosDesdeToken(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (e) {
      console.error('Token inválido', e);
      return null;
    }
  }

  getToken(): string {
    return localStorage.getItem('token') || '';
  }

  getAuthHeaders(): { [header: string]: string } {
    return {
      'x-token': this.getToken(),
    };
  }

  tokenValido(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now().valueOf() / 1000;
      return decoded.exp > now;
    } catch (error) {
      console.error('Token inválido', error);
      return false;
    }
  }

  logout() {
    localStorage.removeItem('token');
  }

  isTokenExpirado(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp;

      // Obtener el tiempo actual en segundos
      const ahora = Math.floor(Date.now() / 1000);

      return exp < ahora;
    } catch (error) {
      console.error('Token inválido:', error);
      return true;
    }
  }
}
