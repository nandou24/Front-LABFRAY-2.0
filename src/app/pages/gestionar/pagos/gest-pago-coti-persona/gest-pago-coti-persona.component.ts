import { CommonModule, formatDate } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import {
  ICotizacion,
  IHistorialCotizacion,
  IServicioCotizacion,
} from '../../../../models/Gestion/cotizacionPersona.models';
import { IDetallePago, IPago } from '../../../../models/Gestion/pagos.models';
import { PagosCotizacionPersonalService } from '../../../../services/gestion/pagos/pagos-cotizacion-personal.service';
import Swal from 'sweetalert2';
import { DialogRegistroPacienteComponent } from './dialogs/dialog-registro-paciente/dialog-registro-paciente.component';
import { MatDialog } from '@angular/material/dialog';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';

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
    MatPaginator,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './gest-pago-coti-persona.component.html',
  styleUrl: './gest-pago-coti-persona.component.scss',
})
export class GestPagoCotiPersonaComponent implements OnInit {
  private _cotizacionService = inject(CotizacionPersonalService);
  private _pagoService = inject(PagosCotizacionPersonalService);
  private _fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  ngOnInit(): void {
    this.ultimasCotizaciones(20);
    this.ultimosPagos(20);
    this.escucharCambioMotivoAnulacion();
    this.configurarBusquedaCotizaciones();
    this.configurarBusquedaPagos();
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha

    // 🔥 Verificar si viene un código de cotización desde la navegación
    this.verificarParametrosCotizacion();
  }

  /**
   * Verifica si se recibió un código de cotización como query parameter
   * y lo carga automáticamente si existe
   */
  private verificarParametrosCotizacion(): void {
    this._route.queryParamMap.subscribe((params) => {
      const codCotizacion = params.get('codCotizacion');
      if (codCotizacion && codCotizacion.trim() !== '') {
        console.log('📌 Código de cotización recibido:', codCotizacion);
        this.buscarYCargarCotizacion(codCotizacion);
      }
    });
  }

