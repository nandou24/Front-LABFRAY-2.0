import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-no-authorized',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './no-authorized.component.html',
  styleUrl: './no-authorized.component.scss',
})
export class NoAuthorizedComponent {
  private router = inject(Router);
  private _authService = inject(AuthService);

  ngOnInit(): void {
    // Desloguear al mostrar el componente
    this._authService.logout();
  }

  volver() {
    this.router.navigateByUrl('/auth'); // Puedes cambiar a tu página principal
  }
}
