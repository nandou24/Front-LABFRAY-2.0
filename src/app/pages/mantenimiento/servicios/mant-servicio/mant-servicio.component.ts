import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';

import { catchError, of } from 'rxjs';
import Swal from 'sweetalert2';

import { customPaginatorIntl } from '../../../../services/utilitarios/mat-paginator-intl';

import { ServiciosService } from '../../../../services/mantenimiento/servicios/servicios.service';
import { ProfesionService } from '../../../../services/mantenimiento/profesion/profesion.service';
import { EspecialidadService } from '../../../../services/mantenimiento/especialidad/especialidad.service';

import {
  IExamenServicio,
  IServicio,
  TipoExamenServicio,
} from '../../../../models/Mantenimiento/servicios.models';

@Component({
  selector: 'app-mant-servicio',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
  ],
  providers: [
    {
      provide: MatPaginatorIntl,
      useFactory: customPaginatorIntl,
    },
  ],
  templateUrl: './mant-servicio.component.html',
  styleUrl: './mant-servicio.component.scss',
})
export class MantServicioComponent implements OnInit, AfterViewInit {
  // ====== Servicios ======

  private readonly _fb = inject(FormBuilder);
  private readonly _servicioService = inject(ServiciosService);
  private readonly _profesionService = inject(ProfesionService);
  private readonly _especialidadService = inject(EspecialidadService);

  // ====== Formulario ======

  public myFormServicio: FormGroup = this._fb.group({
    codServicio: [''],
    claseServicio: ['INDIVIDUAL', Validators.required],
    tipoServicio: ['', Validators.required],
    nombreServicio: ['', Validators.required],
    descripcionServicio: [''],
    precioServicio: [null, [Validators.required, Validators.min(0)]],
    estadoServicio: [true],
    favoritoServicio: [false],
    favoritoServicioEmpresa: [false],
    requiereSeleccionProfesional: [false],
    examenesServicio: this._fb.array([]),
    profesionesAsociadas: this._fb.array([]),
    serviciosIncluidos: this._fb.array([]),
  });

  // ====== FormArray ======

  get examenesServicio(): FormArray {
    return this.myFormServicio.get('examenesServicio') as FormArray;
  }

  get profesionesAsociadas(): FormArray {
    return this.myFormServicio.get('profesionesAsociadas') as FormArray;
  }

  get serviciosIncluidos(): FormArray {
    return this.myFormServicio.get('serviciosIncluidos') as FormArray;
  }

  // ====== Paginadores ======

  @ViewChild(MatTable)
  table!: MatTable<any>;

  @ViewChild('MatPaginatorServicios')
  paginatorServicios!: MatPaginator;

  @ViewChild('MatPaginatorExamenes')
  paginatorExamenes!: MatPaginator;

  // ====== Tablas ======

  columnasDisponibles: string[] = ['codigo', 'nombre', 'accion'];
  columnasSeleccionados: string[] = ['codigo', 'nombre', 'accion'];
  columnasServicios: string[] = ['codigo', 'nombre', 'precio'];
  dataSourceExamenesDisponibles = new MatTableDataSource<any>();
  dataSourceExamenesSeleccionados = new MatTableDataSource<any>();
  dataSourceServicios = new MatTableDataSource<IServicio>();
  // ====== Paquetes ======

  columnasServiciosPaqueteDisponibles: string[] = [
    'codigo',
    'tipo',
    'nombre',
    'precio',
    'accion',
  ];

  columnasServiciosPaqueteSeleccionados: string[] = [
    'codigo',
    'nombre',
    'cantidad',
    'precio',
    'subtotal',
    'accion',
  ];

  dataSourceServiciosPaqueteDisponibles = new MatTableDataSource<IServicio>();
  dataSourceServiciosPaqueteSeleccionados = new MatTableDataSource<any>();

  // ====== Controles auxiliares ======

  tipoServicioTabla = new FormControl<string | null>('');
  terminoBusquedaExamenes = new FormControl<string>('', { nonNullable: true });
  terminoBusquedaServicio = new FormControl<string>('', { nonNullable: true });
  terminoBusquedaServiciosPaquete = new FormControl<string>('', {
    nonNullable: true,
  });

  // ====== Estado ======

  formSubmitted = false;
  isLoading = false;
  pruebaSeleccionada = false;
  filaSeleccionadaIndex: number | null = null;

  // ====== Datos en memoria ======

  private todasLosExamenesPorTipoMemoria: any[] = [];
  private todasLosServiciosMemoria: IServicio[] = [];
  profesiones: any[] = [];
  especialidades: any[] = [];
  especialidadesPorProfesion: {
    [key: number]: any[];
  } = {};

  // ====== Inicialización ======

  ngOnInit(): void {
    this.escucharCambioClaseServicio();
    this.escucharCambioTipo();
    this.traerServicios();
    this.listarProfesiones();
    this.listarEspecialidades();
  }