  /**
   * Busca y carga automáticamente una cotización por su código
   */
  private buscarYCargarCotizacion(codCotizacion: string): void {
    this._cotizacionService.getCotizacion(codCotizacion).subscribe({
      next: (cotizaciones: ICotizacion[]) => {
        if (cotizaciones && cotizaciones.length > 0) {
          const cotizacionEncontrada = cotizaciones[0];
          console.log(
            '✅ Cotización encontrada y cargada automáticamente:',
            cotizacionEncontrada,
          );

          // Cargar la cotización encontrada (asumiendo que tienes un método para esto)
          this.cargarCotizacion(cotizacionEncontrada, 0);

          // Mostrar mensaje de éxito
          // Swal.fire({
          //   icon: 'success',
          //   title: 'Cotización cargada',
          //   text: `Se ha cargado automáticamente la cotización ${codCotizacion}`,
          //   timer: 2000,
          //   showConfirmButton: false,
          // });
        } else {
          console.warn('⚠️ No se encontró la cotización:', codCotizacion);
          Swal.fire({
            icon: 'warning',
            title: 'Cotización no encontrada',
            text: `No se pudo encontrar la cotización ${codCotizacion}`,
            confirmButtonText: 'Ok',
          });
        }
      },
      error: (error) => {
        console.error('❌ Error al buscar la cotización:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar cotización',
          text: 'Ocurrió un error al intentar cargar la cotización',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  public myFormPagoPersona: FormGroup = this._fb.group({
    codPago: [{ value: '', disabled: true }],
    fechaPago: [{ value: '', disabled: true }],
    cotizacionId: [{ value: '', disabled: true }],
    codCotizacion: [{ value: '', disabled: true }],
    version: [{ value: 0, disabled: true }],
    fechaCotizacion: [{ value: '', disabled: true }],
    estadoCotizacion: [{ value: '', disabled: true }],
    hc: [{ value: '', disabled: true }],
    clienteId: [{ value: '', required: true }],
    apePatCliente: [{ value: '', disabled: true }],
    apeMatCliente: [{ value: '', disabled: true }],
    nombreCliente: [{ value: '', disabled: true }],
    tipoDoc: [{ value: '', disabled: true }],
    nroDoc: [{ value: '', disabled: true }],
    codSolicitante: [{ value: '', disabled: true }],
    solicitanteId: [],
    apePatRefMedico: [{ value: '', disabled: true }],
    apeMatRefMedico: [{ value: '', disabled: true }],
    nombreRefMedico: [{ value: '', disabled: true }],
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
    subTotalFacturar: [{ value: 0, disabled: true }],
    igvFacturar: [{ value: 0, disabled: true }],
    totalFacturar: [{ value: 0, disabled: true }],
    estadoPago: '',
    anulacionPago: this._fb.group({
      motivo: [''],
      observacion: [''],
    }),
  });

  get serviciosCotizacion(): FormArray {
    return this.myFormPagoPersona.get('serviciosCotizacion') as FormArray;
  }

  get detallePagos(): FormArray {
    return this.myFormPagoPersona.get('detallePagos') as FormArray;
  }

  get anulacionPago(): FormGroup {
    return this.myFormPagoPersona.get('anulacionPago') as FormGroup;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  columnasTablaServiciosCotizados: string[] = [
    'codigo',
    'tipo',
    'nombre',
    'cantidad',
    'precioLista',
    'diferencia',
    'precioVenta',
    'descuentoPorcentaje',
    'totalUnitario',
  ];
  dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

  agregarPago() {
    const pagoItem = this._fb.group({
      fechaPago: [new Date(), [Validators.required]],
      medioPago: ['', [Validators.required]],
      monto: [
        { value: '', disabled: true },
        [Validators.required, Validators.min(0.01)],
      ],
      recargo: [{ value: 0, disabled: true }],
      //montoFacturar: [null, [Validators.required, Validators.min(0.01)]],
      numOperacion: [{ value: '', disabled: true }],
      bancoDestino: [{ value: '', disabled: true }],
    });

    // Escuchar cambios en el método de pago
    pagoItem
      .get('medioPago')
      ?.valueChanges.subscribe((metodo: string | null) => {
        if (metodo) {
          this.actualizarHabilitacionCamposPago(pagoItem, metodo);
        }
      });

    // Escuchar cambios en monto para calcular recargo si aplica
    pagoItem.get('monto')?.valueChanges.subscribe((monto: string | null) => {
      const metodo = pagoItem.get('medioPago')?.value;
      const montoNumber = monto ? parseFloat(monto) : 0;
      if (montoNumber) {
        if (
          (metodo === 'Tarjeta Crédito' || metodo === 'Tarjeta Débito') &&
          montoNumber > 0
        ) {
          const recargo = Math.round(montoNumber * 0.05 * 1000) / 1000; // 5% de recargo
          pagoItem.get('recargo')?.setValue(recargo, { emitEvent: false });
        }
      }
    });

    this.detallePagos.push(pagoItem);
  }

  private actualizarHabilitacionCamposPago(
    grupo: FormGroup,
    metodo: string,
  ): void {
    const monto = grupo.get('monto');
    const recargo = grupo.get('recargo');
    const numOperacion = grupo.get('numOperacion');
    const banco = grupo.get('bancoDestino');

    // 🔄 Primero: deshabilitar y limpiar validadores
    [monto, recargo, numOperacion, banco].forEach((control) => {
      control?.disable();
      control?.reset();
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    // 🔧 Luego: habilitar y aplicar validadores dinámicos
    if (metodo === 'Efectivo') {
      monto?.enable();
      monto?.setValidators([Validators.required, Validators.min(0.01)]);
    }

    if (metodo === 'Transferencia') {
      monto?.enable();
      monto?.setValidators([Validators.required, Validators.min(0.01)]);
      numOperacion?.enable();
      numOperacion?.setValidators([Validators.required]);
      banco?.enable();
      banco?.setValidators([Validators.required]);
    }

    if (metodo === 'Yape' || metodo === 'Plin') {
      monto?.enable();
      monto?.setValidators([Validators.required, Validators.min(0.01)]);
      numOperacion?.enable();
      numOperacion?.setValidators([Validators.required]);
    }

    if (metodo === 'Tarjeta Crédito' || metodo === 'Tarjeta Débito') {
      monto?.enable();
      monto?.setValidators([Validators.required, Validators.min(0.01)]);
      //recargo?.enable(); // Se calcula automáticamente, pero igual se puede editar si lo deseas
    }

    // ✅ Recalcular validadores
    [monto, recargo, numOperacion, banco].forEach((control) => {
      control?.updateValueAndValidity();
    });
  }

  removerPago(index: number) {
    this.detallePagos.removeAt(index);
  }

  //necesito que el control faltaPagar se actualice cada vez que se agregue o elimine un pago

  actualizarFaltaPagar() {
    const totalCotizacion = this.myFormPagoPersona.get('total')?.value || 0;

    let totalPagado = 0;
    let totalAFacturar = 0;

    this.detallePagos.controls.forEach((pago) => {
      const monto = +pago.get('monto')?.value || 0;
      const recargo = +pago.get('recargo')?.value || 0;

      totalPagado += monto;
      totalAFacturar += monto + recargo;
    });

    const faltaPagar = Math.round((totalCotizacion - totalPagado) * 100) / 100;

    const subTotalFacturar = Math.round((totalAFacturar / 1.18) * 1000) / 1000;
    const igvFacturar =
      Math.round((totalAFacturar - subTotalFacturar) * 1000) / 1000;
    const totalFacturar = Math.round(totalAFacturar * 100) / 100;

    this.myFormPagoPersona.patchValue({
      faltaPagar: faltaPagar,
      subTotalFacturar: subTotalFacturar,
      igvFacturar: igvFacturar,
      totalFacturar: totalFacturar,
    });
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  // COTIZACIONES

  @ViewChild('MatPaginatorCotizaciones') paginatorCotizaciones!: MatPaginator;
  @ViewChild('MatPaginatorPagos') paginatorPagos!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceCotizaciones.paginator = this.paginatorCotizaciones;
    this.dataSourcePagos.paginator = this.paginatorPagos;
  }

  columnasCotizaciones: string[] = [
    'codCotizacion',
    'paciente',
    'fecha',
    'estado',
  ];

  dataSourceCotizaciones = new MatTableDataSource<ICotizacion>();
  timeoutBusqueda: any;
  terminoBusquedaCotizacion = new FormControl('');
  cotizaciones: ICotizacion[] = [];

  ultimasCotizaciones(cantidad: number): void {
    this._cotizacionService.getLatestCotizacioPorPagar(cantidad).subscribe({
      next: (res: ICotizacion[]) => {
        this.dataSourceCotizaciones.data = res;
        console.log('Últimas cotizaciones cargadas:', res);
      },
      error: (err: any) => {
        this.dataSourceCotizaciones.data = [];
      },
    });
  }

  configurarBusquedaCotizaciones(): void {
    this.terminoBusquedaCotizacion.valueChanges
      .pipe(
        filter((termino): termino is string => termino !== null),
        debounceTime(300),
        distinctUntilChanged(),
        tap((termino: string) => {
          termino = termino?.trim() || '';

          if (termino.length >= 3) {
            this._cotizacionService.getCotizacion(termino).subscribe({
              next: (res: ICotizacion[]) => {
                this.dataSourceCotizaciones.data = res;
              },
              error: () => {
                this.dataSourceCotizaciones.data = [];
              },
            });
          } else if (termino.length > 0) {
            this.dataSourceCotizaciones.data = [];
          } else {
            this.ultimasCotizaciones(10); // ← carga las cotizaciones recientes
          }
        }),
      )
      .subscribe();
  }

  seSeleccionoCotizacion: boolean = false;
  seSeleccionoPago: boolean = false;
  filaSeleccionadaIndexCoti: number | null = null;

  cargarCotizacion(cotizacion: ICotizacion, index: number) {
    let ultimaVersion!: IHistorialCotizacion;
    this.filaSeleccionadaIndexCoti = index;

    this.myFormPagoPersona.reset();
    this.seSeleccionoCotizacion = true;
    this.seSeleccionoPago = false;
    this.detallePagos.clear();
    this.cancelarAnulacion();
    this.tienePagos = false;
    this.tienePagoTotal = false;

    //buscando la última versión del historial
    const historial = cotizacion.historial;
    ultimaVersion = historial[historial.length - 1];

    const fechaFormateada = formatDate(
      ultimaVersion.fechaModificacion ?? '',
      'dd/MM/yyyy HH:mm',
      'es-PE',
    );

    // 📌 Cargar datos del paciente
    this.myFormPagoPersona.patchValue({
      cotizacionId: cotizacion._id,
      codCotizacion: cotizacion.codCotizacion,
      estadoCotizacion: cotizacion.estadoCotizacion,
      version: ultimaVersion.version,
      fechaCotizacion: ultimaVersion.fechaModificacion,
      hc: ultimaVersion.hc,
      clienteId: ultimaVersion.clienteId,
      nombreCliente: ultimaVersion.nombreCliente,
      apePatCliente: ultimaVersion.apePatCliente,
      apeMatCliente: ultimaVersion.apeMatCliente,
      tipoDoc: ultimaVersion.tipoDoc,
      nroDoc: ultimaVersion.nroDoc,
      codSolicitante: ultimaVersion.codSolicitante,
      solicitanteId: ultimaVersion.solicitanteId,
      apePatRefMedico: ultimaVersion.apePatRefMedico,
      apeMatRefMedico: ultimaVersion.apeMatRefMedico,
      nombreRefMedico: ultimaVersion.nombreRefMedico,
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
      this.serviciosCotizacion.push(
        this.crearServiciosCotizacionGroup(servicio),
      );
    });

    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];
  }

  private crearServiciosCotizacionGroup(
    servicio: IServicioCotizacion,
  ): FormGroup {
    return this._fb.group({
      servicioId: [servicio.servicioId, Validators.required],
      codServicio: [servicio.codServicio, Validators.required],
      tipoServicio: [servicio.tipoServicio, Validators.required],
      nombreServicio: [servicio.nombreServicio, Validators.required],
      cantidad: [servicio.cantidad, [Validators.required, Validators.min(1)]],
      precioLista: [
        servicio.precioLista,
        [Validators.required, Validators.min(0)],
      ],
      diferencia: [servicio.diferencia],
      precioVenta: [
        servicio.precioVenta,
        [Validators.required, Validators.min(0)],
      ],
      descuentoPorcentaje: [
        servicio.descuentoPorcentaje,
        [Validators.min(0), Validators.max(100)],
      ],
      nuevoPrecioVenta: [
        servicio.nuevoPrecioVenta,
        [Validators.required, Validators.min(0)],
      ],
      totalUnitario: [
        servicio.totalUnitario,
        [Validators.required, Validators.min(0)],
      ],

      medicoAtiende: this._fb.group({
        medicoId: [servicio.medicoAtiende?.medicoId],
        codRecHumano: [servicio.medicoAtiende?.codRecHumano],
        apePatRecHumano: [servicio.medicoAtiende?.apePatRecHumano],
        apeMatRecHumano: [servicio.medicoAtiende?.apeMatRecHumano],
        nombreRecHumano: [servicio.medicoAtiende?.nombreRecHumano],
        nroColegiatura: [servicio.medicoAtiende?.nroColegiatura],
        rne: [servicio.medicoAtiende?.rne],
      }),
    });
  }

  // PAGOS
  dataSourcePagos = new MatTableDataSource<IPago>();
  terminoBusquedaPagos = new FormControl('');
  pagos: IPago[] = [];

  columnasPagos: string[] = [
    'codCoti',
    'codPago',
    'nombreCompleto',
    'fecha',
    'estado',
  ];

  ultimosPagos(cantidad: number): void {
    this._pagoService.getPagos(cantidad).subscribe({
      next: (res: IPago[]) => {
        this.dataSourcePagos.data = res;
      },
      error: (err) => {
        console.error('Error al obtener las cotizaciones:', err);
      },
    });
  }

  configurarBusquedaPagos(): void {
    this.terminoBusquedaPagos.valueChanges
      .pipe(
        filter((termino): termino is string => termino !== null),
        debounceTime(300),
        distinctUntilChanged(),
        tap((termino: string) => {
          termino = termino?.trim() || '';

          if (termino.length >= 3) {
            this._pagoService.getPago(termino).subscribe({
              next: (res: IPago[]) => {
                this.dataSourcePagos.data = res;
              },
              error: () => {
                this.dataSourcePagos.data = [];
              },
            });
          } else if (termino.length > 0) {
            this.dataSourcePagos.data = [];
          } else {
            this.ultimosPagos(10); // ← carga los pagos recientes
          }
        }),
      )
      .subscribe();
  }

  tienePagoTotal: boolean = false;
  tienePagos: boolean = false;
  filaSeleccionadaIndexPago: number | null = null;

  cargarPagos(pago: IPago, index: number) {
    this.myFormPagoPersona.reset();
    this.detallePagos.clear();
    this.serviciosCotizacion.clear();
    this.filaSeleccionadaIndexPago = index;
    this.filaSeleccionadaIndexCoti = null; // Limpiar selección de cotización

    this.seSeleccionoCotizacion = true;
    this.seSeleccionoPago = true;
    this.tienePagos = true;
    this.tienePagoTotal = false;
    this.cancelarAnulacion();

    // Cargar campos del formulario
    this.myFormPagoPersona.patchValue({
      codPago: pago.codPago,
      cotizacionId: pago.cotizacionId,
      codCotizacion: pago.codCotizacion,
      fechaCotizacion: pago.fechaCotizacion,
      version: pago.version,
      estadoCotizacion: pago.estadoCotizacion,
      hc: pago.hc,
      clienteId: pago.clienteId,
      nombreCliente: pago.nombreCliente,
      apePatCliente: pago.apePatCliente,
      apeMatCliente: pago.apeMatCliente,
      tipoDoc: pago.tipoDoc,
      nroDoc: pago.nroDoc,
      codSolicitante: pago.codSolicitante,
      solicitanteId: pago.solicitanteId,
      nombreRefMedico: pago.nombreRefMedico,
      apePatRefMedico: pago.apePatRefMedico,
      apeMatRefMedico: pago.apeMatRefMedico,
      profesionSolicitante: pago.profesionSolicitante,
      colegiatura: pago.colegiatura,
      sumaTotalesPrecioLista: pago.sumaTotalesPrecioLista,
      descuentoTotal: pago.descuentoTotal,
      subTotal: pago.subTotal,
      igv: pago.igv,
      total: pago.total,
      faltaPagar: pago.faltaPagar,
      subTotalFacturar: pago.subTotalFacturar,
      igvFacturar: pago.igvFacturar,
      totalFacturar: pago.totalFacturar,
      estadoPago: pago.estadoPago,
    });

    if (pago.estadoPago === 'PAGO TOTAL') {
      this.tienePagoTotal = true;
    }

    // Servicios cotizados
    pago.serviciosCotizacion.forEach((servicio) => {
      this.serviciosCotizacion.push(
        this.crearServiciosCotizacionGroup(servicio),
      );
    });
    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];

    // Detalle de pagos realizados (modo solo lectura)
    pago.detallePagos.forEach((detalle) => {
      const pagoGroup = this._fb.group({
        fechaPago: new Date(detalle.fechaPago),
        medioPago: [detalle.medioPago],
        monto: [detalle.monto],
        recargo: [detalle.recargo],
        numOperacion: [detalle.numOperacion],
        bancoDestino: [detalle.bancoDestino],
        esAntiguo: [true], // Marca como antiguo para no enviar al backend
      });
      pagoGroup.disable(); // ❗ Solo lectura
      this.detallePagos.push(pagoGroup);
    });
  }

  //necesito que al momento de agregar pagos, la suma de estos no supere el total de la cotización
  //necesito que el retorno de esta función sea un booleano, si es true, se puede registrar el pago, si es false, no se puede registrar el pago
  validarArrayPagos(): boolean {
    if (this.detallePagos.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe agregar al menos un pago.',
      });
      return false;
    } else {
      return true;
    }
  }

  validarMontoMayor(): boolean {
    const totalPagado = this.detallePagos.controls.reduce((total, pago) => {
      return total + (pago.get('monto')?.value || 0);
    }, 0);

    console.log('Total Pagado:', totalPagado);

    const totalCotizacion = this.myFormPagoPersona.get('total')?.value || 0;

    if (totalPagado > totalCotizacion) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El total de los pagos no puede superar el total de la cotización.',
      });
      return false;
    } else {
      return true;
    }
  }

  generarPago() {
    if (this.seSeleccionoCotizacion === false) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar una cotización antes de registrar un pago.',
      });
      return;
    }

    if (!this.validarArrayPagos() || !this.validarMontoMayor()) {
      return;
    }

    if (this.myFormPagoPersona.invalid) {
      this.myFormPagoPersona.markAllAsTouched();
      console.log(this.myFormPagoPersona);
      console.log('Formulario inválido');
      return;
    }

    const pago = this.myFormPagoPersona.getRawValue();
    // 🔁 Filtrar solo los nuevos pagos (sin esAntiguo)
    const nuevosPagos = pago.detallePagos.filter((p: any) => !p.esAntiguo);
    // ✅ Enviar solo los nuevos pagos al backend

    if (nuevosPagos.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin nuevos pagos',
        text: 'Debe agregar al menos un nuevo pago para continuar.',
      });
      return;
    }

    pago.detallePagos = nuevosPagos;

    const falta = Number(this.myFormPagoPersona.get('faltaPagar')?.value || 0);

    if (falta > 0) {
      Swal.fire({
        title: '¿Registrar pago parcial?',
        html: `
          <p>El cliente aún tiene un saldo pendiente de:</p>
          <h3 style="color:#d97706">S/. ${falta.toFixed(2)}</h3>
          <p>¿Deseas registrar este pago parcial?</p>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar pago parcial',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f59e0b',
      }).then((result) => {
        if (result.isConfirmed) {
          this.registrarPagos(pago);
        }
      });
    } else if (falta == 0) {
      Swal.fire({
        title: '¿Registrar pago completo?',
        html: `
        <p>El monto total ha sido cubierto.</p>
        <p>La venta será registrada como <strong>PAGADA EN SU TOTALIDAD</strong>.</p>
      `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, registrar pago total',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#16a34a',
      }).then((result) => {
        if (result.isConfirmed) {
          this.registrarPagos(pago);
        }
      });
    }
  }

  registrarPagos(pago: IPago) {
    // const codCotizacion = this.myFormPagoPersona.get('codCotizacion')?.value;

    // this._cotizacionService.verificarHcRegistrada(codCotizacion).subscribe({
    //   next: (hcRegistrada: boolean) => {
    //     if (!hcRegistrada) {
    //       Swal.fire({
    //         title: 'Error',
    //         text: 'El paciente no está registrado en el sistema.',
    //         icon: 'error',
    //         showCancelButton: true,
    //         confirmButtonText: 'Registrar paciente',
    //         cancelButtonText: 'Cancelar',
    //       }).then((result) => {
    //         if (result.isConfirmed) {
    //           const dialogRef = this.dialog.open(
    //             DialogRegistroPacienteComponent,
    //             {
    //               width: '700px',
    //               height: '850px',
    //               minWidth: '500px',
    //               maxWidth: '1000px',

    //               data: {
    //                 codCotizacion:
    //                   this.myFormPagoPersona.get('codCotizacion')?.value,
    //                 paciente: {
    //                   nombreCompleto:
    //                     this.myFormPagoPersona.get('nombreCompleto')?.value,
    //                   tipoDoc: this.myFormPagoPersona.get('tipoDoc')?.value,
    //                   nroDoc: this.myFormPagoPersona.get('nroDoc')?.value,
    //                 },
    //               },
    //             },
    //           );

    //           dialogRef.afterClosed().subscribe((pacienteSeleccionado) => {
    //             if (pacienteSeleccionado) {
    //               this.setPacienteRegistrado(pacienteSeleccionado);
    //               this.ultimasCotizaciones(20); // Actualizar lista de cotizaciones
    //             }
    //           });
    //         }
    //       });
    //     } else {
    //       this._pagoService.registrarPago(pago).subscribe({
    //         next: (data) => {
    //           Swal.fire({
    //             title: 'Confirmado',
    //             text: data.msg,
    //             icon: 'success',
    //             confirmButtonText: 'Ok',
    //           });
    //           this.nuevoPago();
    //           this.cancelarAnulacion();
    //         },
    //         error: (err) => {
    //           console.error('Error al registrar el pago:', err);

    //           const mensaje =
    //             err?.error?.msg ||
    //             err.message ||
    //             'No se pudo registrar el pago. Intenta nuevamente.';

    //           const hc22: boolean = err?.error?.errors?.faltaHC;

    //           // Error genérico
    //           Swal.fire({
    //             title: 'Error',
    //             text: mensaje,
    //             icon: 'error',
    //             confirmButtonText: 'Ok',
    //           });
    //         },
    //       });
    //     }
    //   },
    //   error: (err) => {
    //     console.error('Error al verificar HC:', err);
    //     Swal.fire(
    //       'Error',
    //       'No se pudo verificar la historia clínica.',
    //       'error',
    //     );
    //   },
    // });

    this._pagoService.registrarPago(pago).subscribe({
      next: (data) => {
        Swal.fire({
          title: data.msg,
          text: '¿Qué deseas hacer a continuación?',
          icon: 'success',
          showCancelButton: true,
          reverseButtons: true,
          confirmButtonText: 'Ir a Atenciones',
          cancelButtonText: 'Continuar aquí',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#6c757d',
        }).then((result) => {
          if (result.isConfirmed) {
            this._router.navigate(['/pages/solicitudAtencion']);
          }
        });
        this.nuevoPago();
        this.cancelarAnulacion();
      },
      error: (err) => {
        console.error('Error al registrar el pago:', err);

        const mensaje =
          err?.error?.msg ||
          err.message ||
          'No se pudo registrar el pago. Intenta nuevamente.';

        // Error genérico
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  setPacienteRegistrado(data: any) {
    const paterno = data.paciente.apePatCliente?.trim();
    const materno = data.paciente.apeMatCliente?.trim();
    const nombres = data.paciente.nombreCliente?.trim();
    const nomnbreCompleto = `${paterno} ${materno} ${nombres}`?.trim();

    this.myFormPagoPersona.patchValue({
      nombreCompleto: nomnbreCompleto,
      hc: data.nuevoHC,
    });
  }

  nuevoPago() {
    this.myFormPagoPersona.reset(); // Reinicia todos los campos del formulario
    this.detallePagos.clear();
    this.serviciosCotizacion.clear();
    this.seSeleccionoCotizacion = false;
    this.seSeleccionoPago = false;
    this.filaSeleccionadaIndexCoti = null;
    this.filaSeleccionadaIndexPago = null;
    this.cotizaciones = [];
    this.ultimosPagos(10);
    this.ultimasCotizaciones(10);
    this.anulacionPago.reset(); // Limpia el grupo de anulacion
    this.terminoBusquedaCotizacion.reset(); // Limpia el campo de búsqueda de cot
  }

  cancelarOperacion() {}

  mostrarSeccionAnulacion: boolean = false;

  activarModoAnulacion() {
    this.mostrarSeccionAnulacion = true;
    this.myFormPagoPersona
      .get('anulacionPago.motivo')
      ?.setValidators([Validators.required]);
    this.myFormPagoPersona
      .get('anulacionPago.motivo')
      ?.updateValueAndValidity();
  }

  calcularMontoTotalPagado(): number {
    return this.detallePagos.controls.reduce((total, pago) => {
      const monto = +pago.get('monto')?.value || 0;
      const recargo = +pago.get('recargo')?.value || 0;
      return total + monto + recargo;
    }, 0);
  }

  calcularMonto(): number {
    return this.detallePagos.controls.reduce((total, pago) => {
      const monto = +pago.get('monto')?.value || 0;
      return total + monto;
    }, 0);
  }

  calcularRecargo(): number {
    return this.detallePagos.controls.reduce((total, pago) => {
      const recargo = +pago.get('recargo')?.value || 0;
      return total + recargo;
    }, 0);
  }

  cancelarAnulacion() {
    this.mostrarSeccionAnulacion = false;
    this.anulacionPago.reset();
    this.myFormPagoPersona.get('anulacionPago')?.reset();
    this.myFormPagoPersona.get('anulacionPago.motivo')?.clearValidators();
    this.myFormPagoPersona
      .get('anulacionPago.motivo')
      ?.updateValueAndValidity();
  }

  escucharCambioMotivoAnulacion(): void {
    const anulacionGroup = this.myFormPagoPersona.get(
      'anulacionPago',
    ) as FormGroup;

    anulacionGroup.get('motivo')?.valueChanges.subscribe((motivo) => {
      const observacionControl = anulacionGroup.get('observacion');

      if (motivo === 'Otro') {
        observacionControl?.setValidators([Validators.required]);
      } else {
        observacionControl?.clearValidators();
      }

      observacionControl?.updateValueAndValidity();
    });
  }
  confirmarAnulacion() {
    const anulacionGroup = this.myFormPagoPersona.get(
      'anulacionPago',
    ) as FormGroup;
    if (anulacionGroup.invalid) {
      anulacionGroup.markAllAsTouched();
      return;
    }

    const motivo = anulacionGroup.get('motivo')?.value;
    const observacion = anulacionGroup.get('observacion')?.value;
    const codPago = this.myFormPagoPersona.get('codPago')?.value;

    Swal.fire({
      title: 'Confirmar Anulación',
      text: `¿Estás seguro de anular el pago ${codPago} por el motivo: "${motivo}"?${observacion ? `\nObservación: ${observacion}` : ''}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        this._pagoService.anularPago(codPago, motivo, observacion).subscribe({
          next: (data) => {
            Swal.fire({
              title: 'Anulación Exitosa',
              text: data.msg,
              icon: 'success',
              confirmButtonText: 'Ok',
            });
            this.nuevoPago();
            this.cancelarAnulacion();
          },
          error: (err) => {
            const mensaje =
              err?.error?.msg ||
              err.message ||
              'No se pudo anular el pago. Intenta nuevamente.';
            Swal.fire({
              title: 'Error al Anular',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
      }
    });
  }
}
