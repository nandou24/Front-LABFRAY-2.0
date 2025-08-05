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

    //console.log('Fecha Inicio:', fechaInicioControl);
    // console.log('Fecha Fin:', fechaFinControl);

    const inicio = new Date(fechaInicioControl);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fechaFinControl);
    fin.setHours(23, 59, 59, 999);

    // console.log('Inicio:', inicio);
    // console.log('Fin:', fin);

    // console.log('Término despues:', fechaInicioControl, fechaFinControl);

    this._pagoService
      .getAllByDateRange(inicio.toISOString(), fin.toISOString(), termino)
      .subscribe({
        next: (pagos) => {
          this.dataSourceReporte.data = pagos;
          this.calcularEstadisticas(pagos);
          console.log('Pagos encontrados:', pagos);
          this.snackBar.open(`Se encontraron ${pagos.length} pagos`, 'Cerrar', {
            duration: 3000,
          });
        },
        error: (err) => {
          console.error('Error al buscar pagos:', err);
          this.snackBar.open('Error al buscar pagos', 'Cerrar', {
            duration: 3000,
          });
        },
      });
  }

  getEstadoClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pagado':
      case 'completado':
        return 'text-success';
      case 'pendiente':
      case 'parcial':
        return 'text-warning';
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

  calcularEstadisticas(pagos: IPago[]): void {
    this.estadisticas = {
      totalPagos: pagos.length,
      montoTotal: pagos.reduce((sum, pago) => sum + pago.total, 0),
      montoPagado: pagos.reduce(
        (sum, pago) => sum + (pago.total - pago.faltaPagar),
        0,
      ),
      montoFaltante: pagos.reduce((sum, pago) => sum + pago.faltaPagar, 0),
      pagosCompletos: pagos.filter((pago) => pago.faltaPagar === 0).length,
      pagosPendientes: pagos.filter((pago) => pago.faltaPagar > 0).length,
    };
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
