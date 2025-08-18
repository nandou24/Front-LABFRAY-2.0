import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
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
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IPago } from '../../../models/Gestion/pagos.models';
import { MatSort } from '@angular/material/sort';
import { PagosCotizacionPersonalService } from '../../../services/gestion/pagos/pagos-cotizacion-personal.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelExportService } from '../../../services/utilitarios/excel/excel-export.service';
import { MatDialog } from '@angular/material/dialog';
import { DetalleServiciosDialogComponent } from './detalle-servicios-dialog/detalle-servicios-dialog.component';

@Component({
  selector: 'app-report-pagos-recepcion',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginator,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './report-pagos-recepcion.component.html',
  styleUrl: './report-pagos-recepcion.component.scss',
})
export class ReportPagosRecepcionComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _pagoService = inject(PagosCotizacionPersonalService);
  private _excelService = inject(ExcelExportService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  ngOnInit(): void {
    this.buscarPagos();
    this.dataSourceReporte.paginator = this.paginator;
    this.dataSourceReporte.sort = this.sort;
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  reportePagosForm: FormGroup = this._fb.group({
    cotizacionId: ['', Validators.required],
    tipo: ['', Validators.required],
    servicios: this._fb.array([], Validators.required),
    nombreCliente: ['', Validators.required],
    apePatCliente: ['', Validators.required],
    apeMatCliente: ['', Validators.required],
    hc: ['', Validators.required],
    tipoDoc: ['', Validators.required],
    nroDoc: ['', Validators.required],
    codUsuarioEmisor: ['', Validators.required],
    usuarioEmisor: ['', Validators.required],
  });

  myGroupBusqueda = new FormGroup({
    terminoBusqueda: new FormControl(),
    fechaInicio: new FormControl(new Date()),
    fechaFin: new FormControl(new Date()),
    filtroBusqueda: new FormControl(),
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //Tabla roles
  columnasTablaReporte: string[] = [
    'cotizacionId',
    'codigoPago',
    'nombreCompleto',
    'montoTotal',
    'faltaPagar',
    'medioPago',
    'estado',
    'acciones',
  ];
  dataSourceReporte = new MatTableDataSource<IPago>();

  // Estadísticas del reporte
  estadisticas = {
    totalPagos: 0,
    montoTotal: 0,
    montoPagado: 0,
    montoFaltante: 0,
    pagosCompletos: 0,
    pagosPendientes: 0,
    ingresosPorMedioPago: {} as { [key: string]: number },
  };

  filtrar(event: Event) {
    const termino = (event.target as HTMLInputElement).value;
    this.dataSourceReporte.filter = termino.trim().toLowerCase();
  }

  buscarPagos() {
    const termino = this.myGroupBusqueda.get('terminoBusqueda')?.value || '';
    const fechaInicioControl =
      this.myGroupBusqueda.get('fechaInicio')?.value || new Date();
    const fechaFinControl =
      this.myGroupBusqueda.get('fechaFin')?.value || new Date();

    const inicio = new Date(fechaInicioControl);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFinControl);
    fin.setHours(23, 59, 59, 999);

    this._pagoService
      .getAllByDateRange(inicio.toISOString(), fin.toISOString(), termino)
      .subscribe({
        next: (pagos) => {
          // console.log('Datos originales del servicio:', pagos);

          // Filtrar todos los pagos por fecha (incluyendo anulados para mostrar en la tabla)
          const pagosFiltrados = this.filtrarPagosPorFecha(pagos, inicio, fin);
          // console.log('Pagos filtrados por fecha:', pagosFiltrados);

          this.dataSourceReporte.data = pagosFiltrados;
          this.calcularEstadisticas(pagosFiltrados, inicio, fin);
          // console.log(
          //   'Datos asignados al dataSource:',
          //   this.dataSourceReporte.data,
          // );
          this.snackBar.open(
            `Se encontraron ${pagosFiltrados.length} pagos con detalles en el rango`,
            'Cerrar',
            {
              duration: 3000,
            },
          );
        },
        error: (err) => {
          console.error('Error al buscar pagos:', err);
          this.snackBar.open('Error al buscar pagos', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  private filtrarPagosPorFecha(
    pagos: IPago[],
    fechaInicio: Date,
    fechaFin: Date,
  ): IPago[] {
    // console.log('🔍 Filtrando pagos por fecha:', {
    //   fechaInicio: fechaInicio.toISOString(),
    //   fechaFin: fechaFin.toISOString(),
    //   cantidadPagos: pagos.length,
    // });

    return pagos
      .map((pago) => {
        // Filtrar solo los detalles de pagos que estén dentro del rango de fechas
        // REMOVIDO el filtro por esAntiguo ya que parece que todos los detalles lo tienen en true
        const detallesFiltrados = pago.detallePagos.filter((detalle) => {
          const fechaPago = new Date(detalle.fechaPago);
          const esFechaValida =
            fechaPago >= fechaInicio && fechaPago <= fechaFin;

          // console.log(
          //   `🔎 Evaluando detalle: ${detalle.medioPago} | Fecha: ${fechaPago.toISOString()} | Válida: ${esFechaValida} | Antiguo: ${detalle.esAntiguo}`,
          // );

          return esFechaValida; // Solo filtrar por fecha, no por esAntiguo
        });

        // console.log(
        //   `✅ Pago ${pago.codCotizacion}: ${detallesFiltrados.length} detalles válidos de ${pago.detallePagos.length} totales`,
        // );

        // Solo incluir el pago si tiene al menos un detalle válido en el rango de fechas
        if (detallesFiltrados.length > 0) {
          return {
            ...pago,
            detallePagos: detallesFiltrados,
          };
        }
        return null;
      })
      .filter((pago) => pago !== null) as IPago[];
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pagado':
      case 'completado':
        return 'text-success';
      case 'pendiente':
      case 'parcial':
        return 'text-warning';
      case 'pago anulado':
      case 'anulado':
      case 'cancelado':
        return 'text-danger';
      default:
        return 'text-info';
    }
  }

  /**
   * Valida si la información del médico es válida para mostrar
   */
  private esMedicoValido(medico: any): boolean {
    return (
      medico &&
      medico.nombreRecHumano &&
      medico.nombreRecHumano !== 'null' &&
      medico.nombreRecHumano.trim() !== '' &&
      medico.apePatRecHumano &&
      medico.apePatRecHumano !== 'null' &&
      medico.apePatRecHumano.trim() !== ''
    );
  }

  verDetallePago(pago: IPago): void {
    this.dialog.open(DetalleServiciosDialogComponent, {
      data: pago,
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: false,
      panelClass: 'custom-dialog-container',
    });
  }

  exportarPago(pago: IPago): void {
    try {
      const nombreArchivo = `pago-${pago.codCotizacion}-${pago.codPago}`;

      // Exportar solo este pago
      this._excelService.exportarPagosAExcel([pago], nombreArchivo);

      this.snackBar.open(
        `Pago exportado exitosamente: ${nombreArchivo}.xlsx`,
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['success-snackbar'],
        },
      );
    } catch (error) {
      console.error('Error al exportar pago:', error);
      this.snackBar.open(
        'Error al exportar el pago. Intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        },
      );
    }
  }

  calcularEstadisticas(
    pagos: IPago[],
    fechaInicio?: Date,
    fechaFin?: Date,
  ): void {
    const ingresosPorMedioPago: { [key: string]: number } = {};
    let montoPagadoEnRango = 0;

    // Filtrar pagos no anulados para los cálculos monetarios
    const pagosNoAnulados = pagos.filter(
      (pago) => pago.estadoPago?.toLowerCase() !== 'anulado',
    );

    // Calcular totales solo con pagos no anulados
    pagosNoAnulados.forEach((pago) => {
      pago.detallePagos.forEach((detalle) => {
        // Calcular monto total incluyendo recargo
        const montoConRecargo = detalle.monto + (detalle.recargo || 0);
        montoPagadoEnRango += montoConRecargo;

        if (ingresosPorMedioPago[detalle.medioPago]) {
          ingresosPorMedioPago[detalle.medioPago] += montoConRecargo;
        } else {
          ingresosPorMedioPago[detalle.medioPago] = montoConRecargo;
        }
      });
    });

    // Estadísticas generales incluyen todos los pagos (para conteo)
    // pero montos solo de pagos no anulados usando totalFacturar
    this.estadisticas = {
      totalPagos: pagos.length, // Incluye anulados para el conteo total
      montoTotal: pagosNoAnulados.reduce(
        (sum, pago) => sum + (pago.totalFacturar || 0),
        0,
      ), // Usar totalFacturar
      montoPagado: montoPagadoEnRango, // Solo no anulados con recargos incluidos
      montoFaltante: pagosNoAnulados.reduce(
        (sum, pago) => sum + pago.faltaPagar,
        0,
      ), // Solo no anulados
      pagosCompletos: pagosNoAnulados.filter((pago) => pago.faltaPagar === 0)
        .length, // Solo no anulados
      pagosPendientes: pagosNoAnulados.filter((pago) => pago.faltaPagar > 0)
        .length, // Solo no anulados
      ingresosPorMedioPago: ingresosPorMedioPago, // Solo no anulados con recargos incluidos
    };

    // console.log('Estadísticas calculadas:', this.estadisticas);
    // console.log('Pagos totales (incluyendo anulados):', pagos.length);
    // console.log('Pagos no anulados para cálculos:', pagosNoAnulados.length);
    // console.log(
    //   'Ingresos por medio de pago (con recargos incluidos):',
    //   ingresosPorMedioPago,
    // );
    // console.log('Usando totalFacturar para montoTotal en estadísticas');
  }

  // Métodos para acceder a los ingresos por medio de pago
  getMediosPagoList(): string[] {
    return Object.keys(this.estadisticas.ingresosPorMedioPago);
  }

  getIngresosPorMedio(medioPago: string): number {
    return this.estadisticas.ingresosPorMedioPago[medioPago] || 0;
  }

  getTotalIngresosPorMediosPago(): number {
    return Object.values(this.estadisticas.ingresosPorMedioPago).reduce(
      (sum, monto) => sum + monto,
      0,
    );
  }

  exportarReporte(): void {
    const datos = this.dataSourceReporte.data;
    if (datos.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    try {
      // Obtener fechas del formulario para el nombre del archivo
      const fechaInicio =
        this.myGroupBusqueda.get('fechaInicio')?.value || new Date();
      const fechaFin =
        this.myGroupBusqueda.get('fechaFin')?.value || new Date();

      const fechaInicioStr = new Date(fechaInicio).toISOString().split('T')[0];
      const fechaFinStr = new Date(fechaFin).toISOString().split('T')[0];

      const nombreArchivo = `reporte-pagos-${fechaInicioStr}_a_${fechaFinStr}`;

      // Exportar a Excel con estadísticas
      this._excelService.exportarPagosAExcel(
        datos,
        nombreArchivo,
        this.estadisticas,
      );

      this.snackBar.open(
        `Reporte exportado exitosamente: ${nombreArchivo}.xlsx`,
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['success-snackbar'],
        },
      );
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      this.snackBar.open(
        'Error al exportar el reporte. Intente nuevamente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        },
      );
    }
  }
}
