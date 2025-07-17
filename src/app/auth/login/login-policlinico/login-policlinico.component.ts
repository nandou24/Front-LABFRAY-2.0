import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login-policlinico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './login-policlinico.component.html',
  styleUrl: './login-policlinico.component.scss',
})
export class LoginPoliclinicoComponent {
  private _fb = inject(FormBuilder);
  private _authService = inject(AuthService);
  private router = inject(Router);

  public formLogin: FormGroup = this._fb.group({
    nombreUsuario: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  hidePassword = true;

  login() {
    if (this.formLogin.invalid) {
      this.formLogin.markAllAsTouched();
      return;
    }

    const { nombreUsuario, password } = this.formLogin.value;

    this._authService.login(nombreUsuario, password).subscribe({
      next: (resp) => {
        if (resp.ok && resp.token) {
          this._authService.guardarToken(resp.token);
          Swal.fire({
            icon: 'success',
            title: 'Bienvenido ' + resp.user?.nombreUsuario || '',
            timer: 1500,
            showConfirmButton: false,
          });
          this.router.navigateByUrl('/pages/cotiPersona');
        } else {
          Swal.fire('Error', resp.msg || 'Credenciales incorrectas', 'error');
        }
      },
      error: (err) => {
        Swal.fire('Error', err.error?.msg || 'Error en el servidor', 'error');
      },
    });
  }
}
