import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-atenciones-empresas',
  imports: [MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './atenciones-empresas.component.html',
  styleUrl: './atenciones-empresas.component.scss',
})
export class AtencionesEmpresasComponent {
  abrirFormularioProgramacion(): void {
    console.log('Abrir formulario de nueva programación');
    // TODO: Implementar apertura de diálogo o navegación al formulario
  }
}