  ngAfterViewInit(): void {
    this.dataSourceServicios.paginator = this.paginatorServicios;
    this.dataSourceExamenesDisponibles.paginator = this.paginatorExamenes;
  }

  // ====== Utilitarios visuales ======

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  // ====== Cambio clase servicio ======

  private escucharCambioClaseServicio(): void {
    this.myFormServicio
      .get('claseServicio')
      ?.valueChanges.subscribe((clase) => {
        this.configurarClaseServicio(clase);
      });
  }

  // ====== Configurar clase servicio ======

  private configurarClaseServicio(clase: string | null): void {
    const tipoServicioControl = this.myFormServicio.get('tipoServicio');

    if (clase === 'PAQUETE') {
      // ====== Paquete ======

      tipoServicioControl?.clearValidators();

      tipoServicioControl?.setValue(null, {
        emitEvent: false,
      });

      tipoServicioControl?.disable({
        emitEvent: false,
      });

      // Un paquete no tiene configuración
      // profesional propia.
      this.myFormServicio.get('requiereSeleccionProfesional')?.setValue(false, {
        emitEvent: false,
      });

      this.profesionesAsociadas.clear();

      this.especialidadesPorProfesion = {};

      // Un paquete no contiene componentes
      // clínicos directamente.
      this.examenesServicio.clear();

      this.dataSourceExamenesSeleccionados.data = [];

      this.componenteConfiguracionIndex = null;

      this.tipoServicioTabla.setValue('', {
        emitEvent: false,
      });

      this.dataSourceExamenesDisponibles.data = [];

      this.todasLosExamenesPorTipoMemoria = [];

      this.actualizarServiciosDisponiblesPaquete();
      this.actualizarTablaServiciosPaqueteSeleccionados();
    } else {
      // ====== Servicio individual ======

      tipoServicioControl?.setValidators(Validators.required);

      if (!this.myFormServicio.get('codServicio')?.value) {
        tipoServicioControl?.enable({
          emitEvent: false,
        });
      }

      // Un individual no debe conservar
      // composición de paquete.
      this.serviciosIncluidos.clear();

      this.terminoBusquedaServiciosPaquete.setValue('', {
        emitEvent: false,
      });

      this.dataSourceServiciosPaqueteDisponibles.data = [];

      this.dataSourceServiciosPaqueteSeleccionados.data = [];
    }

    tipoServicioControl?.updateValueAndValidity({
      emitEvent: false,
    });
  }

  // ====== Cambio tipo examen ======

  escucharCambioTipo(): void {
    this.tipoServicioTabla.valueChanges.subscribe((tipo) => {
      this.terminoBusquedaExamenes.setValue('');

      if (tipo) {
        this.obtenerExamenesPorTipo(tipo);
        return;
      }

      this.todasLosExamenesPorTipoMemoria = [];
      this.dataSourceExamenesDisponibles.data = [];
    });
  }

  // ====== Obtener exámenes ======

  obtenerExamenesPorTipo(tipo: string): void {
    this._servicioService
      .getExamenesPorTipo(tipo)
      .pipe(
        catchError((error) => {
          console.error('Error al obtener exámenes por tipo:', error);

          this.dataSourceExamenesDisponibles.data = [];
          this.todasLosExamenesPorTipoMemoria = [];

          return of({
            ok: false,
            examenes: [],
          });
        }),
      )
      .subscribe((res: any) => {
        const registros = Array.isArray(res) ? res : (res?.examenes ?? []);
        const tipoExamen = this.obtenerTipoExamenServicio(tipo);
        const examenes = registros.map((examen: any) =>
          this.mapearExamenDisponible(examen, tipoExamen),
        );

        this.dataSourceExamenesDisponibles.data = examenes;
        this.todasLosExamenesPorTipoMemoria = examenes;

        if (this.dataSourceExamenesDisponibles.paginator) {
          this.dataSourceExamenesDisponibles.paginator.firstPage();
        }
      });
  }

  // ====== Normalizar tipo clínico ======

  private obtenerTipoExamenServicio(
    tipo: string | null | undefined,
  ): TipoExamenServicio | null {
    if (!tipo) {
      return null;
    }

    const valor = tipo
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    switch (valor) {
      case 'LABORATORIO':
        return 'LABORATORIO';

      case 'ECOGRAFIA':
        return 'ECOGRAFIA';

      case 'RAYOS X':
      case 'RAYOS_X':
      case 'RAYOSX':
        return 'RAYOS_X';

      case 'CONSULTA':
      case 'CONSULTA MEDICA':
        return 'CONSULTA';

      case 'PROCEDIMIENTO':
        return 'PROCEDIMIENTO';

      default:
        return null;
    }
  }

  // ====== Mapear maestro a componente ======

