import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { ServiciosService } from '../../../../services/mantenimiento/servicios/servicios.service';
import { IServicio } from '../../../../models/Mantenimiento/servicios.models';
import Swal from 'sweetalert2';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginator } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged, filter, tap } from 'rxjs';
import { Router } from '@angular/router';
import { NumberValidatorService } from '../../../../services/utilitarios/validators/numberValidator/number-validator.service';
import { DialogBuscarEmpresaComponent } from './dialogs/dialog-empresa/dialog-buscar-empresa.component';
import {
  IEmpresa,
  IPersonaContacto,
} from '../../../../models/Mantenimiento/empresa.models';
import { CotizacionEmpresaService } from '../../../../services/gestion/cotizaciones/cotizacionEmpresa/cotizacion-empresa.service';
import {
  ICotizacionEmpresa,
  IHistorialCotizacionEmpresa,
} from '../../../../models/Gestion/cotizacionEmpresa.models';
import { DialogPdfCotiEmpresaComponent } from './dialogs/dialog-pdf/dialog-pdf-coti-empresa/dialog-pdf-coti-empresa.component';
import { CotiEmpresaPdfService } from '../../../../services/utilitarios/pdf/cotizacion/coti-empresas/coti-empresa-pdf.service';

@Component({
  selector: 'app-gest-coti-empresa',
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
  templateUrl: './gest-coti-empresa.component.html',
  styleUrl: './gest-coti-empresa.component.scss',
})
export class GestCotiEmpresaComponent {
  private _fb = inject(FormBuilder);
  private _servicioService = inject(ServiciosService);
  private _cotizacionService = inject(CotizacionEmpresaService);
  private dialog = inject(MatDialog);
  private _pdfService = inject(CotiEmpresaPdfService);
  private _router = inject(Router);
  private _numeroValidatorService = inject(NumberValidatorService);

  ngOnInit(): void {
    this.ultimosServicios(0);
    this.listarServiciosFrecuentes();
    this.ultimasCotizaciones();
    this.configurarBusquedaCotizaciones();
  }

  public myFormCotizacion: FormGroup = this._fb.group({
    codCotizacion: [{ value: '', disabled: true }],
    fechaModificacion: [{ value: '', disabled: true }],
    version: [{ value: '', disabled: true }],
    empresaId: [{ value: '', required: true }],
    ruc: [{ value: null, disabled: true }],
    razonSocial: [{ value: null, disabled: true }],
    dirigidoA_Id: [{ value: null, required: true }],
    formaPago: [{ value: null, required: true }],
    diasCredito: [null],
    entregaResultados: [null],
    validez: [null],
    aplicarPrecioGlobal: false,
    precioConDescGlobal: [{ value: '', disabled: true }],
    sumaTotalesPrecioLista: 0,
    sumaTotalesPrecioVenta: 0,
    cantidadGlobal: [{ value: '', disabled: true }],
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
    'cantidad',
    'precioLista',
    // 'diferencia',
    'precioVenta',
    // 'nuevoPrecioVenta',
    'totalUnitario',
  ];
  dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

  // EPRESAS
  timeoutBusqueda: any;

  abrirDialogoBuscarEmpresa() {
    const dialogRef = this.dialog.open(DialogBuscarEmpresaComponent, {
      maxWidth: '1000px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((empresaSeleccionada) => {
      if (empresaSeleccionada) {
        this.setEmpresaSeleccionada(empresaSeleccionada);
      }
    });
  }

  setEmpresaSeleccionada(empresa: IEmpresa) {
    // Asigna los datos de la empresa seleccionada al formulario
    this.myFormCotizacion.patchValue({
      empresaId: empresa._id,
      ruc: empresa.ruc,
      razonSocial: empresa.razonSocial,
    });
    this.contactos = empresa.personasContacto;
  }

  //CONTACTOS DE EMPRESA

  contactos: IPersonaContacto[] = [];

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
    'empresa',
    'fecha',
    'estado',
  ];
  dataSourceCotizaciones = new MatTableDataSource<ICotizacionEmpresa>();

  terminoBusquedaCotizacion = new FormControl('');
  cotizaciones: any[] = [];

