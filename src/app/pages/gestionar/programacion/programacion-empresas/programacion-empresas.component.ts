import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import {
  EstadoProgramacion,
  IProgramacionEmpresa,
} from '../../../../models/Gestion/programacionEmpresa.models';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DialogCrearProgramacionEmpresaComponent } from './dialogs/dialog-crear-programacion-empresa/dialog-crear-programacion-empresa.component';
import { DialogIniciarAtencionEmpresaComponent } from './dialogs/dialog-iniciar-atencion-empresa/dialog-iniciar-atencion-empresa.component';
import { DialogRegularizarDocumentoEmpresaComponent } from './dialogs/dialog-regularizar-documento-empresa/dialog-regularizar-documento-empresa.component';
import { DialogImportarProgramacionesEmpresaComponent } from './dialogs/dialog-importar-programaciones-empresa/dialog-importar-programaciones-empresa.component';
import { DialogCoincidenciasVinculacionComponent } from './dialogs/dialog-coincidencias-vinculacion/dialog-coincidencias-vinculacion.component';
import { DialogHistorialVinculacionComponent } from './dialogs/dialog-historial-vinculacion/dialog-historial-vinculacion.component';
import { ProgramacionEmpresaService } from '../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';
import { FotoPacienteMiniaturaComponent } from '../../../../shared/components/foto-paciente-miniatura/foto-paciente-miniatura.component';