  private mapearExamenDisponible(
    examen: any,
    tipoExamen: TipoExamenServicio | null,
  ): any {
    return {
      referenciaId: examen?._id ?? null,

      tipoExamen,

      codExamen:
        examen?.codPruebaLab ??
        examen?.codEcografia ??
        examen?.codRayosX ??
        examen?.codConsulta ??
        examen?.codProcedimiento ??
        examen?.codExamen ??
        '',

      nombreExamen:
        examen?.nombrePruebaLab ??
        examen?.nombreEcografia ??
        examen?.nombreRayosX ??
        examen?.nombreConsulta ??
        examen?.nombreProcedimiento ??
        examen?.nombreExamen ??
        '',

      numeroInstancias: 1,
      modalidadInstancias: 'UNICA',
      etiquetasInstancias: [],
    };
  }

  // ====== Buscar exámenes ======

  buscarExamenes(): void {
    const termino = this.terminoBusquedaExamenes.value.trim().toLowerCase();

    this.dataSourceExamenesDisponibles.data =
      this.todasLosExamenesPorTipoMemoria;

    this.dataSourceExamenesDisponibles.filter = termino;

    if (this.dataSourceExamenesDisponibles.paginator) {
      this.dataSourceExamenesDisponibles.paginator.firstPage();
    }
  }

  // ====== Agregar examen ======

  agregarExamen(examen: any): void {
    const existe = this.examenesServicio.controls.some((control) => {
      const actual = control.value as IExamenServicio;

      return (
        actual.codExamen === examen.codExamen &&
        actual.tipoExamen === examen.tipoExamen
      );
    });

    if (existe) {
      Swal.fire({
        title: 'Información',
        text: 'El examen ya se encuentra agregado al servicio.',
        icon: 'info',
        confirmButtonText: 'Ok',
      });

      return;
    }

    this.examenesServicio.push(this.crearExamenFormGroup(examen));

    this.actualizarTablaExamenesSeleccionados();
  }

  // ====== Crear FormGroup componente ======

  private crearExamenFormGroup(
    examen: Partial<IExamenServicio> | any,
  ): FormGroup {
    return this._fb.group({
      tipoExamen: [examen?.tipoExamen ?? null],

      referenciaId: [this.obtenerIdReferencia(examen?.referenciaId)],

      codExamen: [examen?.codExamen ?? '', Validators.required],

      nombreExamen: [examen?.nombreExamen ?? '', Validators.required],

      numeroInstancias: [
        examen?.numeroInstancias ?? 1,
        [Validators.required, Validators.min(1)],
      ],

      modalidadInstancias: [
        examen?.modalidadInstancias ?? 'UNICA',
        Validators.required,
      ],

      etiquetasInstancias: this.crearEtiquetasInstancias(
        examen?.etiquetasInstancias ?? [],
      ),
    });
  }

  // ====== Crear etiquetas de instancias ======

  private crearEtiquetasInstancias(etiquetas: string[]): FormArray {
    return this._fb.array(
      etiquetas.map((etiqueta) =>
        this._fb.control(etiqueta, Validators.required),
      ),
    );
  }

  // ====== Componente en configuración ======

  componenteConfiguracionIndex: number | null = null;

  get componenteConfiguracionForm(): FormGroup | null {
    if (this.componenteConfiguracionIndex === null) {
      return null;
    }

    return this.examenesServicio.at(
      this.componenteConfiguracionIndex,
    ) as FormGroup;
  }

  get etiquetasConfiguracion(): FormArray | null {
    const form = this.componenteConfiguracionForm;

    if (!form) {
      return null;
    }

    return form.get('etiquetasInstancias') as FormArray;
  }

  // ====== Abrir configuración ======

  configurarExamen(examen: any): void {
    const index = this.examenesServicio.controls.findIndex((control) => {
      const actual = control.getRawValue();

      return (
        actual.codExamen === examen.codExamen &&
        actual.tipoExamen === examen.tipoExamen
      );
    });

    if (index === -1) {
      return;
    }

    this.componenteConfiguracionIndex = index;

    this.sincronizarConfiguracionInstancias(index);
  }

  // ====== Cerrar configuración ======

  cerrarConfiguracionExamen(): void {
    this.componenteConfiguracionIndex = null;

    this.actualizarTablaExamenesSeleccionados();
  }

  // ====== Cambio modalidad ======

  onModalidadInstanciasChange(): void {
    if (this.componenteConfiguracionIndex === null) {
      return;
    }

    this.sincronizarConfiguracionInstancias(this.componenteConfiguracionIndex);

    this.actualizarTablaExamenesSeleccionados();
  }

  // ====== Cambio número de instancias ======

  onNumeroInstanciasChange(): void {
    if (this.componenteConfiguracionIndex === null) {
      return;
    }

    this.sincronizarConfiguracionInstancias(this.componenteConfiguracionIndex);

    this.actualizarTablaExamenesSeleccionados();
  }