  ultimasCotizaciones(): void {
    this._cotizacionService.getUltimasCotizacionesEmpresa().subscribe({
      next: (res: ICotizacionEmpresa[]) => {
        this.dataSourceCotizaciones.data = res;
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
            this._cotizacionService
              .buscarCotizacionesEmpresa(termino)
              .subscribe({
                next: (res: ICotizacionEmpresa[]) => {
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
    this._servicioService.getAllFavoritesServiciosEmpresa().subscribe({
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

    const servicioForm = this._fb.group({
      servicioId: [servicio._id, Validators.required],
      codServicio: [servicio.codServicio, Validators.required],
      tipoServicio: [servicio.tipoServicio, Validators.required],
      nombreServicio: [servicio.nombreServicio, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioLista: [
        this.redondear(servicio.precioServicio / 1.18),
        [Validators.required, Validators.min(0)],
      ],
      diferencia: [0],
      precioVenta: [
        this.redondear(servicio.precioServicio / 1.18),
        [
          Validators.required,
          this._numeroValidatorService.twoDecimalsValidator(2),
        ],
      ],
      totalUnitario: [
        servicio.precioServicio,
        [Validators.required, Validators.min(0)],
      ],
    });

    this.serviciosCotizacion.push(servicioForm);
    this.dataSourceServiciosCotizados.data = this.serviciosCotizacion
      .controls as FormGroup[];
    this.calcularTotalUnitario(this.serviciosCotizacion.length - 1);
  }

  redondear(numero: number): number {
    return Math.round((numero + Number.EPSILON) * 1000) / 1000;
  }

  calcularTotalUnitario(index: number) {
    const servicio = this.serviciosCotizacion.at(index);
    const cantidad = servicio.get('cantidad')?.value || 0;
    const precioLista = servicio.get('precioLista')?.value || 0;
    let precioVenta = servicio.get('precioVenta')?.value || 0;
    let precioListaTotal = cantidad * precioLista;
    let totalUnitario = this.redondear(cantidad * precioVenta);
    let diferencia = this.redondear(totalUnitario - precioListaTotal);
    servicio.get('diferencia')?.setValue(diferencia);

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

  deshabilitarCamposServicios() {
    this.serviciosCotizacion.controls.forEach((control, index) => {
      const precioLista = parseFloat(control.get('precioLista')?.value) || 0;
      control.get('precioVenta')?.setValue(precioLista);
      control.get('nuevoPrecioVenta')?.setValue(precioLista);
      control.get('diferencia')?.setValue(0);
      control.get('precioVenta')?.disable();
      this.calcularTotalUnitario(index);
    });
  }

  habilitarCamposServicios() {
    this.serviciosCotizacion.controls.forEach((control, index) => {
      control.get('precioVenta')?.enable();
      this.calcularTotalUnitario(index);
    });
  }

  cambioEstadoPrecioGlobal() {
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    this.resetDescuentoGlobal();

    if (estadoPrecioGlobal) {
      this.myFormCotizacion.get('precioConDescGlobal')?.enable();
      this.myFormCotizacion.get('cantidadGlobal')?.enable?.();

      this.serviciosCotizacion.controls.forEach((control) => {
        control.get('cantidad')?.disable();
        control.get('cantidad')?.setValue(1);
        control.get('precioVenta')?.disable();
      });
    } else {
      this.myFormCotizacion.get('precioConDescGlobal')?.setValue('');
      this.myFormCotizacion.get('precioConDescGlobal')?.disable();
      this.myFormCotizacion.get('cantidadGlobal')?.setValue('');
      this.myFormCotizacion.get('cantidadGlobal')?.disable?.();

      this.serviciosCotizacion.controls.forEach((control) => {
        control.get('cantidad')?.enable();
        control.get('precioVenta')?.enable();
      });
    }
  }

  resetDescuentoGlobal() {
    const totalPrecioVenta = this.myFormCotizacion.get(
      'sumaTotalesPrecioVenta',
    )?.value;
    this.myFormCotizacion
      .get('precioConDescGlobal')
      ?.setValue(totalPrecioVenta);
  }

  calcularTotalGeneral() {
    //const serviciosArray = this.serviciosCotizacion.controls as FormArray[];
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    if (estadoPrecioGlobal == false) {
      let totalPrecioLista = 0;
      let sumaTotalUnitarios = 0;
      let totalPrecioVenta = 0;
      let calSubTotal = 0;
      let calIgv = 0;
      let totalAPagar = 0;
      // 1️⃣ Calcular la suma de precios de lista y la suma de totales unitarios
      this.serviciosCotizacion.controls.forEach((control) => {
        const precioLista = parseFloat(control.get('precioLista')?.value) || 0; // Obtener el precio de lista
        const precioVenta = parseFloat(control.get('precioVenta')?.value) || 0; // Obtener el precio de lista
        // const totalUnitario =
        //   parseFloat(control.get('totalUnitario')?.value) || 0; // Obtener el total unitario
        const cantidad = parseInt(control.get('cantidad')?.value) || 0; // Obtener la cantidad

        totalPrecioLista += this.redondear(precioLista * cantidad); // Sumar el precio de lista por la cantidad
        totalPrecioVenta += this.redondear(precioVenta * cantidad); // Sumar el precio de venta por la cantidad
      });

      calSubTotal = totalPrecioVenta;
      calIgv = this.redondear((calSubTotal * 180) / 1000);
      totalAPagar = this.redondear(calSubTotal + calIgv);

      this.myFormCotizacion.patchValue({
        sumaTotalesPrecioVenta: this.redondear(totalPrecioVenta),
        subTotal: this.redondear(calSubTotal),
        igv: this.redondear(calIgv),
        total: this.redondear(totalAPagar),
      });
    } else {
      let calSubTotal = 0;
      let calIgv = 0;
      let totalAPagar = 0;
      let precioGlobal = 0;
      let cantidad = 0;

      precioGlobal = parseFloat(
        this.myFormCotizacion.get('precioConDescGlobal')?.value,
      );
      cantidad = parseInt(this.myFormCotizacion.get('cantidadGlobal')?.value);

      calSubTotal = this.redondear(precioGlobal * cantidad);
      calIgv = this.redondear((calSubTotal * 180) / 1000);
      totalAPagar = this.redondear(calSubTotal + calIgv);

      this.myFormCotizacion.patchValue({
        subTotal: this.redondear(calSubTotal),
        igv: this.redondear(calIgv),
        total: this.redondear(totalAPagar),
      });
    }
  }

  nuevaCotizacionPersona() {
    this.myFormCotizacion.reset();
    this.serviciosCotizacion.clear();
    this.myFormCotizacion.get('aplicarPrecioGlobal')?.enable();
    this.myFormCotizacion.get('precioConDescGlobal')?.disable();

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
      sumaTotalesPrecioLista: 0,
      sumaTotalesPrecioVenta: 0,
      descuentoTotal: 0,
      subTotal: 0,
      igv: 0,
      total: 0,
    });

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

        const body: ICotizacionEmpresa = {
          codCotizacion: '',
          estadoCotizacion: 'GENERADA',
          historial: [
            {
              version: 1,
              fechaModificacion: new Date(),
              empresaId: formValue.empresaId,
              ruc: formValue.ruc,
              razonSocial: formValue.razonSocial,
              dirigidoA_Id: formValue.dirigidoA_Id,
              formaPago: formValue.formaPago,
              diasCredito: formValue.diasCredito,
              entregaResultados: formValue.entregaResultados,
              validez: formValue.validez,
              aplicarPrecioGlobal: !!formValue.aplicarPrecioGlobal,
              precioConDescGlobal: formValue.precioConDescGlobal,
              cantidadGlobal: formValue.cantidadGlobal,
              sumaTotalesPrecioLista: formValue.sumaTotalesPrecioLista,
              sumaTotalesPrecioVenta: formValue.sumaTotalesPrecioVenta,
              subTotal: formValue.subTotal,
              igv: formValue.igv,
              total: formValue.total,
              serviciosCotizacion: formValue.serviciosCotizacion,
            },
          ],
        };

        console.log('📌 **Body antes de enviar**:', body);

        this._cotizacionService.crearCotizacionEmpresa(body).subscribe({
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

        const nuevaVersion: IHistorialCotizacionEmpresa = {
          version: ultimaVersion + 1,
          fechaModificacion: new Date(),
          empresaId: formValue.empresaId,
          ruc: formValue.ruc,
          razonSocial: formValue.razonSocial,
          dirigidoA_Id: formValue.dirigidoA_Id,
          formaPago: formValue.formaPago,
          diasCredito: formValue.diasCredito,
          entregaResultados: formValue.entregaResultados,
          validez: formValue.validez,
          aplicarPrecioGlobal: !!formValue.aplicarPrecioGlobal,
          precioConDescGlobal: formValue.precioConDescGlobal,
          cantidadGlobal: formValue.cantidadGlobal,
          sumaTotalesPrecioLista: formValue.sumaTotalesPrecioLista,
          sumaTotalesPrecioVenta: formValue.sumaTotalesPrecioVenta,
          subTotal: formValue.subTotal,
          igv: formValue.igv,
          total: formValue.total,
          serviciosCotizacion: formValue.serviciosCotizacion,
        };

        // Crear el objeto de la nueva cotización con los datos del paciente y la nueva versión
        const nuevaCotizacion: ICotizacionEmpresa = {
          codCotizacion: this.cotizacionCargada.codCotizacion, // Mismo código
          estadoCotizacion: 'MODIFICADA',
          // Historial con la nueva versión agregada
          historial: [nuevaVersion],
        };

        this._cotizacionService
          .crearNuevaVersionCotizacionEmpresa(nuevaCotizacion)
          .subscribe({
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
    const razonSocialControl = this.myFormCotizacion.get('razonSocial');
    const razonSocialValor = razonSocialControl
      ? razonSocialControl.getRawValue()
      : '';

    if (!razonSocialValor || razonSocialValor.trim() === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Falta razón social',
        text: 'Debe ingresar o seleccionar la razón social.',
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

      // Mostrar errores específicos
      this.mostrarErroresFormulario();
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

    this.contactos = historialVersion.empresaId.personasContacto;

    this.cotizacionParaImprimir = {
      ...this.cotizacionCargada,
      historial: [historialVersion], // Sobrescribimos solo con la versión activa
    };

    const fechaFormateada = formatDate(
      historialVersion.fechaModificacion,
      'dd/MM/yyyy HH:mm',
      'es-PE',
    );

    this.myFormCotizacion.patchValue({
      ...historialVersion,
      fechaModificacion: fechaFormateada,
    });

    if (this.tienePagos === true) {
      this.myFormCotizacion.get('aplicarPrecioGlobal')?.disable();
      this.myFormCotizacion.get('precioConDescGlobal')?.disable();
      this.myFormCotizacion.get('cantidadGlobal')?.disable();

      document
        .getElementById('buscarPacienteModalBtn')
        ?.setAttribute('disabled', 'true');
      // document
      //   .getElementById('buscarSolicitanteModalBtn')
      //   ?.setAttribute('disabled', 'true');
      // document
      //   .getElementById('quitarSolicitanteBtn')
      //   ?.setAttribute('disabled', 'true');

      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
            servicioId: [servicio.servicioId, Validators.required],
            codServicio: [servicio.codServicio, Validators.required],
            tipoServicio: [servicio.tipoServicio, Validators.required],
            nombreServicio: [servicio.nombreServicio, Validators.required],
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
      document
        .getElementById('buscarPacienteModalBtn')
        ?.removeAttribute('disabled');

      // document
      //   .getElementById('buscarSolicitanteModalBtn')
      //   ?.removeAttribute('disabled');
      // document
      //   .getElementById('quitarSolicitanteBtn')
      //   ?.removeAttribute('disabled');

      this.myFormCotizacion.get('aplicarPrecioGlobal')?.enable();

      // 📌 Cargar servicios
      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
            servicioId: [servicio.servicioId, Validators.required],
            codServicio: [servicio.codServicio, Validators.required],
            tipoServicio: [servicio.tipoServicio, Validators.required],
            nombreServicio: [servicio.nombreServicio, Validators.required],
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

    this.myFormCotizacion.get('precioConDescGlobal')?.disable();
    this.myFormCotizacion.get('cantidadGlobal')?.disable();
    if (historialVersion.aplicarPrecioGlobal) {
      this.myFormCotizacion.get('precioConDescGlobal')?.enable();
      this.myFormCotizacion.get('cantidadGlobal')?.enable();
    }
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

  async generarPDF(preview: boolean) {
    // Implementar generación de PDF
    const pdfSrc = await this._pdfService.generarPDFCotizacion(
      this.cotizacionParaImprimir,
      preview,
    );

    if (preview && pdfSrc) {
      this.dialog.open(DialogPdfCotiEmpresaComponent, {
        data: { pdfSrc, cotizacionData: this.cotizacionParaImprimir },
        width: '70vw',
        height: '95vh',
        maxWidth: '95vw',
        panelClass: 'custom-dialog-container',
      });
    }
  }

  validarEntero(event: KeyboardEvent) {
    return this._numeroValidatorService.validarNumeroEntero(event);
  }

  validarDouble(event: KeyboardEvent) {
    return this._numeroValidatorService.validarTeclaDoublePositivo(event);
  }

  sanitizarDoubleInput(e: Event) {
    this._numeroValidatorService.onInputSanitize(e, 2, 9);
  }
  sanitizarDoublePaste(e: ClipboardEvent) {
    this._numeroValidatorService.onPasteSanitize(e, 2);
  }
}
