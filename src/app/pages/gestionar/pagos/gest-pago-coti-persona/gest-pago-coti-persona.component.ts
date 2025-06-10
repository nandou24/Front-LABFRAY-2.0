import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule, MatOption } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CotizacionPersonalService } from '../../../../services/gestion/cotizaciones/cotizacion-personal.service';
import { ICotizacion, IHistorialCotizacion } from '../../../../models/cotizacionPersona.models';
import { IPago } from '../../../../models/pagos.models';
import { PagosCotizacionPersonalService } from '../../../../services/gestion/pagos/pagos-cotizacion-personal.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gest-pago-coti-persona',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatOption,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './gest-pago-coti-persona.component.html',
  styleUrl: './gest-pago-coti-persona.component.scss'
})
export class GestPagoCotiPersonaComponent implements OnInit {

  private _cotizacionService = inject(CotizacionPersonalService);
  private _pagoService = inject(PagosCotizacionPersonalService);
  private _fb = inject(FormBuilder);

  ngOnInit(): void {
    this.ultimasCotizaciones(10);
    this.ultimosPagos(10);
  }

  public myFormPagoPersona: FormGroup = this._fb.group({

      codPago: [{ value: '', disabled: true }],
      fechaPago: [{ value: '', disabled: true }],
      codCotizacion: [{ value: '', disabled: true }],
      version: [{ value: '', disabled: true }],
      fechaCotizacion: [{ value: '', disabled: true }],
      estadoCotizacion: [{ value: '', disabled: true }],
      codCliente: [{ value: '', disabled: true }],
      nomCliente: [{ value: '', disabled: true }],
      tipoDoc: [{ value: '', disabled: true }],
      nroDoc: [{ value: '', disabled: true }],
      codSolicitante: [{ value: '', disabled: true }],
      nomSolicitante: [{ value: '', disabled: true }],
      profesionSolicitante: [{ value: '', disabled: true }],
      colegiatura: [{ value: '', disabled: true }],

      sumaTotalesPrecioLista: 0,
      descuentoTotal: 0,
      subTotal: 0,
      igv: 0,
      total: 0,
      serviciosCotizacion: this._fb.array([], Validators.required),
      detallePagos: this._fb.array([], Validators.required),
      faltaPagar: 0,
      subTotalFacturar: 0,
      igvFacturar: 0,
      totalFacturar: 0,
      estadPago: ''
  });

  get serviciosCotizacion(): FormArray{
      return this.myFormPagoPersona.get('serviciosCotizacion') as FormArray;
  }

  get detallePagos(): FormArray{
    return this.myFormPagoPersona.get('detallePagos') as FormArray;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  columnasTablaServiciosCotizados: string[] = ['codigo', 'tipo', 'nombre', 'cantidad', 'precioLista', 'diferencia', 'precioVenta', 'descuentoPorcentaje', 'totalUnitario'];
  dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

  agregarPago() {

    const pagoItem = this._fb.group({
      metodoPago: ['', [Validators.required]],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      fechaPago: [new Date(), [Validators.required]],
      nroOperacion: [''],
      bancoDestino: [''],
    });   

    this.detallePagos.push(pagoItem);

  }

  removerPago(index: number){
    this.detallePagos.removeAt(index);
  }

  //necesito que el control faltaPagar se actualice cada vez que se agregue o elimine un pago

  actualizarFaltaPagar() {

    const totalPagado = this.detallePagos.controls.reduce((total, pago) => {
      return total + (pago.get('monto')?.value || 0);
    }, 0);

    const totalCotizacion = this.myFormPagoPersona.get('total')?.value || 0;

    this.myFormPagoPersona.patchValue({
      faltaPagar: totalCotizacion - totalPagado,
      subTotalFacturar: totalCotizacion - totalPagado,
      igvFacturar: (totalCotizacion - totalPagado) * 0.18, // Asumiendo un IGV del 18%
      totalFacturar: (totalCotizacion - totalPagado) * 1.18 // Total con IGV
    });

  }

  // COTIZACIONES
  timeoutBusqueda: any;
  terminoBusquedaCotizacion = new FormControl('');
  cotizaciones: ICotizacion[] = [];

  ultimasCotizaciones(cantidad: number): void {

    this._cotizacionService.getLatestCotizacioPorPagar(cantidad).subscribe({

      next: (res: ICotizacion[]) => { this.cotizaciones = res; },
      error: (err: any) => { this.cotizaciones = []; },

    });

  }

  buscarCotizaciones() {

    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {

      const termino = this.terminoBusquedaCotizacion.value?.trim() || '';
      
      if (termino.length >= 3) {
        this._cotizacionService.getCotizacion(termino).subscribe((res: ICotizacion[]) => {
          this.cotizaciones = res;
        });
      } else if (termino.length > 0) {
        this.cotizaciones = [];
      } else {
        this.ultimasCotizaciones(10);
      }


    }, 200);
  }