  // ====== Sincronizar configuración ======

  private sincronizarConfiguracionInstancias(index: number): void {
    const form = this.examenesServicio.at(index) as FormGroup;

    const modalidad = form.get('modalidadInstancias')?.value ?? 'UNICA';

    const numeroControl = form.get('numeroInstancias');

    const etiquetas = form.get('etiquetasInstancias') as FormArray;

    let numero = Number(numeroControl?.value) || 1;

    numero = Math.floor(numero);

    // ====== Instancia única ======

    if (modalidad === 'UNICA') {
      numeroControl?.setValue(1, { emitEvent: false });

      etiquetas.clear();

      return;
    }

    // ====== Instancias múltiples ======

    if (numero < 2) {
      numero = 2;

      numeroControl?.setValue(numero, { emitEvent: false });
    }

    // Eliminar etiquetas sobrantes.
    while (etiquetas.length > numero) {
      etiquetas.removeAt(etiquetas.length - 1);
    }

    // Crear etiquetas faltantes.
    while (etiquetas.length < numero) {
      const posicion = etiquetas.length + 1;

      etiquetas.push(
        this._fb.control(
          this.obtenerEtiquetaInstanciaDefault(modalidad, posicion),
          Validators.required,
        ),
      );
    }
  }

  // ====== Etiqueta por defecto ======

  private obtenerEtiquetaInstanciaDefault(
    modalidad: string,
    posicion: number,
  ): string {
    if (modalidad === 'MUESTRAS_INDEPENDIENTES') {
      return `Muestra ${posicion}`;
    }

    if (modalidad === 'REPETICIONES_MISMA_MUESTRA') {
      return `Repetición ${posicion}`;
    }

    return `Instancia ${posicion}`;
  }

  // ====== Obtener ObjectId ======

  private obtenerIdReferencia(referencia: any): string | null {
    if (!referencia) {
      return null;
    }

    if (typeof referencia === 'string') {
      return referencia;
    }

    return referencia?._id ?? null;
  }

  // ====== Remover componente ======

  removerExamen(examen: any): void {
    const index = this.examenesServicio.controls.findIndex((control) => {
      const actual = control.getRawValue();

      return (
        actual.codExamen === examen.codExamen &&
        actual.tipoExamen === examen.tipoExamen
      );
    });

    if (index === -1) {
      return;
    }

    this.examenesServicio.removeAt(index);

    if (this.componenteConfiguracionIndex === index) {
      this.componenteConfiguracionIndex = null;
    } else if (
      this.componenteConfiguracionIndex !== null &&
      this.componenteConfiguracionIndex > index
    ) {
      this.componenteConfiguracionIndex--;
    }

    this.actualizarTablaExamenesSeleccionados();
  }

  // ====== Actualizar tabla seleccionados ======

  private actualizarTablaExamenesSeleccionados(): void {
    this.dataSourceExamenesSeleccionados.data =
      this.examenesServicio.controls.map((control: AbstractControl) =>
        control.getRawValue(),
      );
  }

  // ====== Nuevo servicio ======

  nuevoServicio(): void {
    this.formSubmitted = false;
    this.pruebaSeleccionada = false;
    this.filaSeleccionadaIndex = null;
    this.componenteConfiguracionIndex = null;
    this.myFormServicio.reset({
      codServicio: '',
      claseServicio: 'INDIVIDUAL',
      tipoServicio: '',
      nombreServicio: '',
      descripcionServicio: '',
      precioServicio: null,
      estadoServicio: true,
      favoritoServicio: false,
      favoritoServicioEmpresa: false,
      requiereSeleccionProfesional: false,
    });

    this.examenesServicio.clear();
    this.profesionesAsociadas.clear();
    this.serviciosIncluidos.clear();
    this.terminoBusquedaServiciosPaquete.setValue('', {
      emitEvent: false,
    });
    this.dataSourceServiciosPaqueteDisponibles.data = [];
    this.dataSourceServiciosPaqueteSeleccionados.data = [];
    this.especialidadesPorProfesion = {};
    this.terminoBusquedaServicio.setValue('');
    this.terminoBusquedaExamenes.setValue('');
    this.tipoServicioTabla.setValue('');
    this.dataSourceServicios.filter = '';
    this.dataSourceExamenesSeleccionados.data = [];
    this.dataSourceExamenesDisponibles.data = [];
    this.todasLosExamenesPorTipoMemoria = [];
    this.myFormServicio.get('claseServicio')?.enable({
      emitEvent: false,
    });

    this.myFormServicio.get('tipoServicio')?.enable({
      emitEvent: false,
    });

    this.myFormServicio.get('tipoServicio')?.setValidators(Validators.required);

    this.myFormServicio.get('tipoServicio')?.updateValueAndValidity({
      emitEvent: false,
    });
    this.myFormServicio.markAsPristine();
    this.myFormServicio.markAsUntouched();
  }

