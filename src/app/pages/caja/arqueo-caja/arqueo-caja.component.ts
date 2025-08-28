import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

import {
  IArqueoCaja,
  IDetalleDenominacion,
  IDetalleMovimientoArqueo,
  DENOMINACIONES_PERU,
  IResumenDiario,
} from '../../../models/Caja/arqueo.models';
import { ArqueoCajaService } from '../../../services/caja/arqueo-caja.service';
import { PagosCotizacionPersonalService } from '../../../services/gestion/pagos/pagos-cotizacion-personal.service';
import { ExcelExportService } from '../../../services/utilitarios/excel/excel-export.service';

@Component({
  selector: 'app-arqueo-caja',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
  ],
  templateUrl: './arqueo-caja.component.html',
  styleUrl: './arqueo-caja.component.scss',
})
export class ArqueoCajaComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _arqueoService = inject(ArqueoCajaService);
  private _pagoService = inject(PagosCotizacionPersonalService);
  private _snackBar = inject(MatSnackBar);
  private _dialog = inject(MatDialog);
  private _excelService = inject(ExcelExportService);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  // ViewChild references
  @ViewChild('paginatorArqueos') paginatorArqueos!: MatPaginator;
  @ViewChild('sortArqueos') sortArqueos!: MatSort;
  @ViewChild('paginatorMovimientos') paginatorMovimientos!: MatPaginator;
  @ViewChild('sortMovimientos') sortMovimientos!: MatSort;

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');
    this.initializeForms();
    this.verificarArqueoAbierto();
    this.obtenerResumenDiario();
    this.cargarUltimosArqueos();
  }

  // Estados del componente
  arqueoAbierto: IArqueoCaja | null = null;
  resumenDiario: IResumenDiario | null = null;
  modoEdicion: boolean = false;

  // Formularios
  formArqueo!: FormGroup;
  formBusqueda!: FormGroup;

  // Datos para las tablas
  dataSourceArqueos = new MatTableDataSource<IArqueoCaja>();
  dataSourceMovimientos = new MatTableDataSource<IDetalleMovimientoArqueo>();

  // Columnas de las tablas
  columnasArqueos: string[] = [
    'codArqueo',
    'fecha',
    'turno',
    'usuario',
    'montoSistema',
    'montoCierre',
    'diferencia',
    'estado',
    'acciones',
  ];

  columnasMovimientos: string[] = [
    'codPago',
    'codCotizacion',
    'fechaPago',
    'nombreCompleto',
    'documento',
    'montoEfectivo',
    'usuario',
  ];

  // Opciones para los selects
  turnos = [
    { value: 'MAÑANA', label: 'Mañana' },
    { value: 'TARDE', label: 'Tarde' },
    { value: 'NOCHE', label: 'Noche' },
  ];

  sedes = [
    { value: 'SEDE_PRINCIPAL', label: 'Sede Principal' },
    { value: 'SEDE_SECUNDARIA', label: 'Sede Secundaria' },
  ];

  private initializeForms(): void {
    // Formulario principal de arqueo
    this.formArqueo = this._fb.group({
      fecha: [new Date(), Validators.required],
      turno: ['MAÑANA', Validators.required],
      sede: ['SEDE_PRINCIPAL', Validators.required],
      montoApertura: [0, [Validators.required, Validators.min(0)]],
      montoCierre: [{ value: 0, disabled: true }],
      observaciones: [''],
      denominaciones: this._fb.array(this.crearDenominaciones()),
    });

    // Formulario de búsqueda
    this.formBusqueda = this._fb.group({
      fechaInicio: [new Date()],
      fechaFin: [new Date()],
      sede: [''],
      termino: [''],
    });

    // Calcular monto de cierre automáticamente
    this.denominaciones.valueChanges.subscribe(() => {
      this.calcularMontoCierre();
    });
  }

  private crearDenominaciones(): FormGroup[] {
    return DENOMINACIONES_PERU.map((denominacion) =>
      this._fb.group({
        denominacion: [denominacion.valor],
        tipo: [denominacion.tipo],
        nombre: [denominacion.nombre],
        cantidad: [0, [Validators.min(0)]],
        subtotal: [{ value: 0, disabled: true }],
      }),
    );
  }

  get denominaciones(): FormArray {
    return this.formArqueo.get('denominaciones') as FormArray;
  }

  private calcularMontoCierre(): void {
    const total = this.denominaciones.controls.reduce((sum, control) => {
      const denominacion = control.get('denominacion')?.value || 0;
      const cantidad = control.get('cantidad')?.value || 0;
      const subtotal = denominacion * cantidad;

      // Actualizar subtotal en el control
      control.get('subtotal')?.setValue(subtotal, { emitEvent: false });

      return sum + subtotal;
    }, 0);

    this.formArqueo.get('montoCierre')?.setValue(total, { emitEvent: false });
  }

  private verificarArqueoAbierto(): void {
    this._arqueoService.getArqueoAbierto().subscribe({
      next: (arqueo) => {
        if (arqueo) {
          this.arqueoAbierto = arqueo;
          this.cargarArqueoEnFormulario(arqueo);
          this.modoEdicion = true;
        }
      },
      error: (err) => {
        console.error('Error al verificar arqueo abierto:', err);
      },
    });
  }

  private cargarArqueoEnFormulario(arqueo: IArqueoCaja): void {
    this.formArqueo.patchValue({
      fecha: new Date(arqueo.fecha),
      turno: arqueo.turno,
      sede: arqueo.sede,
      montoApertura: arqueo.montoApertura,
      observaciones: arqueo.observaciones,
    });

    // Cargar denominaciones si existen
    if (
      arqueo.detalleDenominaciones &&
      arqueo.detalleDenominaciones.length > 0
    ) {
      arqueo.detalleDenominaciones.forEach((detalle, index) => {
        if (index < this.denominaciones.length) {
          this.denominaciones.at(index).patchValue({
            cantidad: detalle.cantidad,
          });
        }
      });
    }
  }

  private obtenerResumenDiario(): void {
    const fecha = new Date().toISOString().split('T')[0];
    this._arqueoService.getResumenDiario(fecha).subscribe({
      next: (resumen) => {
        this.resumenDiario = resumen;
      },
      error: (err) => {
        console.error('Error al obtener resumen diario:', err);
      },
    });
  }

  private cargarUltimosArqueos(): void {
    this._arqueoService.getUltimosArqueos(20).subscribe({
      next: (arqueos) => {
        this.dataSourceArqueos.data = arqueos;
        this.dataSourceArqueos.paginator = this.paginatorArqueos;
        this.dataSourceArqueos.sort = this.sortArqueos;
      },
      error: (err) => {
        console.error('Error al cargar arqueos:', err);
      },
    });
  }

  abrirArqueo(): void {
    if (this.formArqueo.invalid) {
      this.formArqueo.markAllAsTouched();
      this._snackBar.open('Complete todos los campos requeridos', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const formData = this.formArqueo.getRawValue();
    const arqueoData = {
      fecha: formData.fecha,
      turno: formData.turno,
      sede: formData.sede,
      montoApertura: formData.montoApertura,
      montoCierre: formData.montoCierre,
      observaciones: formData.observaciones,
      detalleDenominaciones: formData.denominaciones.map((denom: any) => ({
        denominacion: denom.denominacion,
        tipo: denom.tipo,
        cantidad: denom.cantidad,
        subtotal: denom.subtotal,
      })),
    };

    this._arqueoService.crearArqueo(arqueoData).subscribe({
      next: (response) => {
        if (response.ok) {
          this._snackBar.open('Arqueo abierto exitosamente', 'Cerrar', {
            duration: 3000,
          });
          this.arqueoAbierto = response.data!;
          this.modoEdicion = true;
          this.cargarUltimosArqueos();
        }
      },
      error: (err) => {
        console.error('Error al abrir arqueo:', err);
        this._snackBar.open('Error al abrir el arqueo', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  cerrarArqueo(): void {
    if (!this.arqueoAbierto) return;

    Swal.fire({
      title: '¿Cerrar Arqueo?',
      text: 'Esta acción cerrará el arqueo actual. ¿Está seguro?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed && this.arqueoAbierto) {
        const formData = this.formArqueo.getRawValue();
        const arqueoData = {
          fecha: formData.fecha,
          turno: formData.turno,
          sede: formData.sede,
          montoApertura: formData.montoApertura,
          montoCierre: formData.montoCierre,
          observaciones: formData.observaciones,
          detalleDenominaciones: formData.denominaciones.map((denom: any) => ({
            denominacion: denom.denominacion,
            tipo: denom.tipo,
            cantidad: denom.cantidad,
            subtotal: denom.subtotal,
          })),
        };

        this._arqueoService
          .cerrarArqueo(this.arqueoAbierto.codArqueo, arqueoData)
          .subscribe({
            next: (response) => {
              if (response.ok) {
                this._snackBar.open('Arqueo cerrado exitosamente', 'Cerrar', {
                  duration: 3000,
                });
                this.nuevoArqueo();
                this.cargarUltimosArqueos();
              }
            },
            error: (err) => {
              console.error('Error al cerrar arqueo:', err);
              this._snackBar.open('Error al cerrar el arqueo', 'Cerrar', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  nuevoArqueo(): void {
    this.arqueoAbierto = null;
    this.modoEdicion = false;
    this.formArqueo.reset();
    this.formArqueo.patchValue({
      fecha: new Date(),
      turno: 'MAÑANA',
      sede: 'SEDE_PRINCIPAL',
      montoApertura: 0,
    });

    // Resetear denominaciones
    this.denominaciones.controls.forEach((control) => {
      control.patchValue({
        cantidad: 0,
        subtotal: 0,
      });
    });
  }

  buscarArqueos(): void {
    const formData = this.formBusqueda.value;
    const fechaInicio = new Date(formData.fechaInicio);
    fechaInicio.setHours(0, 0, 0, 0);

    const fechaFin = new Date(formData.fechaFin);
    fechaFin.setHours(23, 59, 59, 999);

    this._arqueoService
      .getArqueosByDateRange(
        fechaInicio.toISOString(),
        fechaFin.toISOString(),
        formData.sede,
      )
      .subscribe({
        next: (arqueos) => {
          this.dataSourceArqueos.data = arqueos;
          this._snackBar.open(
            `Se encontraron ${arqueos.length} arqueos`,
            'Cerrar',
            {
              duration: 3000,
            },
          );
        },
        error: (err) => {
          console.error('Error al buscar arqueos:', err);
          this._snackBar.open('Error al buscar arqueos', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  cargarMovimientosEfectivo(fecha?: Date): void {
    const fechaConsulta = fecha || new Date();
    const fechaStr = fechaConsulta.toISOString().split('T')[0];

    this._arqueoService.getMovimientosEfectivoDia(fechaStr).subscribe({
      next: (movimientos) => {
        this.dataSourceMovimientos.data = movimientos;
        this.dataSourceMovimientos.paginator = this.paginatorMovimientos;
        this.dataSourceMovimientos.sort = this.sortMovimientos;
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
      },
    });
  }

  verDetalleArqueo(arqueo: IArqueoCaja): void {
    // Implementar modal de detalle
    console.log('Ver detalle:', arqueo);
  }

  exportarArqueo(arqueo: IArqueoCaja): void {
    try {
      // Obtener movimientos del día del arqueo para incluirlos en el export
      const fechaArqueo = new Date(arqueo.fecha).toISOString().split('T')[0];

      this._arqueoService
        .getMovimientosEfectivoDia(fechaArqueo, arqueo.sede)
        .subscribe({
          next: (movimientos) => {
            const nombreArchivo = `arqueo-${arqueo.codArqueo}`;
            this._excelService.exportarArqueoAExcel(
              arqueo,
              movimientos,
              nombreArchivo,
            );

            this._snackBar.open('Arqueo exportado exitosamente', 'Cerrar', {
              duration: 3000,
            });
          },
          error: (err) => {
            console.error('Error al obtener movimientos para exportar:', err);
            // Exportar solo el arqueo sin movimientos
            const nombreArchivo = `arqueo-${arqueo.codArqueo}`;
            this._excelService.exportarArqueoAExcel(arqueo, [], nombreArchivo);

            this._snackBar.open(
              'Arqueo exportado (sin detalle de movimientos)',
              'Cerrar',
              {
                duration: 3000,
              },
            );
          },
        });
    } catch (error) {
      console.error('Error al exportar arqueo:', error);
      this._snackBar.open('Error al exportar el arqueo', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  exportarHistorialArqueos(): void {
    const datos = this.dataSourceArqueos.data;
    if (datos.length === 0) {
      this._snackBar.open('No hay datos para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    try {
      // Obtener fechas del formulario para el nombre del archivo
      const fechaInicio =
        this.formBusqueda.get('fechaInicio')?.value || new Date();
      const fechaFin = this.formBusqueda.get('fechaFin')?.value || new Date();

      const fechaInicioStr = new Date(fechaInicio).toISOString().split('T')[0];
      const fechaFinStr = new Date(fechaFin).toISOString().split('T')[0];

      const nombreArchivo = `historial-arqueos-${fechaInicioStr}_a_${fechaFinStr}`;

      this._excelService.exportarArqueosAExcel(datos, nombreArchivo);

      this._snackBar.open('Historial exportado exitosamente', 'Cerrar', {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error al exportar historial:', error);
      this._snackBar.open('Error al exportar el historial', 'Cerrar', {
        duration: 3000,
      });
    }
  }

  filtrarArqueos(event: Event): void {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceArqueos.filter = termino.trim().toLowerCase();
  }

  filtrarMovimientos(event: Event): void {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceMovimientos.filter = termino.trim().toLowerCase();
  }

  // Métodos de utilidad
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'cuadrado':
        return 'text-success';
      case 'diferencia':
        return 'text-warning';
      case 'abierto':
        return 'text-info';
      case 'cerrado':
        return 'text-primary';
      default:
        return 'text-muted';
    }
  }

  getDiferenciaClass(diferencia: number): string {
    if (diferencia === 0) return 'text-success';
    if (diferencia > 0) return 'text-info';
    return 'text-danger';
  }

  getTotalDenominaciones(): number {
    return this.denominaciones.controls.reduce((sum, control) => {
      return sum + (control.get('subtotal')?.value || 0);
    }, 0);
  }

  calcularDiferencia(): number {
    const montoCierre = this.formArqueo.get('montoCierre')?.value || 0;
    const montoSistema = this.resumenDiario?.totalPagosEfectivo || 0;
    return montoCierre - montoSistema;
  }
}
