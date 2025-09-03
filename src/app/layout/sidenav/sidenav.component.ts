import { CommonModule } from '@angular/common';
import { Component, inject, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth/auth.service';
import Swal from 'sweetalert2';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-sidenav',
  imports: [
    CommonModule,
    MatIconModule,
    MatListModule,
    RouterModule,
    MatButtonModule,
    MatSidenavModule,
    MatMenuModule,
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
})
export class SidenavComponent {
  @Output() closeSidenav = new EventEmitter<void>();

  private _authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const payload = this._authService.obtenerDatosDesdeToken();
    this.nombreUsuario = payload?.nombreUsuario || '';
    this.rol = payload?.rol || '';
    this.rutasPermitidas = payload?.rutasPermitidas || [];
  }

  nombreUsuario: string = '';
  rol: string = '';
  public rutasPermitidas: any[] = [];

  onMenuItemClick() {
    // Emitir evento para cerrar el sidenav al hacer click en cualquier opción del menú
    this.closeSidenav.emit();
  }

  validarToken() {
    if (this._authService.isTokenExpirado()) {
      // Token expirado: redirigir o cerrar sesión
      Swal.fire(
        'Sesión expirada',
        'Por favor inicia sesión nuevamente',
        'info',
      );
      this.router.navigateByUrl('/auth');
      return;
    }
  }

  cerrarSesion() {
    this._authService.logout();
    this.router.navigateByUrl('/auth');
  }
}