  seSeleccionoCotizacion: boolean = false
  seSeleccionoPago: boolean = false
  
  cargarCotizacion(cotizacion: ICotizacion){

    let ultimaVersion!: IHistorialCotizacion;

    this.myFormPagoPersona.reset();
    this.seSeleccionoCotizacion = true
    this.seSeleccionoPago = false
    this.detallePagos.clear();
    
    //buscando la última versión del historial
    const historial = cotizacion.historial;
    ultimaVersion = historial[historial.length - 1];

    // 📌 Cargar datos del paciente
    this.myFormPagoPersona.patchValue({
      codCotizacion: cotizacion.codCotizacion,
      estadoCotizacion: cotizacion.estadoCotizacion,
      version: ultimaVersion.version,
      fechaCotizacion: ultimaVersion.fechaModificacion,
      codCliente: ultimaVersion.codCliente,
      nomCliente: ultimaVersion.nomCliente,
      tipoDoc: ultimaVersion.tipoDoc,
      nroDoc: ultimaVersion.nroDoc,
      codSolicitante: ultimaVersion.codSolicitante,
      nomSolicitante: ultimaVersion.nomSolicitante,
      profesionSolicitante: ultimaVersion.profesionSolicitante,
      colegiatura: ultimaVersion.colegiatura,
      sumaTotalesPrecioLista: ultimaVersion.sumaTotalesPrecioLista,
      descuentoTotal: ultimaVersion.descuentoTotal,
      subTotal: ultimaVersion.subTotal,
      igv: ultimaVersion.igv,
      total: ultimaVersion.total,
    });

    // 📌 Cargar servicios
    this.serviciosCotizacion.clear(); // Limpiar antes de cargar

    ultimaVersion.serviciosCotizacion.forEach((servicio: any) => {
      this.serviciosCotizacion.push(this.crearServiciosCotizacionGroup(servicio));
    });

    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion.controls as FormGroup[];

  }

  private crearServiciosCotizacionGroup(servicio: any): FormGroup {
    return this._fb.group({
      codServicio: [servicio.codServicio, Validators.required],
      tipoServicio: [servicio.tipoServicio, Validators.required],
      nombreServicio: [servicio.nombreServicio, Validators.required],
      cantidad: [servicio.cantidad, [Validators.required, Validators.min(1)]],
      precioLista: [servicio.precioLista, [Validators.required, Validators.min(0)]],
      diferencia: [servicio.diferencia, [Validators.min(0)]],
      precioVenta: [servicio.precioVenta, [Validators.required, Validators.min(0)]],
      descuentoPorcentaje: [servicio.descuentoPorcentaje, [Validators.min(0), Validators.max(100)]],
      totalUnitario: [servicio.totalUnitario, [Validators.required, Validators.min(0)]]
    });
  }

  // PAGOS
  pagos: IPago[] = [];

  ultimosPagos(cantidad:number): void {
    this._pagoService.getPagos(cantidad).subscribe({
      next: (res: IPago[]) => {this.pagos = res;},
      error: (err) => {console.error('Error al obtener las cotizaciones:', err);},
    });
  }

  cargarPagos(pago: IPago){

  }

  registrarPagos() {
  }

  cancelarOperacion(){

  }

}
