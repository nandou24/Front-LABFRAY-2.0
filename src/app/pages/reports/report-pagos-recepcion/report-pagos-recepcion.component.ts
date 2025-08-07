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
  private snackBar = inject(MatSnackBar);
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
    'fechaEmision',
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
          console.log('Datos originales del servicio:', pagos);

          // Filtrar todos los pagos por fecha (incluyendo anulados para mostrar en la tabla)
          const pagosFiltrados = this.filtrarPagosPorFecha(pagos, inicio, fin);
          console.log('Pagos filtrados por fecha:', pagosFiltrados);

          this.dataSourceReporte.data = pagosFiltrados;
          this.calcularEstadisticas(pagosFiltrados, inicio, fin);
          console.log(
            'Datos asignados al dataSource:',
            this.dataSourceReporte.data,
          );
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
    console.log('🔍 Filtrando pagos por fecha:', {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      cantidadPagos: pagos.length,
    });

    return pagos
      .map((pago) => {
        // Filtrar solo los detalles de pagos que estén dentro del rango de fechas
        // REMOVIDO el filtro por esAntiguo ya que parece que todos los detalles lo tienen en true
        const detallesFiltrados = pago.detallePagos.filter((detalle) => {
          const fechaPago = new Date(detalle.fechaPago);
          const esFechaValida =
            fechaPago >= fechaInicio && fechaPago <= fechaFin;

          console.log(
            `🔎 Evaluando detalle: ${detalle.medioPago} | Fecha: ${fechaPago.toISOString()} | Válida: ${esFechaValida} | Antiguo: ${detalle.esAntiguo}`,
          );

          return esFechaValida; // Solo filtrar por fecha, no por esAntiguo
        });

        console.log(
          `✅ Pago ${pago.codCotizacion}: ${detallesFiltrados.length} detalles válidos de ${pago.detallePagos.length} totales`,
        );

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

  verDetallePago(pago: IPago): void {
    console.log('Detalle del pago:', pago);

    // Aquí puedes implementar un modal o navegación para mostrar el detalle completo
    const mensaje = this.construirMensajeDetalle(pago);

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 8000,
      panelClass: ['custom-snackbar'],
    });
  }

  exportarPago(pago: IPago): void {
    console.log('Exportando pago:', pago);
    // Aquí puedes implementar la funcionalidad de exportación (PDF, Excel, etc.)
    this.snackBar.open('Funcionalidad de exportación en desarrollo', 'Cerrar', {
      duration: 3000,
    });
  }

  private construirMensajeDetalle(pago: IPago): string {
    let mensaje = `Cotización: ${pago.codCotizacion}\n`;
    mensaje += `Total: S/ ${pago.total.toFixed(2)}\n`;
    mensaje += `Falta pagar: S/ ${pago.faltaPagar.toFixed(2)}\n`;

    if (pago.detallePagos && pago.detallePagos.length > 0) {
      mensaje += `\nPagos realizados:\n`;
      pago.detallePagos.forEach((detalle, index) => {
        mensaje += `${index + 1}. ${detalle.medioPago}: S/ ${detalle.monto.toFixed(2)}`;
        if (detalle.numOperacion) {
          mensaje += ` (Op: ${detalle.numOperacion})`;
        }
        mensaje += `\n`;
      });
    }

    return mensaje;
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
        // Los detalles ya están filtrados por fecha, solo sumamos
        montoPagadoEnRango += detalle.monto;
        if (ingresosPorMedioPago[detalle.medioPago]) {
          ingresosPorMedioPago[detalle.medioPago] += detalle.monto;
        } else {
          ingresosPorMedioPago[detalle.medioPago] = detalle.monto;
        }
      });
    });

    // Estadísticas generales incluyen todos los pagos (para conteo)
    // pero montos solo de pagos no anulados
    this.estadisticas = {
      totalPagos: pagos.length, // Incluye anulados para el conteo total
      montoTotal: pagosNoAnulados.reduce((sum, pago) => sum + pago.total, 0), // Solo no anulados
      montoPagado: montoPagadoEnRango, // Solo no anulados
      montoFaltante: pagosNoAnulados.reduce(
        (sum, pago) => sum + pago.faltaPagar,
        0,
      ), // Solo no anulados
      pagosCompletos: pagosNoAnulados.filter((pago) => pago.faltaPagar === 0)
        .length, // Solo no anulados
      pagosPendientes: pagosNoAnulados.filter((pago) => pago.faltaPagar > 0)
        .length, // Solo no anulados
      ingresosPorMedioPago: ingresosPorMedioPago, // Solo no anulados
    };

    console.log('Estadísticas calculadas:', this.estadisticas);
    console.log('Pagos totales (incluyendo anulados):', pagos.length);
    console.log('Pagos no anulados para cálculos:', pagosNoAnulados.length);
    console.log('Ingresos por medio de pago:', ingresosPorMedioPago);
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

    // Aquí puedes implementar la exportación a Excel o PDF
    console.log('Exportando reporte:', datos);
    this.snackBar.open('Funcionalidad de exportación en desarrollo', 'Cerrar', {
      duration: 3000,
    });
  }
}