  // ====== Registrar servicio ======

  registraServicio(): void {
    this.formSubmitted = true;

    if (!this.validarFormularioServicio()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const servicio = this.construirServicioPayload();

      this.isLoading = true;

      this._servicioService.registrarServicio(servicio).subscribe({
        next: (res) => {
          this.isLoading = false;

          if (!res.ok) {
            const mensaje = res.msg ?? 'Ocurrió un error inesperado.';

            this.mostrarAlertaError(mensaje);

            return;
          }

          this.mostrarAlertaExito('registrado');

          this.traerServicios();

          this.nuevoServicio();
        },

        error: (error) => {
          this.isLoading = false;

          const mensaje = error?.error?.msg ?? 'Error inesperado al registrar.';

          this.mostrarAlertaError(mensaje);
        },
      });
    });
  }

  // ====== Actualizar servicio ======

  actualizarServicio(): void {
    this.formSubmitted = true;

    if (!this.validarFormularioServicio()) {
      return;
    }

    const codServicio = this.myFormServicio.get('codServicio')?.value;

    if (!codServicio) {
      this.mostrarAlertaError('No se encontró el código del servicio.');

      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const servicio = this.construirServicioPayload();

      this.isLoading = true;

      this._servicioService
        .actualizarServicio(codServicio, servicio)
        .subscribe({
          next: (res) => {
            this.isLoading = false;

            if (!res.ok) {
              const mensaje = res.msg ?? 'Ocurrió un error inesperado.';

              this.mostrarAlertaError(mensaje);

              return;
            }

            this.mostrarAlertaExito('actualizado');
            this.traerServicios();
            this.nuevoServicio();
          },

          error: (error) => {
            this.isLoading = false;

            const mensaje =
              error?.error?.msg ?? 'Error inesperado al actualizar.';

            this.mostrarAlertaError(mensaje);
          },
        });
    });
  }

  // ====== Validar formulario ======

  private validarFormularioServicio(): boolean {
    if (this.myFormServicio.invalid) {
      this.myFormServicio.markAllAsTouched();

      return false;
    }

    const claseServicio = this.myFormServicio.get('claseServicio')?.value;

    const requiereProfesional = Boolean(
      this.myFormServicio.get('requiereSeleccionProfesional')?.value,
    );

    // ====== Validar servicio individual ======

    if (claseServicio === 'INDIVIDUAL') {
      if (requiereProfesional && this.profesionesAsociadas.length === 0) {
        this.mostrarAlertaError(
          'Debe agregar al menos una profesión asociada.',
        );

        return false;
      }
    }

    // ====== Validar paquete ======

    if (claseServicio === 'PAQUETE') {
      if (this.serviciosIncluidos.length === 0) {
        this.mostrarAlertaError(
          'Debe agregar al menos un servicio al paquete.',
        );

        return false;
      }

      const tieneCantidadInvalida = this.serviciosIncluidos.controls.some(
        (control) => {
          const cantidad = Number(control.get('cantidad')?.value);

          return !Number.isInteger(cantidad) || cantidad < 1;
        },
      );

      if (tieneCantidadInvalida) {
        this.mostrarAlertaError(
          'Todos los servicios incluidos deben tener una cantidad válida.',
        );

        return false;
      }
    }

    return true;
  }

  // ====== Construir payload ======

  private construirServicioPayload(): IServicio {
    const formValue = this.myFormServicio.getRawValue();

    const claseServicio = formValue.claseServicio ?? 'INDIVIDUAL';

    const precioServicio = Number(formValue.precioServicio);

    return {
      codServicio: formValue.codServicio ?? '',

      claseServicio,

      tipoServicio: claseServicio === 'PAQUETE' ? null : formValue.tipoServicio,

      nombreServicio: formValue.nombreServicio?.trim() ?? '',

      descripcionServicio: formValue.descripcionServicio?.trim() ?? '',

      precioServicio,

      estadoServicio: Boolean(formValue.estadoServicio),

      favoritoServicio: Boolean(formValue.favoritoServicio),

      favoritoServicioEmpresa: Boolean(formValue.favoritoServicioEmpresa),

      // ====== Configuración profesional ======

      requiereSeleccionProfesional:
        claseServicio === 'INDIVIDUAL'
          ? Boolean(formValue.requiereSeleccionProfesional)
          : false,

      profesionesAsociadas:
        claseServicio === 'INDIVIDUAL'
          ? (formValue.profesionesAsociadas ?? [])
          : [],

      // ====== Composición clínica ======

      examenesServicio:
        claseServicio === 'INDIVIDUAL'
          ? (formValue.examenesServicio ?? [])
          : [],

      // ====== Composición comercial ======

      serviciosIncluidos:
        claseServicio === 'PAQUETE' ? (formValue.serviciosIncluidos ?? []) : [],
    };
  }

  // ====== Alertas ======

  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: 'Confirmado',
      text: `Servicio ${tipo} correctamente`,
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

  // ====== Listar servicios ======

  traerServicios(): void {
    this._servicioService.getAllServicios().subscribe({
      next: (servicios: IServicio[]) => {
        this.dataSourceServicios.data = servicios;

        this.todasLosServiciosMemoria = servicios;

        if (this.myFormServicio.get('claseServicio')?.value === 'PAQUETE') {
          this.actualizarTablaServiciosPaqueteSeleccionados();
          this.actualizarServiciosDisponiblesPaquete();
        }
      },

      error: (error) => {
        console.error('Error al obtener los servicios:', error);
        this.dataSourceServicios.data = [];
        this.todasLosServiciosMemoria = [];
      },
    });
  }

  // ====== Buscar servicio ======

  buscarServicio(): void {
    const termino = this.terminoBusquedaServicio.value.trim().toLowerCase();
    this.dataSourceServicios.data = this.todasLosServiciosMemoria;
    this.dataSourceServicios.filter = termino;

    if (this.dataSourceServicios.paginator) {
      this.dataSourceServicios.paginator.firstPage();
    }
  }

  // ====== Cargar servicio ======

  cargarServicio(servicio: IServicio, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.componenteConfiguracionIndex = null;
    this.pruebaSeleccionada = true;

    // ====== Datos generales ======

    this.myFormServicio.patchValue({
      codServicio: servicio.codServicio ?? '',

      claseServicio: servicio.claseServicio ?? 'INDIVIDUAL',

      tipoServicio: servicio.tipoServicio ?? '',

      nombreServicio: servicio.nombreServicio ?? '',

      descripcionServicio: servicio.descripcionServicio ?? '',

      precioServicio: servicio.precioServicio ?? null,

      estadoServicio: servicio.estadoServicio ?? true,

      favoritoServicio: servicio.favoritoServicio ?? false,

      favoritoServicioEmpresa: servicio.favoritoServicioEmpresa ?? false,

      requiereSeleccionProfesional:
        servicio.requiereSeleccionProfesional ?? false,
    });

    // ====== Componentes clínicos ======

    this.examenesServicio.clear();

    const examenes = servicio.examenesServicio ?? [];

    examenes.forEach((examen: any) => {
      const examenNormalizado = this.normalizarExamenExistente(
        examen,
        servicio.tipoServicio,
      );

      this.examenesServicio.push(this.crearExamenFormGroup(examenNormalizado));
    });

    this.actualizarTablaExamenesSeleccionados();

    // ====== Profesiones ======

    this.profesionesAsociadas.clear();

    this.especialidadesPorProfesion = {};

    const profesiones = servicio.profesionesAsociadas ?? [];

    profesiones.forEach((profesion: any, indice: number) => {
      const profesionFormGroup = this.crearProfesionAsociada();

      this.profesionesAsociadas.push(profesionFormGroup);

      const profesionId = this.obtenerIdReferencia(profesion.profesionId);

      if (profesionId) {
        this.onProfesionChange(profesionId, indice, false);
      }

      profesionFormGroup.patchValue({
        profesionId,

        especialidadId: this.obtenerIdReferencia(profesion.especialidadId),
      });
    });

    // ====== Servicios incluidos ======

    this.serviciosIncluidos.clear();

    const incluidos = servicio.serviciosIncluidos ?? [];

    incluidos.forEach((incluido: any) => {
      this.serviciosIncluidos.push(
        this.crearServicioIncluidoFormGroup(incluido),
      );
    });

    this.actualizarTablaServiciosPaqueteSeleccionados();

    if (servicio.claseServicio === 'PAQUETE') {
      this.actualizarServiciosDisponiblesPaquete();
    }

    // ====== Estado formulario ======

    // La clase de un servicio existente
    // no puede modificarse.
    this.myFormServicio.get('claseServicio')?.disable({
      emitEvent: false,
    });

    if (servicio.claseServicio === 'INDIVIDUAL') {
      this.myFormServicio
        .get('tipoServicio')
        ?.setValidators(Validators.required);

      this.myFormServicio.get('tipoServicio')?.disable({
        emitEvent: false,
      });
    } else {
      this.myFormServicio.get('tipoServicio')?.clearValidators();

      this.myFormServicio.get('tipoServicio')?.setValue(null, {
        emitEvent: false,
      });

      this.myFormServicio.get('tipoServicio')?.disable({
        emitEvent: false,
      });
    }

    this.myFormServicio.get('tipoServicio')?.updateValueAndValidity({
      emitEvent: false,
    });

    this.formSubmitted = false;

    this.myFormServicio.markAsPristine();

    this.myFormServicio.markAsUntouched();
  }

  // ====== Normalizar examen existente ======

  private normalizarExamenExistente(
    examen: any,
    tipoServicio: string | null,
  ): IExamenServicio {
    const tipoExamen =
      examen?.tipoExamen ?? this.obtenerTipoExamenServicio(tipoServicio);

    const referenciaId = this.obtenerIdReferencia(examen?.referenciaId);

    return {
      _id: examen?._id,

      tipoExamen,

      referenciaId,

      codExamen: examen?.codExamen ?? '',

      nombreExamen: examen?.nombreExamen ?? '',

      numeroInstancias: examen?.numeroInstancias ?? 1,

      modalidadInstancias: examen?.modalidadInstancias ?? 'UNICA',

      etiquetasInstancias: examen?.etiquetasInstancias ?? [],
    };
  }

  // ====== Profesiones ======

  listarProfesiones(): void {
    this._profesionService.getAllProfesions().subscribe({
      next: (profesiones) => {
        this.profesiones = profesiones ?? [];
      },

      error: (error) => {
        console.error('Error al obtener profesiones:', error);

        this.profesiones = [];
      },
    });
  }

  listarEspecialidades(): void {
    this._especialidadService.getAllEspecialidad().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades ?? [];
      },

      error: (error) => {
        console.error('Error al obtener especialidades:', error);

        this.especialidades = [];
      },
    });
  }

  // ====== Cambio profesión ======

  onProfesionChange(
    profesionId: any,
    index: number,
    limpiarEspecialidad = true,
  ): void {
    if (!profesionId) {
      this.especialidadesPorProfesion[index] = [];

      if (limpiarEspecialidad) {
        this.profesionesAsociadas
          .at(index)
          ?.get('especialidadId')
          ?.setValue(null);
      }

      return;
    }

    this.especialidadesPorProfesion[index] = this.especialidades.filter(
      (especialidad) => {
        const profesionRef = especialidad?.profesionRef;

        const profesionRefId =
          typeof profesionRef === 'string' ? profesionRef : profesionRef?._id;

        return profesionRefId === profesionId;
      },
    );

    if (limpiarEspecialidad) {
      this.profesionesAsociadas
        .at(index)
        ?.get('especialidadId')
        ?.setValue(null);
    }
  }

  // ====== Especialidades por profesión ======

  getEspecialidadesPorIndex(index: number): any[] {
    return this.especialidadesPorProfesion[index] ?? [];
  }

  // ====== Agregar profesión ======

  agregarProfesionAsociada(): void {
    this.profesionesAsociadas.push(this.crearProfesionAsociada());
  }

  // ====== Eliminar profesión ======

  eliminarProfesionAsociada(index: number): void {
    this.profesionesAsociadas.removeAt(index);

    this.reindexarEspecialidadesPorProfesion();
  }

  // ====== Crear profesión ======

  private crearProfesionAsociada(): FormGroup {
    return this._fb.group({
      profesionId: [null, Validators.required],

      especialidadId: [null],
    });
  }

  // ====== Reindexar especialidades ======

  private reindexarEspecialidadesPorProfesion(): void {
    const nuevasEspecialidades: {
      [key: number]: any[];
    } = {};

    this.profesionesAsociadas.controls.forEach((control, index) => {
      const profesionId = control.get('profesionId')?.value;

      if (!profesionId) {
        nuevasEspecialidades[index] = [];
        return;
      }

      nuevasEspecialidades[index] = this.especialidades.filter(
        (especialidad) => {
          const profesionRef = especialidad?.profesionRef;

          const profesionRefId =
            typeof profesionRef === 'string' ? profesionRef : profesionRef?._id;

          return profesionRefId === profesionId;
        },
      );
    });

    this.especialidadesPorProfesion = nuevasEspecialidades;
  }

  // ====== Validar profesiones ======

  validaarrayProfesion(): boolean {
    return this.profesionesAsociadas.length > 0;
  }

  // ====== Actualizar servicios disponibles para paquete ======

  private actualizarServiciosDisponiblesPaquete(): void {
    if (this.myFormServicio.get('claseServicio')?.value !== 'PAQUETE') {
      this.dataSourceServiciosPaqueteDisponibles.data = [];

      return;
    }

    const idsSeleccionados = new Set(
      this.serviciosIncluidos.controls
        .map((control) => control.get('servicioId')?.value)
        .filter(Boolean),
    );

    const termino = this.terminoBusquedaServiciosPaquete.value
      .trim()
      .toLowerCase();

    const disponibles = this.todasLosServiciosMemoria.filter((servicio) => {
      // Solo servicios individuales.
      if (servicio.claseServicio !== 'INDIVIDUAL') {
        return false;
      }

      // Para agregar nuevos componentes,
      // solo mostramos servicios activos.
      if (!servicio.estadoServicio) {
        return false;
      }

      if (!servicio._id || idsSeleccionados.has(servicio._id)) {
        return false;
      }

      if (!termino) {
        return true;
      }

      const texto = [
        servicio.codServicio,
        servicio.nombreServicio,
        servicio.tipoServicio ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return texto.includes(termino);
    });

    this.dataSourceServiciosPaqueteDisponibles.data = disponibles;
  }

  // ====== Buscar servicios para paquete ======

  buscarServiciosPaquete(): void {
    this.actualizarServiciosDisponiblesPaquete();
  }

  // ====== Agregar servicio al paquete ======

  agregarServicioPaquete(servicio: IServicio): void {
    if (!servicio._id) {
      this.mostrarAlertaError(
        'El servicio seleccionado no tiene un identificador válido.',
      );

      return;
    }

    if (servicio.claseServicio !== 'INDIVIDUAL') {
      this.mostrarAlertaError(
        'Solo se pueden agregar servicios individuales al paquete.',
      );

      return;
    }

    const existe = this.serviciosIncluidos.controls.some(
      (control) => control.get('servicioId')?.value === servicio._id,
    );

    if (existe) {
      Swal.fire({
        title: 'Información',
        text: 'El servicio ya está incluido en el paquete.',
        icon: 'info',
        confirmButtonText: 'Ok',
      });

      return;
    }

    this.serviciosIncluidos.push(
      this.crearServicioIncluidoFormGroup({
        servicioId: servicio._id,
        cantidad: 1,
      }),
    );

    this.actualizarTablaServiciosPaqueteSeleccionados();
    this.actualizarServiciosDisponiblesPaquete();
  }

  // ====== Eliminar servicio del paquete ======

  eliminarServicioPaquete(index: number): void {
    if (index < 0 || index >= this.serviciosIncluidos.length) {
      return;
    }

    this.serviciosIncluidos.removeAt(index);

    this.actualizarTablaServiciosPaqueteSeleccionados();
    this.actualizarServiciosDisponiblesPaquete();
  }

  // ====== Actualizar cantidad ======

  actualizarCantidadServicioPaquete(index: number): void {
    const control = this.serviciosIncluidos.at(index);

    if (!control) {
      return;
    }

    const cantidadControl = control.get('cantidad');

    let cantidad = Number(cantidadControl?.value) || 1;

    cantidad = Math.floor(cantidad);

    if (cantidad < 1) {
      cantidad = 1;
    }

    cantidadControl?.setValue(cantidad, {
      emitEvent: false,
    });

    this.actualizarTablaServiciosPaqueteSeleccionados();
  }

  // ====== Tabla servicios seleccionados ======

  private actualizarTablaServiciosPaqueteSeleccionados(): void {
    const seleccionados = this.serviciosIncluidos.controls.map(
      (control, index) => {
        const valor = control.getRawValue();

        const servicio = this.todasLosServiciosMemoria.find(
          (item) => item._id === valor.servicioId,
        );

        const cantidad = Number(valor.cantidad) || 1;

        const precio = Number(servicio?.precioServicio ?? 0);

        return {
          index,

          servicioId: valor.servicioId,

          cantidad,

          codServicio: servicio?.codServicio ?? '---',

          nombreServicio: servicio?.nombreServicio ?? 'SERVICIO NO DISPONIBLE',

          tipoServicio: servicio?.tipoServicio ?? null,

          estadoServicio: servicio?.estadoServicio ?? false,

          precioServicio: precio,

          subtotal: precio * cantidad,
        };
      },
    );

    this.dataSourceServiciosPaqueteSeleccionados.data = seleccionados;
  }

  // ====== Total referencial del paquete ======

  get totalServiciosPaquete(): number {
    return this.dataSourceServiciosPaqueteSeleccionados.data.reduce(
      (total, item) => total + Number(item.subtotal ?? 0),
      0,
    );
  }

  // ====== Diferencia precio paquete ======

  get ahorroPaquete(): number {
    const precioPaquete = Number(
      this.myFormServicio.get('precioServicio')?.value ?? 0,
    );

    return this.totalServiciosPaquete - precioPaquete;
  }

  // ====== Porcentaje diferencia ======

  get porcentajeAhorroPaquete(): number {
    if (this.totalServiciosPaquete <= 0) {
      return 0;
    }

    return (this.ahorroPaquete / this.totalServiciosPaquete) * 100;
  }

  // ====== Crear servicio incluido ======

  private crearServicioIncluidoFormGroup(servicio?: any): FormGroup {
    return this._fb.group({
      servicioId: [
        this.obtenerIdReferencia(servicio?.servicioId),
        Validators.required,
      ],

      cantidad: [
        servicio?.cantidad ?? 1,
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^[1-9]\d*$/),
        ],
      ],
    });
  }
}
