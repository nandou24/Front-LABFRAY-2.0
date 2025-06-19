import { Injectable } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { Observable } from 'rxjs';
import { ILoginResponse } from '../../models/login.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private _http: HttpClient,
    private _router: Router
  ) { }


  public login(correoLogin: string, password: string): Observable<ILoginResponse> {
   
    return this._http.post<ILoginResponse>(
          `${environment.baseUrl}/api/auth/login`,
          { correoLogin, password }
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
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

}