// ====== Fechas dd/MM/yyyy solo en Programaciones de Empresas ======
const FORMATOS_FECHA_PROGRAMACION: MatDateFormats = {
  parse: { dateInput: null },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

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
    MatSortModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FotoPacienteMiniaturaComponent,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_FECHA_PROGRAMACION },
  ],
  templateUrl: './programacion-empresas.component.html',
  styleUrl: './programacion-empresas.component.scss',
})
export class ProgramacionEmpresasComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatSort) private sort!: MatSort;
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
    this._adapter.setLocale('es-PE');

    this.dataSourceProgramacion.filterPredicate = (row, filtro) =>
      [
        row.codProgramacion,
        row.nroDoc,
        row.tipoDoc,
        row.apePatCliente,
        row.apeMatCliente,
        row.nombreCliente,
        row.razonSocialEmpresa,
        row.sede,
        row.tipoEvaluacion,
        row.tipoAtencion,
        row.prioridad,
        row.estadoProgramacion,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(filtro);

    this.buscarProgramacionesDelDia();
  }

  ngAfterViewInit(): void {
    // ====== Conectar paginación y ordenación ======
    this.dataSourceProgramacion.paginator = this.paginator;
    this.dataSourceProgramacion.sortingDataAccessor = (row, columna) => {
      // ====== Ordenar códigos por año y correlativo ======
      if (columna === 'codProgramacion') {
        const partes = /^PPE-(\d{4})-(\d+)$/i.exec(row.codProgramacion ?? '');
        return partes
          ? Number(partes[1]) * 1_000_000 + Number(partes[2])
          : (row.codProgramacion ?? '').toLocaleLowerCase();
      }

      if (columna === 'fechaProgramacion') {
        return new Date(String(row.fechaProgramada)).getTime();
      }

      const campos: Record<string, string> = {
        codProgramacion: row.codProgramacion ?? '',
        nombreCompleto: `${row.apePatCliente} ${row.apeMatCliente ?? ''} ${row.nombreCliente}`,
        empresa: row.razonSocialEmpresa,
        sede: row.sede ?? '',
        tipoEvaluacion: row.tipoEvaluacion ?? '',
        tipoAtencion: row.tipoAtencion ?? '',
        prioridad: row.prioridad ?? '',
        estado: row.estadoProgramacion,
      };

      return (campos[columna] ?? '').toLocaleLowerCase();
    };

    // ====== Mostrar primero la programación de mayor código ======
    this.dataSourceProgramacion.sort = this.sort;
    // ====== Orden inicial configurado en matSort del HTML ======
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
    'sede',
    'tipoEvaluacion',
    'tipoAtencion',
    'prioridad',
    'estado',
    'acciones',
  ];
  columnasTablaProgramacionWithExpand = [
    ...this.columnasTablaProgramacion,
    'expand',
  ];
  dataSourceProgramacion = new MatTableDataSource<IProgramacionEmpresa>();
  expandedProgramacion: IProgramacionEmpresa | null = null;
  private readonly estadosNoEditables: EstadoProgramacion[] = [
    'CANCELADO',
    'EN ATENCION',
    'ATENDIDO',
  ];

  // ====== Fila expandible ======
  isExpandedProgramacion(element: IProgramacionEmpresa) {
    return this.expandedProgramacion === element;
  }


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
    return (
      estadoNormalizado !== 'ATENDIDO' && estadoNormalizado !== 'CANCELADO'
    );
  }

  // ====== Resolver primera vinculación desde un diálogo de comparación ======
  revisarVinculacion(programacion: IProgramacionEmpresa): void {
    if (!programacion._id) return;
    const dialogRef = this.dialog.open(DialogCoincidenciasVinculacionComponent, {
      width: '98vw', maxWidth: '1400px', maxHeight: '94vh',
      autoFocus: false,
      data: { programacion },
    });
    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado?.revisionRegistrada) {
        void Swal.fire({
          toast: true, position: 'top-end', icon: 'info',
          title: 'Decisión de identidad registrada',
          text: resultado.mensaje || 'La programación continúa sin HC vinculada.',
          timer: 3600, timerProgressBar: true, showConfirmButton: false,
        });
        this.buscarProgramacion();
      }
      if (resultado?.ok) {
        // ====== Notificación lateral igual a Toma de Muestras ======
        void Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Historia clínica vinculada',
          text: 'Primera vinculación registrada en el historial.',
          timer: 2800,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        this.buscarProgramacion();
      }
    });
  }

  // ====== Historial auditable de la programación ======
  verHistorialVinculacion(programacion: IProgramacionEmpresa): void {
    if (!programacion._id) return;
    this.dialog.open(DialogHistorialVinculacionComponent, {
      width: '94vw',
      maxWidth: '900px',
      maxHeight: '90vh',
      autoFocus: false,
      data: { programacion },
    });
  }

  editarProgramacion(element: IProgramacionEmpresa) {
    if (this.estadosNoEditables.includes(element.estadoProgramacion)) {
      this.snackBar.open(
        `La programación en estado ${element.estadoProgramacion} no se puede editar.`,
        'Cerrar',
        { duration: 3500 },
      );
      return;
    }

    const modo = this.puedeEditarProgramacion(element.estadoProgramacion)
      ? 'edit'
      : 'view';

    const dialogRef = this.dialog.open(
      DialogCrearProgramacionEmpresaComponent,
      {
        width: '95vw',
        maxWidth: '1500px',
        height: 'auto',
        maxHeight: '92vh',
        data: {
          programacion: element,
          mode: modo,
        },
      },
    );

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado?.ok) {
        return;
      }

      const programacionActualizada =
        resultado.programacion as IProgramacionEmpresa;
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

  // ====== Importación Excel: recargar la bandeja tras registrar ======
  abrirImportacionExcel(): void {
    const dialogRef = this.dialog.open(DialogImportarProgramacionesEmpresaComponent, {
      width: '96vw',
      maxWidth: '1400px',
      maxHeight: '93vh',
      autoFocus: false,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.importadas) this.buscarProgramacion();
    });
  }

  // ====== Regularizar o corregir identidad con auditoría ======
  regularizarDocumento(element: IProgramacionEmpresa): void {
    if (!element.pacienteId || !element.accionDocumentoPaciente) {
      this.snackBar.open('La programación no tiene una historia clínica vinculada.', 'Cerrar', { duration: 3500 });
      return;
    }

    const esCorreccion = element.accionDocumentoPaciente === 'CORREGIR';
    const dialogRef = this.dialog.open(DialogRegularizarDocumentoEmpresaComponent, {
      width: '92vw', maxWidth: '640px', maxHeight: '90vh',
      data: { programacion: element },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado?.ok || !resultado.programacion) return;
      const actual = resultado.programacion as IProgramacionEmpresa;
      this.dataSourceProgramacion.data = this.dataSourceProgramacion.data.map((item) =>
        item.pacienteId && item.pacienteId === actual.pacienteId
          ? {
              ...item,
              tipoDoc: actual.tipoDoc,
              nroDoc: actual.nroDoc,
              accionDocumentoPaciente: actual.accionDocumentoPaciente,
            }
          : item,
      );
      this.buscarProgramacion();
      this.snackBar.open(
        esCorreccion
          ? 'Documento corregido con autorización y auditoría.'
          : 'Documento actualizado. La identificación sigue PENDIENTE de validación.',
        'Cerrar', { duration: 4500 },
      );
    });
  }

  iniciarAtencion(element: IProgramacionEmpresa) {
    if (element.estadoProgramacion === 'CANCELADO') {
      this.snackBar.open(
        'No se puede iniciar una programación cancelada.',
        'Cerrar',
        { duration: 3500 },
      );
      return;
    }

    // ==========================================
    // ABRIR DIÁLOGO DE INICIO DE ATENCIÓN
    // ==========================================

    const dialogRef = this.dialog.open(DialogIniciarAtencionEmpresaComponent, {
      width: '95vw',
      maxWidth: '1400px',
      maxHeight: '92vh',

      data: {
        programacion: element,
      },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (!resultado?.ok) {
        return;
      }

      const programacionActualizada =
        resultado.programacion as IProgramacionEmpresa;

      if (!programacionActualizada?._id) {
        return;
      }

      this.dataSourceProgramacion.data = this.dataSourceProgramacion.data.map(
        (item) =>
          item._id === programacionActualizada._id
            ? programacionActualizada
            : item,
      );
    });
  }

  anularProgramacion(element: IProgramacionEmpresa) {
    if (!element._id) {
      this.snackBar.open(
        'No se pudo identificar la programación a anular.',
        'Cerrar',
        { duration: 3000 },
      );
      return;
    }

    if (element.estadoProgramacion !== 'PROGRAMADO') {
      this.snackBar.open(
        'Solo se puede cancelar una programación en estado PROGRAMADO.',
        'Cerrar',
        { duration: 3500 },
      );

      return;
    }

    Swal.fire({
      title: '¿Cancelar programación?',
      text: 'Esta acción cambiará el estado a CANCELADO.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this._programacionService
        .actualizarEstadoProgramacion(element._id!, 'CANCELADO')
        .pipe(
          catchError((error) => {
            const mensaje =
              error?.error?.msg ||
              'No se pudo anular la programación. Intenta nuevamente.';

            Swal.fire({
              title: 'Error',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Ok',
            });

            return of(null);
          }),
        )
        .subscribe((resp) => {
          if (!resp?.ok) {
            return;
          }

          const programacionActualizada =
            resp.programacion as IProgramacionEmpresa;

          this.dataSourceProgramacion.data =
            this.dataSourceProgramacion.data.map((item) =>
              item._id === programacionActualizada._id
                ? programacionActualizada
                : item,
            );

          this.snackBar.open(
            'Programación cancelada correctamente.',
            'Cerrar',
            {
              duration: 3000,
            },
          );
        });
    });
  }

  marcarNoAsistio(element: IProgramacionEmpresa) {
    if (!element._id) {
      this.snackBar.open('No se pudo identificar la programación.', 'Cerrar', {
        duration: 3000,
      });

      return;
    }

    // ==========================================
    // VALIDAR ESTADO
    // ==========================================

    if (element.estadoProgramacion !== 'PROGRAMADO') {
      this.snackBar.open(
        'Solo se puede marcar como no asistió una programación en estado PROGRAMADO.',
        'Cerrar',
        { duration: 3500 },
      );

      return;
    }

    // ==========================================
    // CONFIRMACIÓN
    // ==========================================

    Swal.fire({
      title: '¿Marcar como no asistió?',
      text: 'Se registrará que el paciente no asistió a esta programación.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'No',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      // ==========================================
      // ACTUALIZAR ESTADO
      // ==========================================

      this._programacionService
        .actualizarEstadoProgramacion(element._id!, 'NO ASISTIO')
        .pipe(
          catchError((error) => {
            const mensaje =
              error?.error?.msg ||
              'No se pudo marcar la programación como no asistió.';

            Swal.fire({
              title: 'Error',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Ok',
            });

            return of(null);
          }),
        )
        .subscribe((resp) => {
          if (!resp?.ok) {
            return;
          }

          const programacionActualizada =
            resp.programacion as IProgramacionEmpresa;

          // ======================================
          // ACTUALIZAR DATASOURCE
          // ======================================

          this.dataSourceProgramacion.data =
            this.dataSourceProgramacion.data.map((item) =>
              item._id === programacionActualizada._id
                ? programacionActualizada
                : item,
            );

          this.snackBar.open(
            'Programación marcada como no asistió.',
            'Cerrar',
            { duration: 3000 },
          );
        });
    });
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
