import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { ServiciosService } from '../../../../services/mantenimiento/servicios/servicios.service';
import { CotizacionPersonalService } from '../../../../services/gestion/cotizaciones/cotizacion-personal.service';
import { IServicio } from '../../../../models/Mantenimiento/servicios.models';
import Swal from 'sweetalert2';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { DialogBuscarPacienteComponent } from './dialogs/dialog-paciente/dialog-buscar-paciente.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DialogBuscarSolicitanteComponent } from './dialogs/dialog-solicitante/dialog-buscar-solicitante.component';
import {
  ICotizacion,
  IHistorialCotizacion,
} from '../../../../models/Gestion/cotizacionPersona.models';
import { CotiPersonaPdfServiceService } from '../../../../services/utilitarios/pdf/cotizacion/coti-persona-pdf.service.service';
import { DialogPdfCotiPersonaComponent } from './dialogs/dialog-pdf/dialog-pdf-coti-persona/dialog-pdf-coti-persona.component';
import { IPersonalSaludParaConsultas } from '../../../../models/Mantenimiento/recursoHumano.models';
import { DialogMedicoComponent } from './dialogs/dialog-medico/dialog-medico.component';
import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';
import { IPaciente } from '../../../../models/Mantenimiento/paciente.models';
import { IRefMedico } from '../../../../models/Mantenimiento/referenciaMedico.models';
import { Router } from '@angular/router';
import { NumberValidatorService } from '../../../../services/utilitarios/validators/numberValidator/number-validator.service';

