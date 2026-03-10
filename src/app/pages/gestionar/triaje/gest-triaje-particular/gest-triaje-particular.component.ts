import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ISolicitudAtencion } from '../../../../models/Gestion/solicitudAtencion.models';

@Component({
  selector: 'app-gest-triaje-particular',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    CommonModule,
  ],
  templateUrl: './gest-triaje-particular.component.html',
  styleUrl: './gest-triaje-particular.component.scss',
})
export class GestTriajeParticularComponent {
  private _fb = inject(FormBuilder);

  public myFormTriaje: FormGroup = this._fb.group({
    colegiatura: [{ value: '', disabled: true }],
  });

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  dataSourceAtenciones = new MatTableDataSource<ISolicitudAtencion>();
  terminoBusquedaPaciente = new FormControl('');
  filaSeleccionadaIndexAtencion: number | null = null;

  columnasTablaSolicitudes: string[] = [
    'solicitudId',
    'fechaEmision',
    'nombreCompleto',
    'tipo',
    'estado',
  ];

  cargarAtencion(cotizacion: ISolicitudAtencion, index: number) {}
}
