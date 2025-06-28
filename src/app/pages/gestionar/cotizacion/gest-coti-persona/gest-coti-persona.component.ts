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
import { RecursoHumanoService } from '../../../../services/mantenimiento/recursoHumano/recurso-humano.service';
import { ServiciosService } from '../../../../services/mantenimiento/servicios/servicios.service';
import { CotizacionPersonalService } from '../../../../services/gestion/cotizaciones/cotizacion-personal.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IServicio } from '../../../../models/servicios.models';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { DialogBuscarPacienteComponent } from './dialogs/dialog-paciente/dialog-buscar-paciente.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DialogBuscarSolicitanteComponent } from './dialogs/dialog-solicitante/dialog-buscar-solicitante.component';
import {
  ICotizacion,
  IHistorialCotizacion,
} from '../../../../models/cotizacionPersona.models';
import { CotiPersonaPdfServiceService } from '../../../../services/utilitarios/pdf/cotizacion/coti-persona-pdf.service.service';
import { DialogPdfCotiPersonaComponent } from './dialogs/dialog-pdf/dialog-pdf-coti-persona/dialog-pdf-coti-persona.component';

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
    MatButtonModule,
    MatDialogModule,
    MatButtonToggleModule,
  ],
  templateUrl: './gest-coti-persona.component.html',
  styleUrl: './gest-coti-persona.component.scss',
})
export class GestCotiPersonaComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _servicioService = inject(ServiciosService);
  private _cotizacionService = inject(CotizacionPersonalService);
  private dialog = inject(MatDialog);
  private _pdfService = inject(CotiPersonaPdfServiceService);

  ngOnInit(): void {
    this.camnbioEstadoRegistroPaciente();
    this.camnbioEstadoRegistroSolicitante();
    this.ultimosServicios(10);
    this.listarServiciosFrecuentes();
    this.ultimasCotizaciones(10);
    this.myFormCotizacion.get('codCotizacion')?.disable();
    this.myFormCotizacion.get('version')?.disable();
    this.terminoBusquedaCotizacion.valueChanges.subscribe(() =>
      this.buscarCotizaciones(),
    );
  }

  public myFormCotizacion: FormGroup = this._fb.group({
    codCotizacion: '',
    version: '',
    estadoRegistroPaciente: true,
    codCliente: [{ value: '', disabled: true }],
    nomCliente: [''],
    hc: [''],
    tipoDoc: [''],
    nroDoc: [''],
    estadoRegistroSolicitante: true,
    codSolicitante: [{ value: '', disabled: true }],
    nomSolicitante: [''],
    profesionSolicitante: [''],
    colegiatura: [''],
    especialidadSolicitante: [''],
    aplicarPrecioGlobal: false,
    aplicarDescuentoPorcentGlobal: false,
    sumaTotalesPrecioLista: 0,
    descuentoTotal: 0,
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
    'cantidad',
    'precioLista',
    'diferencia',
    'precioVenta',
    'descuentoPorcentaje',
    'totalUnitario',
  ];
  dataSourceServiciosCotizados = new MatTableDataSource<FormGroup>([]);

  camnbioEstadoRegistroPaciente() {
    const estado = this.myFormCotizacion.get('estadoRegistroPaciente')?.value;

    if (estado) {
      // this.myFormCotizacion.get('codCliente')?.reset();
      this.myFormCotizacion.get('nomCliente')?.reset();
      this.myFormCotizacion.get('tipoDoc')?.reset();
      this.myFormCotizacion.get('nroDoc')?.reset();
      this.myFormCotizacion.get('nomCliente')?.disable();
      this.myFormCotizacion.get('tipoDoc')?.disable();
      this.myFormCotizacion.get('nroDoc')?.disable();
      document
        .getElementById('buscarPacienteModalBtn')
        ?.removeAttribute('disabled');
    } else {
      // this.myFormCotizacion.get('codCliente')?.reset();
      this.myFormCotizacion.get('nomCliente')?.reset();
      this.myFormCotizacion.get('tipoDoc')?.reset();
      this.myFormCotizacion.get('nroDoc')?.reset();
      this.myFormCotizacion.get('nomCliente')?.enable();
      this.myFormCotizacion.get('tipoDoc')?.enable();
      this.myFormCotizacion.get('nroDoc')?.enable();
      document
        .getElementById('buscarPacienteModalBtn')
        ?.setAttribute('disabled', 'true');
    }
  }

  camnbioEstadoRegistroSolicitante() {
    const estado = this.myFormCotizacion.get(
      'estadoRegistroSolicitante',
    )?.value;

    if (estado) {
      this.myFormCotizacion.get('codSolicitante')?.reset();
      this.myFormCotizacion.get('nomSolicitante')?.reset();
      this.myFormCotizacion.get('profesionSolicitante')?.reset();
      this.myFormCotizacion.get('colegiatura')?.reset();
      this.myFormCotizacion.get('especialidadSolicitante')?.reset();

      // this.myFormCotizacion.get('codSolicitante')?.disable();
      this.myFormCotizacion.get('nomSolicitante')?.disable();
      this.myFormCotizacion.get('profesionSolicitante')?.disable();
      this.myFormCotizacion.get('colegiatura')?.disable();
      this.myFormCotizacion.get('especialidadSolicitante')?.disable();

      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.removeAttribute('disabled');
    } else {
      // this.myFormCotizacion.get('codSolicitante')?.reset();
      this.myFormCotizacion.get('nomSolicitante')?.reset();
      this.myFormCotizacion.get('profesionSolicitante')?.reset();
      this.myFormCotizacion.get('colegiatura')?.reset();
      this.myFormCotizacion.get('especialidadSolicitante')?.reset();

      this.myFormCotizacion.get('codSolicitante')?.enable();
      this.myFormCotizacion.get('nomSolicitante')?.enable();
      this.myFormCotizacion.get('profesionSolicitante')?.enable();
      this.myFormCotizacion.get('colegiatura')?.enable();
      this.myFormCotizacion.get('especialidadSolicitante')?.enable();

      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.setAttribute('disabled', 'true');
    }
  }

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

  setPacienteSeleccionado(paciente: any) {
    // Asigna los datos del paciente seleccionado al formulario
    this.myFormCotizacion.patchValue({
      nomCliente:
        `${paciente.apePatCliente} ${paciente.apeMatCliente} ${paciente.nombreCliente}`.trim(),
      hc: paciente.hc,
      tipoDoc: paciente.tipoDoc,
      nroDoc: paciente.nroDoc,
      codCliente: paciente.hc,
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

  setSolicitanteSeleccionado(solicitante: any) {
    // Asigna los datos del paciente seleccionado al formulario
    this.myFormCotizacion.patchValue({
      codSolicitante: solicitante.codRefMedico,
      nomSolicitante:
        `${solicitante.apePatRefMedico} ${solicitante.apeMatRefMedico} ${solicitante.nombreRefMedico}`.trim(),
      profesionSolicitante: solicitante.profesionSolicitante.profesion,
      colegiatura: solicitante.profesionSolicitante.colegiatura,
      especialidadSolicitante: solicitante.especialidadesRefMedico.especialidad,
    });
  }

  getEspecialidadesTexto(solicitante: any): string {
    return solicitante.especialidadesRecurso &&
      solicitante.especialidadesRecurso.length > 0
      ? solicitante.especialidadesRecurso
          .map((e: any) => e.especialidad)
          .join(', ')
      : 'No tiene especialidad';
  }

  // COTIZACIONES

  terminoBusquedaCotizacion = new FormControl('');
  cotizaciones: any[] = [];

  ultimasCotizaciones(cantidad: number): void {
    this._cotizacionService.getLastCotizacion(cantidad).subscribe({
      next: (res: ICotizacion[]) => {
        this.cotizaciones = res;
      },
      error: (err: any) => {
        this.cotizaciones = [];
      },
    });
  }

  buscarCotizaciones() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusquedaCotizacion.value?.trim() || '';

      if (termino.length >= 3) {
        this._cotizacionService
          .getCotizacion(termino)
          .subscribe((res: ICotizacion[]) => {
            this.cotizaciones = res;
          });
      } else if (termino.length > 0) {
        this.cotizaciones = [];
      } else {
        this.ultimasCotizaciones(10);
      }
    }, 200);
  }

  // SERVICIOS
  terminoBusquedaServicio = new FormControl('');
  servicios: IServicio[] = [];
  serviciosFrecuentes: IServicio[] = [];

  ultimosServicios(cantidad: number): void {
    this._servicioService.getLastServicio(cantidad).subscribe({
      next: (res: IServicio[]) => {
        this.servicios = res;
      },
      error: (err: any) => {
        this.servicios = [];
      },
    });
  }

  listarServiciosFrecuentes() {
    this._servicioService.getAllFavoritesServicios().subscribe({
      next: (res: IServicio[]) => {
        this.serviciosFrecuentes = res;
      },
      error: (err: any) => {
        this.serviciosFrecuentes = [];
      },
    });
  }

  buscarServicio() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusquedaServicio.value?.trim() || '';

      if (termino.length >= 3) {
        this._servicioService
          .getServicio(termino)
          .subscribe((res: IServicio[]) => {
            this.servicios = res;
          });
      } else if (termino.length > 0) {
        this.servicios = [];
      } else {
        this.ultimosServicios(10);
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
      codServicio: [servicio.codServicio, Validators.required],
      tipoServicio: [servicio.tipoServicio, Validators.required],
      nombreServicio: [servicio.nombreServicio, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioLista: [
        servicio.precioServicio,
        [Validators.required, Validators.min(0)],
      ],
      diferencia: [0, [Validators.min(0)]],
      precioVenta: [
        servicio.precioServicio,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/),
        ],
      ],
      descuentoPorcentaje: [0, [Validators.min(0), Validators.max(100)]],
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

  calcularTotalUnitario(index: number) {
    const servicio = this.serviciosCotizacion.at(index);
    const cantidad = servicio.get('cantidad')?.value || 0;
    const precioLista = servicio.get('precioLista')?.value || 0;
    let precioVenta = servicio.get('precioVenta')?.value || 0;
    let descuentoPorcentual = servicio.get('descuentoPorcentaje')?.value || 0;
    let precioListaTotal = cantidad * precioLista;
    let totalUnitario =
      (cantidad *
        Math.round(precioVenta * ((100 - descuentoPorcentual) / 100) * 100)) /
      100;
    const diferencia =
      Math.round((totalUnitario - precioListaTotal) * 100) / 100;
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

  @ViewChild('inputPrecioGlobal')
  inputPrecioGlobal!: ElementRef<HTMLInputElement>;
  @ViewChild('inputPorcentajeGlobal')
  inputPorcentajeGlobal!: ElementRef<HTMLInputElement>;

  cambioEstadoDescGlobal(cargando: boolean) {
    const estadoPrecioGlobal = this.myFormCotizacion.get(
      'aplicarPrecioGlobal',
    )?.value;

    if (this.serviciosCotizacion.length === 0) {
      this.myFormCotizacion
        .get('aplicarPrecioGlobal')
        ?.setValue(false, { emitEvent: false });

      Swal.fire({
        icon: 'warning',
        title: 'No hay servicios',
        text: 'Debe agregar al menos un servicio para aplicar un descuento global.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });

      return;
    }

    if (estadoPrecioGlobal) {
      //this.myFormCotizacion.get('precioConDescGlobal')?.reset();
      this.myFormCotizacion.get('precioConDescGlobal')?.enable();

      this.serviciosCotizacion.controls.forEach((control, index) => {
        const precioLista = parseFloat(control.get('precioLista')?.value) || 0;
        control.get('precioVenta')?.setValue(precioLista);
        control.get('precioVenta')?.disable();
        control.get('diferencia')?.setValue(0);
        this.calcularTotalUnitario(index);
      });

      if (cargando === false) {
        this.myFormCotizacion.get('precioConDescGlobal')?.setValue(0);

        this.inputPrecioGlobal.nativeElement.focus();
        this.inputPrecioGlobal.nativeElement.select();
      }
    } else {
      this.myFormCotizacion.get('precioConDescGlobal')?.reset();
      this.myFormCotizacion.get('precioConDescGlobal')?.disable();

      this.serviciosCotizacion.controls.forEach((control, index) => {
        control.get('precioVenta')?.enable();
        this.calcularTotalUnitario(index);
      });
    }
  }

  cambioEstadoDescPorcentajeGlobal(cargando: boolean) {
    const estadoPorcentGlobal = this.myFormCotizacion.get(
      'aplicarDescuentoPorcentGlobal',
    )?.value;

    if (this.serviciosCotizacion.length === 0) {
      this.myFormCotizacion
        .get('aplicarDescuentoPorcentGlobal')
        ?.setValue(false, { emitEvent: false });

      // 🔥 SweetAlert de advertencia
      Swal.fire({
        icon: 'warning',
        title: 'No hay servicios',
        text: 'Debes agregar al menos un servicio antes de aplicar un descuento porcentual.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Entendido',
      });

      return;
    }

    if (estadoPorcentGlobal) {
      this.myFormCotizacion.get('descuentoPorcentaje')?.enable();

      //this.myFormCotizacion.get('descuentoPorcentaje')?.reset();

      this.serviciosCotizacion.controls.forEach((control, index) => {
        control.get('descuentoPorcentaje')?.setValue(0);
        control.get('descuentoPorcentaje')?.disable();
        control.get('diferencia')?.setValue(0);
        this.calcularTotalUnitario(index);
      });

      if (cargando === false) {
        this.myFormCotizacion.get('descuentoPorcentaje')?.setValue(0);

        this.inputPorcentajeGlobal.nativeElement.focus();
        this.inputPorcentajeGlobal.nativeElement.select();
      }
    } else {
      this.myFormCotizacion.get('descuentoPorcentaje')?.reset();
      this.myFormCotizacion.get('descuentoPorcentaje')?.disable();

      this.serviciosCotizacion.controls.forEach((control, index) => {
        control.get('descuentoPorcentaje')?.enable();
        this.calcularTotalUnitario(index);
      });
    }
  }

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

    // calcular subTotal
    let calSubTotal = Math.round((totalAPagar / 1.18) * 100) / 100;

    // calcular IGV
    let calIgv = Math.round((totalAPagar - calSubTotal) * 100) / 100;

    // 6️⃣ Actualizar los valores en el formulario
    this.myFormCotizacion.patchValue({
      sumaTotalesPrecioLista: Math.round(totalPrecioLista * 100) / 100,
      descuentoTotal: Math.round(diferenciaTotal * 100) / 100,
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
    this.myFormCotizacion.get('estadoRegistroPaciente')?.enable();
    this.myFormCotizacion.get('estadoRegistroSolicitante')?.enable();
    document
      .getElementById('buscarPacienteModalBtn')
      ?.removeAttribute('disabled');
    document
      .getElementById('buscarSolicitanteModalBtn')
      ?.removeAttribute('disabled');

    this.myFormCotizacion.patchValue({
      estadoRegistroPaciente: true,
      estadoRegistroSolicitante: true,
      sumaTotalesPrecioLista: 0,
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
    this.ultimosServicios(10);
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
              codCliente: formValue.codCliente,
              nomCliente: formValue.nomCliente,
              hc: formValue.hc,
              tipoDoc: formValue.tipoDoc,
              nroDoc: formValue.nroDoc,
              estadoRegistroSolicitante: !!formValue.estadoRegistroSolicitante,
              codSolicitante: formValue.codSolicitante,
              nomSolicitante: formValue.nomSolicitante,
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
              this.ultimasCotizaciones(10);
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
      title: 'Confirmado',
      text: tipo + ' correctamente',
      icon: 'success',
      confirmButtonText: 'Ok',
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
          codCliente: formValue.codCliente,
          nomCliente: formValue.nomCliente,
          hc: formValue.hc,
          tipoDoc: formValue.tipoDoc,
          nroDoc: formValue.nroDoc,
          estadoRegistroSolicitante: !!formValue.estadoRegistroSolicitante,
          codSolicitante: formValue.codSolicitante,
          nomSolicitante: formValue.nomSolicitante,
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
              this.ultimasCotizaciones(10);
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
    const nomClienteControl = this.myFormCotizacion.get('nomCliente');
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

    return true;
  }

  //inicio variables axuliares
  seSeleccionoCotizacion = false; // Indica si se ha seleccionado una cotización y borra el botón de generar cotización
  tienePagos: boolean = false;
  versionesDisponibles: number[] = [];
  versionActual: number | null = null;
  cotizacionCargada: any;
  cotizacionParaImprimir: any;
  //fin variables axuliares

  cargarCotizacion(cotizacion: any) {
    this.seSeleccionoCotizacion = true; //Ocultamos el botón de generar cotización

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

    this.myFormCotizacion.patchValue({
      estadoRegistroPaciente: historialVersion.estadoRegistroPaciente,
      //codCliente: historialVersion.codCliente || '',
      nomCliente: historialVersion.nomCliente || '',
      tipoDoc: historialVersion.tipoDoc || '',
      nroDoc: historialVersion.nroDoc || '',
      estadoRegistroSolicitante: historialVersion.estadoRegistroSolicitante,
      //codSolicitante: historialVersion.codSolicitante || '',
      nomSolicitante: historialVersion.nomSolicitante || '',
      profesionSolicitante: historialVersion.profesionSolicitante || '',
      //colegiatura: historialVersion.colegiatura || '',
      especialidadSolicitante: historialVersion.especialidadSolicitante || '',
      aplicarPrecioGlobal: historialVersion.aplicarPrecioGlobal,
      aplicarDescuentoPorcentGlobal:
        historialVersion.aplicarDescuentoPorcentGlobal,
      sumaTotalesPrecioLista: historialVersion.sumaTotalesPrecioLista,
      descuentoTotal: historialVersion.descuentoTotal || 0,
      precioConDescGlobal: historialVersion.precioConDescGlobal || 0,
      descuentoPorcentaje: historialVersion.descuentoPorcentaje || 0,
      subTotal: historialVersion.subTotal,
      igv: historialVersion.igv,
      total: historialVersion.total,
    });

    if (this.tienePagos === true) {
      this.myFormCotizacion.get('aplicarPrecioGlobal')?.disable();
      this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.disable();
      this.myFormCotizacion.get('estadoRegistroPaciente')?.disable();
      this.myFormCotizacion.get('estadoRegistroSolicitante')?.disable();
      document
        .getElementById('buscarPacienteModalBtn')
        ?.setAttribute('disabled', 'true');
      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.setAttribute('disabled', 'true');

      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
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
            diferencia: [servicio.diferencia, [Validators.min(0)]],
            precioVenta: [
              { value: servicio.precioVenta, disabled: true },
              [Validators.required, Validators.min(0)],
            ],
            descuentoPorcentaje: [
              { value: servicio.descuentoPorcentaje, disabled: true },
              [Validators.min(0), Validators.max(100)],
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
      this.myFormCotizacion.get('aplicarPrecioGlobal')?.enable();
      this.myFormCotizacion.get('aplicarDescuentoPorcentGlobal')?.enable();
      this.myFormCotizacion.get('estadoRegistroPaciente')?.enable();
      this.myFormCotizacion.get('estadoRegistroSolicitante')?.enable();

      // Habilitar los botones de búsqueda
      document
        .getElementById('buscarPacienteModalBtn')
        ?.removeAttribute('disabled');
      document
        .getElementById('buscarSolicitanteModalBtn')
        ?.removeAttribute('disabled');

      // 📌 Cargar servicios
      this.serviciosCotizacion.clear(); // Limpiar antes de cargar
      historialVersion.serviciosCotizacion.forEach((servicio: any) => {
        this.serviciosCotizacion.push(
          this._fb.group({
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
            diferencia: [servicio.diferencia, [Validators.min(0)]],
            precioVenta: [
              servicio.precioVenta,
              [Validators.required, Validators.min(0)],
            ],
            descuentoPorcentaje: [
              servicio.descuentoPorcentaje,
              [Validators.min(0), Validators.max(100)],
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

    this.cambioEstadoDescGlobal(true);
    this.cambioEstadoDescPorcentajeGlobal(true);
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

  generarPDF(preview: boolean) {
    // Implementar generación de PDF
    const pdfSrc = this._pdfService.generarPDFCotizacion(
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
}
