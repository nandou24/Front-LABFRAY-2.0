import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { IProgramacionEmpresa } from '../../../../models/Gestion/programacionEmpresa,models';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-programacion-empresas',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
    MatPaginatorModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './programacion-empresas.component.html',
  styleUrl: './programacion-empresas.component.scss',
})
export class ProgramacionEmpresasComponent {
  private _fb = inject(FormBuilder);
  //private _solicitudService = inject(SolicitudAtencionService);
  //private _servicioService = inject(ServiciosService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  myGroupBusqueda = new FormGroup({
    terminoBusqueda: new FormControl(),
    fechaInicio: new FormControl(new Date()),
    fechaFin: new FormControl(new Date()),
    filtroBusqueda: new FormControl(),
  });

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  columnasTablaProgramacion: string[] = [
    'codProgramacion',
    'fechaProgramacion',
    'nombreCompleto',
    'empresa',
    'protocolo',
    'estado',
    'acciones',
  ];
  columnasTablaProgramacionWithExpand = [
    ...this.columnasTablaProgramacion,
    'expand',
  ];
  dataSourceProgramacion = new MatTableDataSource<IProgramacionEmpresa>();
  expandedProgramacion: IProgramacionEmpresa | null = null;

  /** Checks whether an element is expanded. */
  isExpandedProgramacion(element: IProgramacionEmpresa) {
    return this.expandedProgramacion === element;
  }

  /** Toggles the expanded state of an element. */
  toggleProgramacion(element: IProgramacionEmpresa) {
    this.expandedProgramacion = this.isExpandedProgramacion(element)
      ? null
      : element;
  }

  filtrar(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceProgramacion.filter = termino.trim().toLowerCase();
  }

  editarProgramacion(element: IProgramacionEmpresa) {
    console.log('Editar programación:', element);
    // Aquí puedes abrir un diálogo o navegar a otra página para editar la programación
  }

  iniciarProgramacion(element: IProgramacionEmpresa) {
    console.log('Iniciar programación:', element);
    // Aquí puedes abrir un diálogo o navegar a otra página para iniciar la programación
  }

  anularProgramacion(element: IProgramacionEmpresa) {
    console.log('Anular programación:', element);
    // Aquí puedes abrir un diálogo o navegar a otra página para anular la programación
  }

  buscarProgramacion() {
    const termino = this.myGroupBusqueda.get('terminoBusqueda')?.value || '';
    const fechaInicioControl =
      this.myGroupBusqueda.get('fechaInicio')?.value || new Date();
    const fechaFinControl =
      this.myGroupBusqueda.get('fechaFin')?.value || new Date();

    //console.log('Fecha Inicio:', fechaInicioControl);
    // console.log('Fecha Fin:', fechaFinControl);

    const inicio = new Date(fechaInicioControl);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFinControl);
    fin.setHours(23, 59, 59, 999);

    // console.log('Inicio:', inicio);
    // console.log('Fin:', fin);

    // console.log('Término despues:', fechaInicioControl, fechaFinControl);

    // this._solicitudService
    //   .getAllByDateRange(inicio.toISOString(), fin.toISOString(), termino)
    //   .subscribe({
    //     next: (solicitudes) => {
    //       this.dataSourceProgramacion.data = solicitudes;
    //       console.log('Solicitudes encontradas:', solicitudes);
    //       this.snackBar.open(
    //         `Se encontraron ${solicitudes.length} solicitudes`,
    //         'Cerrar',
    //         { duration: 3000 },
    //       );
    //     },
    //     error: (err) => {
    //       console.error('Error al buscar solicitudes:', err);
    //       this.snackBar.open('Error al buscar solicitudes', 'Cerrar', {
    //         duration: 3000,
    //       });
    //     },
    //   });
  }
}