@Component({
  selector: 'app-gest-coti-persona',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    MatButtonModule,
    MatDialogModule,
    MatButtonToggleModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './gest-coti-persona.component.html',
  styleUrl: './gest-coti-persona.component.scss',
})
export class GestCotiPersonaComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _servicioService = inject(ServiciosService);
  private _cotizacionService = inject(CotizacionPersonalService);
  private dialog = inject(MatDialog);
  private _pdfService = inject(CotiPersonaPdfServiceService);
  private _router = inject(Router);
  private _numeroValidatorService = inject(NumberValidatorService);

  ngOnInit(): void {
    //this.camnbioEstadoRegistroPaciente();
    //this.camnbioEstadoRegistroSolicitante();
    this.ultimosServicios(0);
    this.listarServiciosFrecuentes();
    this.ultimasCotizaciones();
    // this.terminoBusquedaCotizacion.valueChanges.subscribe(() =>
    //   this.buscarCotizaciones(),
    // );
    this.configurarBusquedaCotizaciones();
  }

  public myFormCotizacion: FormGroup = this._fb.group({
    codCotizacion: [{ value: '', disabled: true }],
    fechaModificacion: [{ value: '', disabled: true }],
    version: [{ value: '', disabled: true }],
    estadoRegistroPaciente: true,
    clienteId: [{ value: '', required: true }],
    apePatCliente: [{ value: '', disabled: true }],
    apeMatCliente: [{ value: '', disabled: true }],
    nombreCliente: [{ value: '', disabled: true }],
    hc: [''],
    tipoDoc: [{ value: '', disabled: true }],
    nroDoc: [{ value: '', disabled: true }],
    estadoRegistroSolicitante: true,
    codSolicitante: [{ value: '', disabled: true }],
    solicitanteId: [],
    apePatRefMedico: [{ value: '', disabled: true }],
    apeMatRefMedico: [{ value: '', disabled: true }],
    nombreRefMedico: [{ value: '', disabled: true }],
    profesionSolicitante: [{ value: '', disabled: true }],
    colegiatura: [''],
    especialidadSolicitante: [{ value: '', disabled: true }],
    aplicarPrecioGlobal: false,
    aplicarDescuentoPorcentGlobal: false,
    sumaTotalesPrecioLista: 0,
    descuentoTotal: 0,
    descTotalMenosNuevoPrecio: 0,
    precioConDescGlobal: [{ value: '', disabled: true }],
    descuentoPorcentaje: [{ value: '', disabled: true }],
    subTotal: 0,
    igv: 0,
    total: 0,
    serviciosCotizacion: this._fb.array([], Validators.required),
    estadoCotizacion: '',
  });

  get serviciosCotizacion(): FormArray {
    return this.myFormCotizacion.get('serviciosCotizacion') as FormArray;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  columnasTablaServiciosCotizados: string[] = [
    'accion',
    'codigo',
    'tipo',
    'nombre',
    'medicoAtiende',
    'cantidad',
    'precioLista',
    // 'diferencia',
    'precioVenta',
    'descuentoPorcentaje',
    'nuevoPrecioVenta',
    'totalUnitario',
  ];
  dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

  // camnbioEstadoRegistroPaciente() {
  //   const estado = this.myFormCotizacion.get('estadoRegistroPaciente')?.value;

  //   if (estado) {
  //     // this.myFormCotizacion.get('codCliente')?.reset();
  //     this.myFormCotizacion.get('nombreCompleto')?.reset();
  //     this.myFormCotizacion.get('tipoDoc')?.reset();
  //     this.myFormCotizacion.get('nroDoc')?.reset();
  //     this.myFormCotizacion.get('nombreCompleto')?.disable();
  //     this.myFormCotizacion.get('tipoDoc')?.disable();
  //     this.myFormCotizacion.get('nroDoc')?.disable();
  //     document
  //       .getElementById('buscarPacienteModalBtn')
  //       ?.removeAttribute('disabled');
  //   } else {
  //     // this.myFormCotizacion.get('codCliente')?.reset();
  //     this.myFormCotizacion.get('nombreCompleto')?.reset();
  //     this.myFormCotizacion.get('tipoDoc')?.reset();
  //     this.myFormCotizacion.get('nroDoc')?.reset();
  //     this.myFormCotizacion.get('nombreCompleto')?.enable();
  //     this.myFormCotizacion.get('tipoDoc')?.enable();
  //     this.myFormCotizacion.get('nroDoc')?.enable();
  //     document
  //       .getElementById('buscarPacienteModalBtn')
  //       ?.setAttribute('disabled', 'true');
  //   }
  // }

  // camnbioEstadoRegistroSolicitante() {
  //   const estado = this.myFormCotizacion.get(
  //     'estadoRegistroSolicitante',
  //   )?.value;

  //   if (estado) {
  //     this.myFormCotizacion.get('codSolicitante')?.reset();
  //     this.myFormCotizacion.get('nomSolicitante')?.reset();
  //     this.myFormCotizacion.get('profesionSolicitante')?.reset();
  //     this.myFormCotizacion.get('colegiatura')?.reset();
  //     this.myFormCotizacion.get('especialidadSolicitante')?.reset();

  //     // this.myFormCotizacion.get('codSolicitante')?.disable();
  //     this.myFormCotizacion.get('nomSolicitante')?.disable();
  //     this.myFormCotizacion.get('profesionSolicitante')?.disable();
  //     this.myFormCotizacion.get('colegiatura')?.disable();
  //     this.myFormCotizacion.get('especialidadSolicitante')?.disable();

  //     document
  //       .getElementById('buscarSolicitanteModalBtn')
  //       ?.removeAttribute('disabled');
  //   } else {
  //     // this.myFormCotizacion.get('codSolicitante')?.reset();
  //     this.myFormCotizacion.get('nomSolicitante')?.reset();
  //     this.myFormCotizacion.get('profesionSolicitante')?.reset();
  //     this.myFormCotizacion.get('colegiatura')?.reset();
  //     this.myFormCotizacion.get('especialidadSolicitante')?.reset();

  //     this.myFormCotizacion.get('codSolicitante')?.enable();
  //     this.myFormCotizacion.get('nomSolicitante')?.enable();
  //     this.myFormCotizacion.get('profesionSolicitante')?.enable();
  //     this.myFormCotizacion.get('colegiatura')?.enable();
  //     this.myFormCotizacion.get('especialidadSolicitante')?.enable();

  //     document
  //       .getElementById('buscarSolicitanteModalBtn')
  //       ?.setAttribute('disabled', 'true');
  //   }
  // }

  // PACIENTES
  timeoutBusqueda: any;

  abrirDialogoBuscarPaciente() {
    const dialogRef = this.dialog.open(DialogBuscarPacienteComponent, {
      maxWidth: '1000px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((pacienteSeleccionado) => {
      if (pacienteSeleccionado) {
        this.setPacienteSeleccionado(pacienteSeleccionado);
      }
    });
  }

  setPacienteSeleccionado(paciente: IPaciente) {
    // Asigna los datos del paciente seleccionado al formulario
    this.myFormCotizacion.patchValue({
      clienteId: paciente._id,
      apePatCliente: paciente.apePatCliente,
      apeMatCliente: paciente.apeMatCliente,
      nombreCliente: paciente.nombreCliente,
      hc: paciente.hc,
      tipoDoc: paciente.tipoDoc,
      nroDoc: paciente.nroDoc,
    });
  }

  abrirDialogoBuscarSolicitante() {
    const dialogRef = this.dialog.open(DialogBuscarSolicitanteComponent, {
      maxWidth: '1000px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((solicitanteSeleccionado) => {
      if (solicitanteSeleccionado) {
        this.setSolicitanteSeleccionado(solicitanteSeleccionado);
      }
    });
  }

  setSolicitanteSeleccionado(solicitante: IRefMedico) {
    // Asigna los datos del paciente seleccionado al formulario
    //console.log('Solicitante seleccionado:', solicitante);
    this.myFormCotizacion.patchValue({
      solicitanteId: solicitante._id,
      codSolicitante: solicitante.codRefMedico,
      apePatRefMedico: solicitante.apePatRefMedico,
      apeMatRefMedico: solicitante.apeMatRefMedico,
      nombreRefMedico: solicitante.nombreRefMedico,
      profesionSolicitante:
        solicitante.profesionesRefMedico[0]?.profesionRef?.nombreProfesion ??
        '',
      colegiatura: solicitante.profesionesRefMedico[0]?.nroColegiatura ?? '',
      especialidadSolicitante:
        solicitante.profesionesRefMedico[0]?.especialidades[0]?.especialidadRef
          ?.nombreEspecialidad ?? '',
    });
  }

  quitarSolicitante() {
    this.myFormCotizacion.patchValue({
      solicitanteId: null,
      codSolicitante: null,
      apePatRefMedico: null,
      apeMatRefMedico: null,
      nombreRefMedico: null,
      profesionSolicitante: null,
      colegiatura: null,
      especialidadSolicitante: null,
    });
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  // COTIZACIONES

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorCotizaciones') paginatorCotizaciones!: MatPaginator;
  @ViewChild('MatPaginatorServicios') paginatorServicios!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourceCotizaciones.paginator = this.paginatorCotizaciones;
    this.dataSourceServicios.paginator = this.paginatorServicios;
  }

  columnasCotizaciones: string[] = [
    'codCotizacion',
    'paciente',
    'fecha',
    'estado',
  ];
  dataSourceCotizaciones = new MatTableDataSource<ICotizacion>();

  terminoBusquedaCotizacion = new FormControl('');
  cotizaciones: any[] = [];

  ultimasCotizaciones(): void {
    this._cotizacionService.getLastCotizacion().subscribe({
      next: (res: ICotizacion[]) => {
        this.dataSourceCotizaciones.data = res;
      },
      error: (err: any) => {
        this.dataSourceCotizaciones.data = [];
      },
    });
  }

  // buscarCotizaciones() {
  //   clearTimeout(this.timeoutBusqueda);

  //   this.timeoutBusqueda = setTimeout(() => {
  //     const termino = this.terminoBusquedaCotizacion.value?.trim() || '';

  //     if (termino.length >= 3) {
  //       this._cotizacionService
  //         .getCotizacion(termino)
  //         .subscribe((res: ICotizacion[]) => {
  //           this.dataSourceCotizaciones.data = res;
  //         });
  //     } else if (termino.length > 0) {
  //       this.dataSourceCotizaciones.data = [];
  //     } else {
  //       this.ultimasCotizaciones();
  //     }
  //   }, 250);
  // }

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
            this.ultimasCotizaciones(); // ← carga las cotizaciones recientes
          }
        }),
      )
      .subscribe();
  }

  columnasServicios: string[] = ['codigo', 'nombre', 'tipo', 'accion'];
  dataSourceServicios = new MatTableDataSource<IServicio>();
  dataSourceServiciosFrecuentes = new MatTableDataSource<IServicio>();

  // SERVICIOS
  terminoBusquedaServicio = new FormControl('');
  //servicios: IServicio[] = [];
  //serviciosFrecuentes: IServicio[] = [];

  ultimosServicios(cantidad: number): void {
    this._servicioService.getLastServicio(cantidad).subscribe({
      next: (res: IServicio[]) => {
        this.dataSourceServicios.data = res;
      },
      error: (err: any) => {
        this.dataSourceServicios.data = [];
      },
    });
  }

  listarServiciosFrecuentes() {
    this._servicioService.getAllFavoritesServicios().subscribe({
      next: (res: IServicio[]) => {
        this.dataSourceServiciosFrecuentes.data = res;
      },
      error: (err: any) => {
        this.dataSourceServiciosFrecuentes.data = [];
      },
    });
  }

  buscarServicio() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusquedaServicio.value?.trim() || '';

      if (termino.length >= 2) {
        this._servicioService
          .getServicio(termino)
          .subscribe((res: IServicio[]) => {
            this.dataSourceServicios.data = res;
          });
      } else if (termino.length > 0) {
        this.dataSourceServicios.data = [];
      } else {
        this.ultimosServicios(0);
      }
    }, 200);
  }

  verDetalle(servicio: IServicio) {
    // Implementar detalle de servicio
    // ...
  }

  seleccionarServicio(servicio: IServicio) {
    const existe = this.serviciosCotizacion.controls.some(
      (control) => control.value.codServicio === servicio.codServicio,
    );

    if (existe) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio ya agregado',
        text: 'Este servicio ya está en la cotización.',
      });
      return;
    }

    this.myFormCotizacion.get('aplicarPrecioGlobal')?.setValue(false);
    this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.setValue(false);

    const servicioForm = this._fb.group({
      servicioId: [servicio._id, Validators.required],
      codServicio: [servicio.codServicio, Validators.required],
      tipoServicio: [servicio.tipoServicio, Validators.required],
      nombreServicio: [servicio.nombreServicio, Validators.required],
      medicoAtiende: [servicio.medicoAtiende || null],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioLista: [
        servicio.precioServicio,
        [Validators.required, Validators.min(0)],
      ],
      diferencia: [0],
      precioVenta: [
        servicio.precioServicio,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/),
        ],
      ],
      descuentoPorcentaje: [0, [Validators.min(0), Validators.max(100)]],
      nuevoPrecioVenta: [
        servicio.precioServicio,
        [Validators.required, Validators.min(0)],
      ],
      totalUnitario: [
        servicio.precioServicio,
        [Validators.required, Validators.min(0)],
      ],
      profesionesAsociadas: [servicio.profesionesAsociadas || []],
    });

    this.serviciosCotizacion.push(servicioForm);
    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];
    this.calcularTotalUnitario(this.serviciosCotizacion.length - 1);
  }

  calcularTotalUnitario(index: number) {
    const servicio = this.serviciosCotizacion.at(index);
    const cantidad = servicio.get('cantidad')?.value || 0;
    const precioLista = servicio.get('precioLista')?.value || 0;
    let precioVenta = servicio.get('precioVenta')?.value || 0;
    let descuentoPorcentual = servicio.get('descuentoPorcentaje')?.value || 0;
    let precioListaTotal = cantidad * precioLista;
    let montoDescuento =
      Math.round(precioVenta * (descuentoPorcentual / 100) * 100) / 100;
    let nuevoPrecioVenta = precioVenta - montoDescuento;
    let totalUnitario = cantidad * nuevoPrecioVenta;
    let diferencia = Math.round((totalUnitario - precioListaTotal) * 100) / 100;
    servicio.get('diferencia')?.setValue(diferencia);
    servicio.get('nuevoPrecioVenta')?.setValue(nuevoPrecioVenta);

    if (totalUnitario < 0) {
      servicio.get('totalUnitario')?.setValue(0);
    } else {
      servicio.get('totalUnitario')?.setValue(totalUnitario);
    }

    this.calcularTotalGeneral();
  }

  removerServicio(index: number) {
    if (this.tienePagos) {
      console.warn(
        'No se puede eliminar un servicio porque ya tiene pagos asociados',
      );
      return;
    }

    this.serviciosCotizacion.removeAt(index);
    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];
    this.calcularTotalGeneral();
  }

  @ViewChild('inputPrecioGlobal')
  inputPrecioGlobal!: ElementRef<HTMLInputElement>;
  @ViewChild('inputPorcentajeGlobal')
  inputPorcentajeGlobal!: ElementRef<HTMLInputElement>;

  deshabilitarCamposServicios() {
    this.serviciosCotizacion.controls.forEach((control, index) => {
      const precioLista = parseFloat(control.get('precioLista')?.value) || 0;
      control.get('precioVenta')?.setValue(precioLista);
      control.get('descuentoPorcentaje')?.setValue(0);
      control.get('nuevoPrecioVenta')?.setValue(precioLista);
      control.get('diferencia')?.setValue(0);
      control.get('precioVenta')?.disable();
      control.get('descuentoPorcentaje')?.disable();
      this.calcularTotalUnitario(index);
    });
  }

  habilitarCamposServicios() {
    this.serviciosCotizacion.controls.forEach((control, index) => {
      control.get('precioVenta')?.enable();
      control.get('descuentoPorcentaje')?.enable();
      this.calcularTotalUnitario(index);
    });
  }

  cambioEstadoPrecioGlobal() {
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    if (estadoPrecioGlobal) {
      // Si se activa precio global, desactivar descuento porcentual
      this.myFormCotizacion
        .get('aplicarDescuentoPorcentGlobal')
        ?.setValue(false, { emitEvent: false });
    }
    this.resetDescuentoGlobal();
    this.myFormCotizacion.get('precioConDescGlobal')?.enable();
    this.myFormCotizacion.get('descuentoPorcentaje')?.disable();
    this.cambioEstadoDescuentosGlobal();
  }

  cambioEstadoDescuentoPorcentGlobal() {
    const estadoPorcentGlobal = this.myFormCotizacion.get(
      'aplicarDescuentoPorcentGlobal',
    )?.value;

    if (estadoPorcentGlobal) {
      // Si se activa descuento porcentual, desactivar precio global
      this.myFormCotizacion
        .get('aplicarPrecioGlobal')
        ?.setValue(false, { emitEvent: false });
    }
    this.resetDescuentoGlobal();
    this.myFormCotizacion.get('precioConDescGlobal')?.disable();
    this.myFormCotizacion.get('descuentoPorcentaje')?.enable();
    this.cambioEstadoDescuentosGlobal();
  }

  cambioEstadoDescuentosGlobal() {
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    const estadoPorcentGlobal = this.myFormCotizacion.get(
      'aplicarDescuentoPorcentGlobal',
    )?.value;

    if (estadoPrecioGlobal === false && estadoPorcentGlobal === false) {
      this.habilitarCamposServicios();
    } else {
      this.deshabilitarCamposServicios();
    }
  }

  resetDescuentoGlobal() {
    const totalPrecioLista = this.myFormCotizacion.get(
      'sumaTotalesPrecioLista',
    )?.value;
    this.myFormCotizacion
      .get('precioConDescGlobal')
      ?.setValue(totalPrecioLista);
    this.myFormCotizacion.get('descuentoPorcentaje')?.setValue(0);
  }

  // deshabilitaReseteaDescuentosGlobal() {
  //   this.myFormCotizacion
  //     .get('aplicarPrecioGlobal')
  //     ?.setValue(false, { emitEvent: false });
  //   this.myFormCotizacion.get('precioConDescGlobal')?.disable();
  //   this.myFormCotizacion.get('precioConDescGlobal')?.reset();
  // }

  // deshabilitaReseteaDescPorcentajeGlobal() {
  //   this.myFormCotizacion
  //     .get('aplicarDescuentoPorcentGlobal')
  //     ?.setValue(false, { emitEvent: false });
  //   this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.reset();
  // }

  resetCamposDescuentosGlobales() {
    this.myFormCotizacion.get('precioConDescGlobal')?.reset();
    this.myFormCotizacion.get('descuentoPorcentaje')?.reset();
  }

  // cambioEstadoDescGlobal(cargando: boolean) {
  //   const estadoPrecioGlobal = this.myFormCotizacion.get(
  //     'aplicarPrecioGlobal',
  //   )?.value;

  //   if (this.serviciosCotizacion.length === 0) {
  //     this.myFormCotizacion
  //       .get('aplicarPrecioGlobal')
  //       ?.setValue(false, { emitEvent: false });

  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'No hay servicios',
  //       text: 'Debe agregar al menos un servicio para aplicar un descuento global.',
  //       confirmButtonColor: '#3085d6',
  //       confirmButtonText: 'Entendido',
  //     });

  //     return;
  //   }

  //   if (estadoPrecioGlobal) {
  //     //this.myFormCotizacion.get('precioConDescGlobal')?.reset();
  //     this.myFormCotizacion.get('precioConDescGlobal')?.enable();

  //     // this.serviciosCotizacion.controls.forEach((control, index) => {
  //     //   const precioLista = parseFloat(control.get('precioLista')?.value) || 0;
  //     //   control.get('precioVenta')?.setValue(precioLista);
  //     //   control.get('precioVenta')?.disable();
  //     //   control.get('descuentoPorcentaje')?.setValue(0);
  //     //   control.get('descuentoPorcentaje')?.disable();
  //     //   control.get('nuevoPrecioVenta')?.setValue(precioLista);
  //     //   control.get('diferencia')?.setValue(0);
  //     //   this.calcularTotalUnitario(index);
  //     // });

  //     this.deshabilitarCamposServicios();

  //     if (cargando === false) {
  //       this.myFormCotizacion.get('precioConDescGlobal')?.setValue(0);

  //       this.inputPrecioGlobal.nativeElement.focus();
  //       this.inputPrecioGlobal.nativeElement.select();
  //     }
  //   } else {
  //     this.myFormCotizacion.get('precioConDescGlobal')?.reset();
  //     this.myFormCotizacion.get('precioConDescGlobal')?.disable();

  //     this.habilitarCamposServicios();
  //     // this.serviciosCotizacion.controls.forEach((control, index) => {
  //     //   control.get('precioVenta')?.enable();
  //     //   control.get('descuentoPorcentaje')?.enable();
  //     //   this.calcularTotalUnitario(index);
  //     // });
  //   }
  // }

  // cambioEstadoDescPorcentajeGlobal(cargando: boolean) {
  //   const estadoPorcentGlobal = this.myFormCotizacion.get(
  //     'aplicarDescuentoPorcentGlobal',
  //   )?.value;

  //   if (this.serviciosCotizacion.length === 0) {
  //     this.myFormCotizacion
  //       .get('aplicarDescuentoPorcentGlobal')
  //       ?.setValue(false, { emitEvent: false });

  //     // 🔥 SweetAlert de advertencia
  //     Swal.fire({
  //       icon: 'warning',
  //       title: 'No hay servicios',
  //       text: 'Debes agregar al menos un servicio antes de aplicar un descuento porcentual.',
  //       confirmButtonColor: '#3085d6',
  //       confirmButtonText: 'Entendido',
  //     });

  //     return;
  //   }

  //   if (estadoPorcentGlobal) {
  //     this.myFormCotizacion.get('descuentoPorcentaje')?.enable();

  //     //this.myFormCotizacion.get('descuentoPorcentaje')?.reset();

  //     this.serviciosCotizacion.controls.forEach((control, index) => {
  //       const precioLista = parseFloat(control.get('precioLista')?.value) || 0;
  //       control.get('precioVenta')?.setValue(precioLista);
  //       control.get('precioVenta')?.disable();
  //       control.get('descuentoPorcentaje')?.setValue(0);
  //       control.get('descuentoPorcentaje')?.disable();
  //       control.get('nuevoPrecioVenta')?.setValue(precioLista);
  //       control.get('diferencia')?.setValue(0);
  //       this.calcularTotalUnitario(index);
  //     });

  //     if (cargando === false) {
  //       this.myFormCotizacion.get('descuentoPorcentaje')?.setValue(0);

  //       this.inputPorcentajeGlobal.nativeElement.focus();
  //       this.inputPorcentajeGlobal.nativeElement.select();
  //     }
  //   } else {
  //     this.myFormCotizacion.get('descuentoPorcentaje')?.reset();
  //     this.myFormCotizacion.get('descuentoPorcentaje')?.disable();

  //     this.serviciosCotizacion.controls.forEach((control, index) => {
  //       control.get('descuentoPorcentaje')?.enable();
  //       this.calcularTotalUnitario(index);
  //     });
  //   }
  // }

  calcularTotalGeneral() {
    //const serviciosArray = this.serviciosCotizacion.controls as FormArray[];
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    //console.log("calcular total:", serviciosArray);

    let totalPrecioLista = 0;
    let sumaTotalUnitarios = 0;
    let precioGlobal = 0;

    // 1️⃣ Calcular la suma de precios de lista y la suma de totales unitarios
    this.serviciosCotizacion.controls.forEach((control) => {
      const precioLista = parseFloat(control.get('precioLista')?.value) || 0; // Obtener el precio de lista
      const totalUnitario =
        parseFloat(control.get('totalUnitario')?.value) || 0; // Obtener el total unitario
      const cantidad = parseFloat(control.get('cantidad')?.value) || 0; // Obtener la cantidad

      totalPrecioLista += precioLista * cantidad; // Sumar el precio de lista por la cantidad
      sumaTotalUnitarios += totalUnitario; // Sumar el total unitario
    });

    // 2️⃣ Obtener el precio global (si el usuario lo especificó, lo usa, sino, usa la suma de totales unitarios)
    if (estadoPrecioGlobal == true) {
      precioGlobal = parseFloat(
        this.myFormCotizacion.get('precioConDescGlobal')?.value,
      );
    } else {
      precioGlobal = sumaTotalUnitarios;
    }

    // 3️⃣ Obtener el descuento en porcentaje
    const descuentoPorcentaje =
      parseFloat(this.myFormCotizacion.get('descuentoPorcentaje')?.value) || 0;

    // 4️⃣ Calcular el total a pagar aplicando el descuento
    let totalAPagar =
      Math.round(precioGlobal * (1 - descuentoPorcentaje / 100) * 100) / 100;

    // 5️⃣ Calcular la diferencia total
    let diferenciaTotal =
      Math.round((totalAPagar - totalPrecioLista) * 100) / 100;

    let diferenciaConNuevoPrecio =
      Math.round((totalAPagar - sumaTotalUnitarios) * 100) / 100;

    // calcular subTotal
    let calSubTotal = Math.round((totalAPagar / 1.18) * 100) / 100;

    // calcular IGV
    let calIgv = Math.round((totalAPagar - calSubTotal) * 100) / 100;

    // 6️⃣ Actualizar los valores en el formulario
    this.myFormCotizacion.patchValue({
      sumaTotalesPrecioLista: Math.round(totalPrecioLista * 100) / 100,
      descuentoTotal: Math.round(diferenciaTotal * 100) / 100,
      descTotalMenosNuevoPrecio:
        Math.round(diferenciaConNuevoPrecio * 100) / 100,
      precioConDescGlobal: Math.round(precioGlobal * 100) / 100,
      subTotal: calSubTotal,
      igv: calIgv,
      total: Math.round(totalAPagar * 100) / 100,
    });
  }

  nuevaCotizacionPersona() {
    this.myFormCotizacion.reset();
    this.serviciosCotizacion.clear();
    this.myFormCotizacion.get('aplicarPrecioGlobal')?.enable();
    this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.enable();
    this.myFormCotizacion.get('precioConDescGlobal')?.disable();
    this.myFormCotizacion.get('descuentoPorcentaje')?.disable();
    // this.myFormCotizacion.get('estadoRegistroPaciente')?.enable();
    // this.myFormCotizacion.get('estadoRegistroSolicitante')?.enable();

    document
      .getElementById('buscarPacienteModalBtn')
      ?.removeAttribute('disabled');
    document
      .getElementById('buscarSolicitanteModalBtn')
      ?.removeAttribute('disabled');
    document
      .getElementById('quitarSolicitanteBtn')
      ?.removeAttribute('disabled');

    this.myFormCotizacion.patchValue({
      // estadoRegistroPaciente: true,
      // estadoRegistroSolicitante: true,
      sumaTotalesPrecioLista: 0,
      descuentoTotal: 0,
      subTotal: 0,
      igv: 0,
      total: 0,
    });

    //this.camnbioEstadoRegistroPaciente();
    //this.camnbioEstadoRegistroSolicitante();

    this.formSubmitted = false; // Reiniciar el estado del formulario
    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];
    this.resetearVariablesAuxiliares();
  }

  private resetearVariablesAuxiliares(): void {
    this.seSeleccionoCotizacion = false;
    this.tienePagos = false;
    this.terminoBusquedaServicio.reset();
    this.versionesDisponibles = [];
    this.versionActual = null;
    this.cotizacionCargada = null;
    this.ultimosServicios(0);
    this.filaSeleccionadaIndex = null;
  }

  private validarServiciosMedicoAtiende(): boolean {
    for (const control of this.serviciosCotizacion.controls) {
      const tipoServicio = control.get('tipoServicio')?.value;
      const medicoAtiende = control.get('medicoAtiende')?.value;
      if (
        (tipoServicio === 'Consulta' || tipoServicio === 'Ecografía') &&
        (!medicoAtiende || Object.keys(medicoAtiende).length === 0)
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Falta médico',
          text: `Debe seleccionar el médico que atiende para el servicio de tipo ${tipoServicio}.`,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Entendido',
        });
        return false;
      }
    }
    return true;
  }

  public formSubmitted: boolean = false;

  generarCotizacion() {
    this.formSubmitted = true;

    if (this.validarformulario() === false) return;

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la generación de esta cotización?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede registro coti');
        const formValue = this.myFormCotizacion.getRawValue();

        const body: ICotizacion = {
          codCotizacion: '',
          estadoCotizacion: 'GENERADA',
          historial: [
            {
              version: 1,
              fechaModificacion: new Date(),
              estadoRegistroPaciente: !!formValue.estadoRegistroPaciente,
              clienteId: formValue.clienteId,
              nombreCliente: formValue.nombreCliente,
              apePatCliente: formValue.apePatCliente,
              apeMatCliente: formValue.apeMatCliente,
              hc: formValue.hc,
              tipoDoc: formValue.tipoDoc,
              nroDoc: formValue.nroDoc,
              estadoRegistroSolicitante: !!formValue.estadoRegistroSolicitante,
              codSolicitante: formValue.codSolicitante,
              solicitanteId: formValue.solicitanteId,
              apePatRefMedico: formValue.apePatRefMedico,
              apeMatRefMedico: formValue.apeMatRefMedico,
              nombreRefMedico: formValue.nombreRefMedico,
              profesionSolicitante: formValue.profesionSolicitante,
              colegiatura: formValue.colegiatura,
              especialidadSolicitante: formValue.especialidadSolicitante,
              aplicarPrecioGlobal: !!formValue.aplicarPrecioGlobal,
              aplicarDescuentoPorcentGlobal:
                !!formValue.aplicarDescuentoPorcentGlobal,
              sumaTotalesPrecioLista: formValue.sumaTotalesPrecioLista,
              descuentoTotal: formValue.descuentoTotal,
              precioConDescGlobal: formValue.precioConDescGlobal || 0,
              descuentoPorcentaje: formValue.descuentoPorcentaje || 0,
              subTotal: formValue.subTotal,
              igv: formValue.igv,
              total: formValue.total,
              serviciosCotizacion: formValue.serviciosCotizacion,
            },
          ],
        };

        console.log('📌 **Body antes de enviar**:', body);

        this._cotizacionService.generarCotizacion(body).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('Cotización registrada');
              this.ultimasCotizaciones();
              this.nuevaCotizacionPersona();
            } else {
              const mensaje = res.msg || 'Ocurrió un error inesperado.';
              this.mostrarAlertaError(mensaje);
            }
          },
          error: (error) => {
            const mensaje =
              error?.error?.msg || 'Error inesperado al registrar.';
            this.mostrarAlertaError(mensaje);
          },
        });
      }
    });
  }

  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: tipo + ' exitosamente',
      text: '¿Qué deseas hacer a continuación?',
      icon: 'success',
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Ir a Pagos',
      cancelButtonText: 'Continuar aquí',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (result.isConfirmed) {
        this._router.navigate(['/pages/pagoCotiPersona']);
      }
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'ERROR!',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Ok',
    });
  }

  generarVersionCotizacionPersona() {
    if (!this.seSeleccionoCotizacion) {
      Swal.fire({
        icon: 'warning',
        title: 'Seleccione una cotización',
        text: 'Debe seleccionar una cotización antes de generar una nueva versión.',
      });
      return;
    }

    if (this.validarformulario() === false) return;

    Swal.fire({
      title: '¿Generar nueva versión?',
      text: 'Se creará una nueva versión de la cotización actual.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Obtener los valores actuales del formulario
        const formValue = this.myFormCotizacion.getRawValue();

        // Obtener el último historial de la cotización
        const ultimaVersion =
          this.cotizacionCargada.historial[
            this.cotizacionCargada.historial.length - 1
          ];

        const nuevaVersion: IHistorialCotizacion = {
          version: ultimaVersion + 1,
          fechaModificacion: new Date(),
          estadoRegistroPaciente: !!formValue.estadoRegistroPaciente,
          clienteId: formValue.clienteId,
          nombreCliente: formValue.nombreCliente,
          apePatCliente: formValue.apePatCliente,
          apeMatCliente: formValue.apeMatCliente,
          hc: formValue.hc,
          tipoDoc: formValue.tipoDoc,
          nroDoc: formValue.nroDoc,
          estadoRegistroSolicitante: !!formValue.estadoRegistroSolicitante,
          codSolicitante: formValue.codSolicitante,
          solicitanteId: formValue.solicitanteId,
          apePatRefMedico: formValue.apePatRefMedico,
          apeMatRefMedico: formValue.apeMatRefMedico,
          nombreRefMedico: formValue.nombreRefMedico,
          profesionSolicitante: formValue.profesionSolicitante,
          colegiatura: formValue.colegiatura,
          especialidadSolicitante: formValue.especialidadSolicitante,
          aplicarPrecioGlobal: !!formValue.aplicarPrecioGlobal,
          aplicarDescuentoPorcentGlobal:
            !!formValue.aplicarDescuentoPorcentGlobal,
          sumaTotalesPrecioLista: formValue.sumaTotalesPrecioLista,
          descuentoTotal: formValue.descuentoTotal,
          precioConDescGlobal: formValue.precioConDescGlobal || 0,
          descuentoPorcentaje: formValue.descuentoPorcentaje || 0,
          subTotal: formValue.subTotal,
          igv: formValue.igv,
          total: formValue.total,
          serviciosCotizacion: formValue.serviciosCotizacion,
        };

        // Crear el objeto de la nueva cotización con los datos del paciente y la nueva versión
        const nuevaCotizacion: ICotizacion = {
          codCotizacion: this.cotizacionCargada.codCotizacion, // Mismo código
          estadoCotizacion: 'MODIFICADA',
          // Historial con la nueva versión agregada
          historial: [nuevaVersion],
        };

        this._cotizacionService.generarNuevaVersion(nuevaCotizacion).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('Nueva versión generada');
              this.ultimasCotizaciones();
              this.nuevaCotizacionPersona();
            } else {
              const mensaje = res.msg || 'Ocurrió un error inesperado.';
              this.mostrarAlertaError(mensaje);
            }
          },
          error: (error) => {
            const mensaje =
              error?.error?.msg || 'Error inesperado al generar la versión.';
            this.mostrarAlertaError(mensaje);
          },
        });
      }
    });
  }

  validarformulario(): boolean {
    const nomClienteControl = this.myFormCotizacion.get('nombreCliente');
    const nomClienteValor = nomClienteControl
      ? nomClienteControl.getRawValue()
      : '';

    if (!nomClienteValor || nomClienteValor.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Falta paciente',
        text: 'Debe ingresar o seleccionar el nombre del paciente.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return false;
    }

    if (this.serviciosCotizacion.length === 0) {
      console.log('No hay servicios en la cotización');
      Swal.fire({
        icon: 'warning',
        title: 'No hay servicios',
        text: 'Debe agregar al menos un servicio a la cotización.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
      return false;
    }

    if (this.myFormCotizacion.invalid) {
      this.myFormCotizacion.markAllAsTouched();

      // Depurar formulario para ver todos los errores
      // this.depurarFormulario();

      // Mostrar errores específicos
      this.mostrarErroresFormulario();
      return false;
    }

    if (!this.validarServiciosMedicoAtiende()) {
      return false;
    }

    return true;
  }

  // Método para mostrar errores específicos del formulario
  mostrarErroresFormulario(): void {
    const errores: string[] = [];

    // Verificar errores en el formulario principal
    Object.keys(this.myFormCotizacion.controls).forEach((key) => {
      const control = this.myFormCotizacion.get(key);
      if (control && control.invalid) {
        const erroresControl = this.obtenerMensajeError(key, control.errors);
        if (erroresControl) {
          errores.push(`${key}: ${erroresControl}`);
        }
      }
    });

    // Verificar errores en los servicios (FormArray)
    this.serviciosCotizacion.controls.forEach((servicioControl, index) => {
      const servicioGroup = servicioControl as FormGroup;
      if (servicioGroup.invalid) {
        Object.keys(servicioGroup.controls).forEach((key) => {
          const control = servicioGroup.get(key);
          if (control && control.invalid) {
            const erroresControl = this.obtenerMensajeError(
              key,
              control.errors,
            );
            if (erroresControl) {
              errores.push(`Servicio ${index + 1} - ${key}: ${erroresControl}`);
            }
          }
        });
      }
    });

    // Mostrar los errores encontrados
    if (errores.length > 0) {
      console.log('Errores encontrados:', errores);

      Swal.fire({
        icon: 'error',
        title: 'Errores en el formulario',
        html: `<div style="text-align: left;">
          <p>Se encontraron los siguientes errores:</p>
          <ul>
            ${errores.map((error) => `<li>${error}</li>`).join('')}
          </ul>
        </div>`,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });
    }
  }

  // Método auxiliar para obtener mensajes de error legibles
  obtenerMensajeError(campo: string, errors: any): string {
    if (!errors) return '';

    if (errors['required']) return 'Campo requerido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['pattern']) return 'Formato inválido';

    // Agregar más validaciones según sea necesario
    return Object.keys(errors).join(', ');
  }

  // Método de depuración para mostrar el estado completo del formulario
  // depurarFormulario(): void {
  //   console.log('=== ESTADO DEL FORMULARIO ===');
  //   console.log('Form Valid:', this.myFormCotizacion.valid);
  //   console.log('Form Value:', this.myFormCotizacion.value);
  //   console.log('Form Raw Value:', this.myFormCotizacion.getRawValue());
  //   console.log('Form Errors:', this.myFormCotizacion.errors);

  //   // Estado de cada control principal
  //   Object.keys(this.myFormCotizacion.controls).forEach((key) => {
  //     const control = this.myFormCotizacion.get(key);
  //     if (control && control.invalid) {
  //       console.log(`❌ ${key}:`, {
  //         value: control.value,
  //         errors: control.errors,
  //         valid: control.valid,
  //       });
  //     }
  //   });

  //   // Estado de servicios
  //   console.log('=== SERVICIOS ===');
  //   this.serviciosCotizacion.controls.forEach((servicioControl, index) => {
  //     const servicioGroup = servicioControl as FormGroup;
  //     console.log(`Servicio ${index + 1}:`, {
  //       valid: servicioGroup.valid,
  //       value: servicioGroup.value,
  //       errors: servicioGroup.errors,
  //     });

  //     if (servicioGroup.invalid) {
  //       Object.keys(servicioGroup.controls).forEach((key) => {
  //         const control = servicioGroup.get(key);
  //         if (control && control.invalid) {
  //           console.log(`  ❌ ${key}:`, {
  //             value: control.value,
  //             errors: control.errors,
  //           });
  //         }
  //       });
  //     }
  //   });
  // }

  //inicio variables axuliares
  seSeleccionoCotizacion = false; // Indica si se ha seleccionado una cotización y borra el botón de generar cotización
  tienePagos: boolean = false;
  versionesDisponibles: number[] = [];
  versionActual: number | null = null;
  cotizacionCargada: any;
  cotizacionParaImprimir: any;
  filaSeleccionadaIndex: number | null = null;
  //fin variables axuliares

  cargarCotizacion(cotizacion: any, index: number) {
    this.seSeleccionoCotizacion = true; //Ocultamos el botón de generar cotización
    this.filaSeleccionadaIndex = index;
    this.cotizacionCargada = cotizacion;

    if (
      cotizacion.estadoCotizacion === 'PAGO PARCIAL' ||
      cotizacion.estadoCotizacion === 'PAGO TOTAL'
    ) {
      this.tienePagos = true;
    } else if (
      cotizacion.estadoCotizacion === 'GENERADA' ||
      cotizacion.estadoCotizacion === 'MODIFICADA' ||
      cotizacion.estadoCotizacion === 'PAGO ANULADO'
    ) {
      this.tienePagos = false;
    }

    this.versionesDisponibles = cotizacion.historial
      .map((h: any) => h.version as number)
      .sort((a: number, b: number) => a - b);
    const ultimaVersion = cotizacion.historial[cotizacion.historial.length - 1];
    this.versionActual = ultimaVersion.version;

    this.myFormCotizacion.patchValue({
      codCotizacion: cotizacion.codCotizacion,
      version: ultimaVersion.version,
    });

    this.cargarVersion(ultimaVersion.version);
  }

  cargarVersion(version: number) {
    const historialVersion = this.cotizacionCargada.historial.find(
      (h: any) => h.version === version,
    );

    if (!historialVersion) return;

    this.cotizacionParaImprimir = {
      ...this.cotizacionCargada,
      historial: [historialVersion], // Sobrescribimos solo con la versión activa
    };

    const fechaFormateada = formatDate(
      historialVersion.fechaModificacion,
      'dd/MM/yyyy HH:mm',
      'es-PE',
    );

    // const nombre = historialVersion.nombreCompleto;
    // let nombreGrabar = '';

    // if (nombre) {
    //   nombreGrabar = historialVersion.nombreCompleto;
    // } else {
    //   nombreGrabar =
    //     `${historialVersion.apePatCliente} ${historialVersion.apeMatCliente} ${historialVersion.nombreCliente}`.trim();
    // }

    this.myFormCotizacion.patchValue({
      ...historialVersion,
      fechaModificacion: fechaFormateada,

      // estadoRegistroPaciente: historialVersion.estadoRegistroPaciente,
      // fechaModificacion: fechaFormateada,
      // // nombreCompleto: nombreGrabar,
      // apePatCliente: historialVersion.apePatCliente,
      // apeMatCliente: historialVersion.apeMatCliente,
      // nombreCliente: historialVersion.nombreCliente,
      // clienteId: historialVersion.clienteId,
      // hc: historialVersion.hc,
      // tipoDoc: historialVersion.tipoDoc,
      // nroDoc: historialVersion.nroDoc,
      // estadoRegistroSolicitante: historialVersion.estadoRegistroSolicitante,
      // //codSolicitante: historialVersion.codSolicitante || '',
      // // nomSolicitante: historialVersion.nomSolicitante || '',
      // apePatRefMedico: historialVersion.apePatRefMedico || '',
      // apeMatRefMedico: historialVersion.apeMatRefMedico || '',
      // nombreRefMedico: historialVersion.nombreRefMedico || '',
      // solicitanteId: historialVersion.solicitanteId,
      // profesionSolicitante: historialVersion.profesionSolicitante || '',
      // //colegiatura: historialVersion.colegiatura || '',
      // especialidadSolicitante: historialVersion.especialidadSolicitante || '',
      // aplicarPrecioGlobal: historialVersion.aplicarPrecioGlobal,
      // aplicarDescuentoPorcentGlobal:
      //   historialVersion.aplicarDescuentoPorcentGlobal,
      // sumaTotalesPrecioLista: historialVersion.sumaTotalesPrecioLista,
      // descuentoTotal: historialVersion.descuentoTotal || 0,
      // precioConDescGlobal: historialVersion.precioConDescGlobal || 0,
      // descuentoPorcentaje: historialVersion.descuentoPorcentaje || 0,
      // subTotal: historialVersion.subTotal,
      // igv: historialVersion.igv,
      // total: historialVersion.total,
    });

    if (this.tienePagos === true) {
      this.myFormCotizacion.get('aplicarPrecioGlobal')?.disable();
      this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.disable();
      this.myFormCotizacion.get('precioConDescGlobal')?.disable();
      this.myFormCotizacion.get('descuentoPorcentaje')?.disable();

      // this.myFormCotizacion.get('estadoRegistroPaciente')?.disable();
      // this.myFormCotizacion.get('estadoRegistroSolicitante')?.disable();
      // this.myFormCotizacion.get('nombreCompleto')?.disable();
      // this.myFormCotizacion.get('tipoDoc')?.disable();
      // this.myFormCotizacion.get('nroDoc')?.disable();
      // this.myFormCotizacion.get('codSolicitante')?.disable();
      // this.myFormCotizacion.get('nomSolicitante')?.disable();
      // this.myFormCotizacion.get('profesionSolicitante')?.disable();
      // this.myFormCotizacion.get('colegiatura')?.disable();
      // this.myFormCotizacion.get('especialidadSolicitante')?.disable();

      document
        .getElementById('buscarPacienteModalBtn')
        ?.setAttribute('disabled', 'true');
      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.setAttribute('disabled', 'true');
      document
        .getElementById('quitarSolicitanteBtn')
        ?.setAttribute('disabled', 'true');

      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
            servicioId: [servicio.servicioId, Validators.required],
            codServicio: [servicio.codServicio, Validators.required],
            tipoServicio: [servicio.tipoServicio, Validators.required],
            nombreServicio: [servicio.nombreServicio, Validators.required],
            profesionesAsociadas: [servicio.profesionesAsociadas || null],
            medicoAtiende: [servicio.medicoAtiende || null],
            cantidad: [
              { value: servicio.cantidad, disabled: true },
              [Validators.required, Validators.min(1)],
            ],
            precioLista: [
              servicio.precioLista,
              [Validators.required, Validators.min(0)],
            ],
            diferencia: [servicio.diferencia],
            precioVenta: [
              { value: servicio.precioVenta, disabled: true },
              [Validators.required, Validators.min(0)],
            ],

            descuentoPorcentaje: [
              { value: servicio.descuentoPorcentaje, disabled: true },
              [Validators.min(0), Validators.max(100)],
            ],
            nuevoPrecioVenta: [
              { value: servicio.nuevoPrecioVenta, disabled: true },
              [Validators.required, Validators.min(0)],
            ],
            totalUnitario: [
              servicio.totalUnitario,
              [Validators.required, Validators.min(0)],
            ],
          }),
        );
      });

      this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
        .controls as FormGroup[];
    } else {
      // this.myFormCotizacion.get('estadoRegistroPaciente')?.enable();
      // this.myFormCotizacion.get('estadoRegistroSolicitante')?.enable();

      //campos cliente
      // if (this.myFormCotizacion.get('estadoRegistroPaciente')?.value === true) {
      //   document
      //     .getElementById('buscarPacienteModalBtn')
      //     ?.removeAttribute('disabled');
      //   this.myFormCotizacion.get('nombreCompleto')?.disable();
      //   this.myFormCotizacion.get('tipoDoc')?.disable();
      //   this.myFormCotizacion.get('nroDoc')?.disable();
      // } else {
      //   document
      //     .getElementById('buscarPacienteModalBtn')
      //     ?.setAttribute('disabled', 'true');
      //   this.myFormCotizacion.get('nombreCompleto')?.enable();
      //   this.myFormCotizacion.get('tipoDoc')?.enable();
      //   this.myFormCotizacion.get('nroDoc')?.enable();
      // }

      document
        .getElementById('buscarPacienteModalBtn')
        ?.removeAttribute('disabled');

      //campos solicitante
      // if (
      //   this.myFormCotizacion.get('estadoRegistroSolicitante')?.value === true
      // ) {
      //   document
      //     .getElementById('buscarSolicitanteModalBtn')
      //     ?.removeAttribute('disabled');
      //   this.myFormCotizacion.get('codSolicitante')?.disable();
      //   this.myFormCotizacion.get('nomSolicitante')?.disable();
      //   this.myFormCotizacion.get('profesionSolicitante')?.disable();
      //   this.myFormCotizacion.get('colegiatura')?.disable();
      //   this.myFormCotizacion.get('especialidadSolicitante')?.disable();
      // } else {
      //   document
      //     .getElementById('buscarSolicitanteModalBtn')
      //     ?.setAttribute('disabled', 'true');
      //   this.myFormCotizacion.get('codSolicitante')?.enable();
      //   this.myFormCotizacion.get('nomSolicitante')?.enable();
      //   this.myFormCotizacion.get('profesionSolicitante')?.enable();
      //   this.myFormCotizacion.get('colegiatura')?.enable();
      //   this.myFormCotizacion.get('especialidadSolicitante')?.enable();
      // }

      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.removeAttribute('disabled');
      document
        .getElementById('quitarSolicitanteBtn')
        ?.removeAttribute('disabled');

      this.myFormCotizacion.get('aplicarPrecioGlobal')?.enable();
      this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.enable();

      // 📌 Cargar servicios
      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
            servicioId: [servicio.servicioId, Validators.required],
            codServicio: [servicio.codServicio, Validators.required],
            tipoServicio: [servicio.tipoServicio, Validators.required],
            nombreServicio: [servicio.nombreServicio, Validators.required],
            profesionesAsociadas: [servicio.profesionesAsociadas || null],
            medicoAtiende: [servicio.medicoAtiende || null],
            cantidad: [
              servicio.cantidad,
              [Validators.required, Validators.min(1)],
            ],
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
              { value: servicio.nuevoPrecioVenta, disabled: true },
              [Validators.required, Validators.min(0)],
            ],
            totalUnitario: [
              servicio.totalUnitario,
              [Validators.required, Validators.min(0)],
            ],
          }),
        );
      });
      this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
        .controls as FormGroup[];
    }

    this.cambioEstadoDescuentosGlobal();
    this.myFormCotizacion.get('precioConDescGlobal')?.disable();
    this.myFormCotizacion.get('descuentoPorcentaje')?.disable();
    if (historialVersion.aplicarPrecioGlobal) {
      this.myFormCotizacion.get('precioConDescGlobal')?.enable();
    }
    if (historialVersion.aplicarDescuentoPorcentGlobal) {
      this.myFormCotizacion.get('descuentoPorcentaje')?.enable();
    }
    // this.cambioEstadoDescGlobal(true);
    // this.cambioEstadoDescPorcentajeGlobal(true);
  }

  cambiarVersion(version: number) {
    if (!this.seSeleccionoCotizacion) return;

    const indexActual = this.versionesDisponibles.indexOf(
      this.versionActual as number,
    );

    if (indexActual === -1) return;

    const nuevoIndex = indexActual + version;

    if (nuevoIndex >= 0 && nuevoIndex < this.versionesDisponibles.length) {
      this.versionActual = this.versionesDisponibles[nuevoIndex];
      this.myFormCotizacion.patchValue({ version: this.versionActual });
      this.cargarVersion(this.versionActual);
    }
  }

  irUltimaVersion() {
    if (!this.seSeleccionoCotizacion) return;
    if (this.versionesDisponibles.length === 1) return;
    this.versionActual = Math.max(...this.versionesDisponibles);
    this.myFormCotizacion.patchValue({ version: this.versionActual });
    this.cargarVersion(this.versionActual);
  }

  //pdfSrc: SafeResourceUrl | null = null;

  async generarPDF(preview: boolean) {
    // Implementar generación de PDF
    const pdfSrc = await this._pdfService.generarPDFCotizacion(
      this.cotizacionParaImprimir,
      preview,
    );

    if (preview && pdfSrc) {
      this.dialog.open(DialogPdfCotiPersonaComponent, {
        data: { pdfSrc, cotizacionData: this.cotizacionParaImprimir },
        width: '70vw',
        height: '95vh',
        maxWidth: '95vw',
        panelClass: 'custom-dialog-container',
      });
    }
  }

  abrirDialogoMedicoAtiende(index: any): void {
    const servicio = this.serviciosCotizacion.at(index);
    const profesionesAsociadas = servicio.value.profesionesAsociadas || [];
    const dialogRef = this.dialog.open(DialogMedicoComponent, {
      width: '500px',
      data: {
        profesionesAsociadas,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((medico: IPersonalSaludParaConsultas | undefined) => {
        if (medico) {
          servicio.get('medicoAtiende')?.setValue({
            codRecHumano: medico.codRecHumano,
            medicoId: medico._id,
            nombreRecHumano: medico.nombreRecHumano,
            apePatRecHumano: medico.apePatRecHumano,
            apeMatRecHumano: medico.apeMatRecHumano,
            nroColegiatura: medico.nroColegiatura,
            rne: medico.rne,
          });
        }
        //console.log('Medico atiende:', servicio.get('medicoAtiende')?.value);
      });
  }

  validarEntero(event: KeyboardEvent) {
    return this._numeroValidatorService.validarNumeroEntero(event);
  }
}
