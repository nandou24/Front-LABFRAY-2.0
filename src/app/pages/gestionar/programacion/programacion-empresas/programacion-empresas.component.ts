import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { IProgramacionEmpresa } from '../../../../models/Gestion/programacionEmpresa.models';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogCrearProgramacionEmpresaComponent } from './dialogs/dialog-crear-programacion-empresa/dialog-crear-programacion-empresa.component';
import { ProgramacionEmpresaService } from '../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { catchError, of } from 'rxjs';
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
export class ProgramacionEmpresasComponent implements OnInit {
  private _fb = inject(FormBuilder);
  //private _solicitudService = inject(SolicitudAtencionService);
  //private _servicioService = inject(ServiciosService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private _programacionService = inject(ProgramacionEmpresaService);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  myGroupBusqueda = new FormGroup({
    terminoBusqueda: new FormControl(),
    fechaInicio: new FormControl(new Date()),
    fechaFin: new FormControl(new Date()),
    filtroBusqueda: new FormControl(),
  });

  ngOnInit(): void {
    this.buscarProgramacionesDelDia();
  }

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

  puedeEditarProgramacion(estado?: string): boolean {
    const estadoNormalizado = (estado ?? '').trim().toUpperCase();
    return estadoNormalizado !== 'ATENDIDO' && estadoNormalizado !== 'CANCELADO';
  }

  editarProgramacion(element: IProgramacionEmpresa) {
    const modo = this.puedeEditarProgramacion(element.estadoProgramacion)
      ? 'edit'
      : 'view';

    const dialogRef = this.dialog.open(DialogCrearProgramacionEmpresaComponent, {
      width: '95vw',
      maxWidth: '1500px',
      height: 'auto',
      maxHeight: '92vh',
      data: {
        programacion: element,
        mode: modo,
      },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado?.ok) {
        return;
      }

      const programacionActualizada = resultado.programacion as IProgramacionEmpresa;
      this.dataSourceProgramacion.data = this.dataSourceProgramacion.data.map(
        (item) =>
          item._id === programacionActualizada._id
            ? programacionActualizada
            : item,
      );

      this.snackBar.open(
        modo === 'edit'
          ? 'Programación actualizada correctamente'
          : 'Detalles de programación cargados',
        'Cerrar',
        { duration: 3000 },
      );
    });
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

    this._programacionService
      .listarProgramaciones({
        nroDoc: termino,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error al buscar programaciones:', error);
          this.snackBar.open('Error al buscar programaciones', 'Cerrar', {
            duration: 3000,
          });
          return of([] as IProgramacionEmpresa[]);
        }),
      )
      .subscribe((programaciones) => {
        this.dataSourceProgramacion.data = programaciones;
      });
  }

  buscarProgramacionesDelDia() {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setHours(23, 59, 59, 999);

    this.myGroupBusqueda.patchValue({
      fechaInicio: inicio,
      fechaFin: fin,
    });

    this._programacionService
      .listarProgramaciones({
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error al cargar programaciones del día:', error);
          this.snackBar.open(
            'No se pudo cargar la programación del día',
            'Cerrar',
            {
              duration: 3000,
            },
          );
          return of([] as IProgramacionEmpresa[]);
        }),
      )
      .subscribe((programaciones) => {
        this.dataSourceProgramacion.data = programaciones;
      });
  }

  crearProgramacion() {
    const dialogRef = this.dialog.open(
      DialogCrearProgramacionEmpresaComponent,
      {
        width: '95vw',
        maxWidth: '1500px',
        height: 'auto',
        maxHeight: '92vh',
        data: {
          mode: 'create',
        },
      },
    );

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado?.ok) {
        return;
      }

      this.snackBar.open('Programación registrada correctamente', 'Cerrar', {
        duration: 3000,
      });

      const programacionNueva = resultado.programacion as IProgramacionEmpresa;
      this.dataSourceProgramacion.data = [
        programacionNueva,
        ...this.dataSourceProgramacion.data,
      ];
    });
  }
}
