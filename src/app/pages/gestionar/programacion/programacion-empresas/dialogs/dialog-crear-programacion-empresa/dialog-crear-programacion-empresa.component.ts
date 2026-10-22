import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatDateFormats,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FechaValidatorService } from '../../../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { UbigeoService } from '../../../../../../services/utilitarios/ubigeo.service';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import {
  IEmpresa,
  IProtocoloEmpresa,
  IServicioProtocolo,
} from '../../../../../../models/Mantenimiento/empresa.models';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';
import Swal from 'sweetalert2';
import { PacienteService } from '../../../../../../services/mantenimiento/paciente/paciente.service';
import { IPaciente } from '../../../../../../models/Mantenimiento/paciente.models';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { DialogBuscarPacienteComponent } from '../../../../cotizacion/gest-coti-persona/dialogs/dialog-paciente/dialog-buscar-paciente.component';

// ====== Formato peruano de fechas para el diálogo ======
const FORMATOS_FECHA_DIALOGO: MatDateFormats = {
  parse: { dateInput: null },
  display: {
    dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
    monthYearLabel: { month: 'short', year: 'numeric' },
    dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
    monthYearA11yLabel: { month: 'long', year: 'numeric' },
  },
};

@Component({
  selector: 'app-dialog-crear-programacion-empresa',
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCardModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_FECHA_DIALOGO },
  ],
  templateUrl: './dialog-crear-programacion-empresa.component.html',
  styleUrl: './dialog-crear-programacion-empresa.component.scss',
})
export class DialogCrearProgramacionEmpresaComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DialogCrearProgramacionEmpresaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _ubigeoService: UbigeoService,
  ) {}

  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);
  private _empresaService = inject(EmpresaService);
  private _pacienteService = inject(PacienteService);
  private _programacionService = inject(ProgramacionEmpresaService);

  private _fb = inject(FormBuilder);
  private _dialog = inject(MatDialog);

  public programacionForm: FormGroup = this._fb.group({
    _id: [null],
    hc: [null],
    pacienteId: [null as string | null],
    estadoProgramacion: ['PROGRAMADO'],
    tipoDoc: ['DNI'],
    nroDoc: ['', [this._documentValidator.documentValidator('tipoDoc')]],
    sinDocumento: [false],
    apePatCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatCliente: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    nombreCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    fechaNacimiento: ['', [this._fechaService.fechaNoFuturaValidator()]],
    edad: [{ value: '', disabled: true }],
    sexoCliente: [null],
    phones: this._fb.array([]),
    empresa: [null as IEmpresa | null, Validators.required],
    protocoloEmpresa: [
      { value: null as IProtocoloEmpresa | null, disabled: true },
    ],
    empresaId: [''],
    rucEmpresa: [''],
    razonSocialEmpresa: [''],
    fechaProgramacion: [new Date(), Validators.required],
    sede: ['Callao'],
    tipoEvaluacion: ['ETAs'],
    tipoAtencion: ['Regular'],
    prioridad: ['Normal'],
    observaciones: [''],
  });

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  empresas: IEmpresa[] = [];
  empresasFiltradas: IEmpresa[] = [];
  protocolosDisponibles: IProtocoloEmpresa[] = [];
  serviciosProtocoloSeleccionado: IServicioProtocolo[] = [];
  columnasServiciosProtocolo: string[] = ['codigo', 'nombre'];
  private readonly camposIdentidadProtegidos = [
    'tipoDoc',
    'nroDoc',
    'apePatCliente',
    'apeMatCliente',
    'nombreCliente',
  ];
  private readonly camposComplementarios = ['sexoCliente', 'fechaNacimiento'];
  private contactoOriginal: string | null = null;
  public guardandoDatosPaciente = false;

  public get puedeActualizarDatosPaciente(): boolean {
    return this.modoDialog === 'create' &&
      !!this.programacionForm.get('pacienteId')?.value &&
      this.puedeEditarProgramacion(this.programacionForm.get('estadoProgramacion')?.value);
  }

  public get datosPacientePendientes(): boolean {
    return this.puedeActualizarDatosPaciente &&
      this.contactoOriginal !== null &&
      this.contactoActualSerializado() !== this.contactoOriginal;
  }
  public guardandoProgramacion = false;
  public get modoDialog(): 'create' | 'edit' | 'view' {
    return (this.data?.mode as 'create' | 'edit' | 'view') ?? 'create';
  }

  public get esModoEdicion(): boolean {
    return this.modoDialog === 'edit';
  }

  public get esModoVista(): boolean {
    return this.modoDialog === 'view';
  }

  public puedeEditarProgramacion(estado?: string): boolean {
    const estadoNormalizado = (estado ?? '').trim().toUpperCase();
    return (
      estadoNormalizado !== 'ATENDIDO' && estadoNormalizado !== 'CANCELADO'
    );
  }

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.traerEmpresas();
    this.actualizarModoDocumento();
    this.programacionForm.get('tipoDoc')?.valueChanges.subscribe(() => {
      this.programacionForm.get('nroDoc')?.updateValueAndValidity({ emitEvent: false });
    });

    this.programacionForm
      .get('empresa')
      ?.valueChanges.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((value: IEmpresa | string | null) => {
          if (typeof value !== 'string') {
            return of(null);
          }

          const termino = value.trim();
          this.limpiarEmpresaSeleccionada();

          if (!termino) {
            return of([...this.empresas]);
          }

          return this._empresaService.getEmpresa(termino).pipe(
            catchError((error) => {
              console.error('Error al buscar empresas:', error);
              return of([] as IEmpresa[]);
            }),
          );
        }),
      )
      .subscribe((resultado) => {
        if (resultado === null) {
          return;
        }

        this.empresasFiltradas = this.ordenarEmpresasPorNombre(resultado);
      });
  }

  traerEmpresas() {
    this._empresaService.getLastEmpresas(1000).subscribe({
      next: (empresas) => {
        this.empresas = this.ordenarEmpresasPorNombre(empresas);
        this.empresasFiltradas = [...this.empresas];
        this.cargarProgramacionExistente();
      },
      error: (error) => {
        console.error('Error al cargar empresas:', error);
      },
    });
  }

  private cargarProgramacionExistente(): void {
    const programacion = this.data?.programacion as
      | IProgramacionEmpresa
      | undefined;
    if (!programacion) {
      this.aplicarEstadoVistaOEdicion();
      return;
    }

    const empresaSeleccionada: IEmpresa =
      this.empresas.find((empresa) => empresa._id === programacion.empresaId) ??
      ({
        _id: programacion.empresaId,
        ruc: programacion.rucEmpresa,
        razonSocial: programacion.razonSocialEmpresa,
        nombreComercial: '',
        direccionFiscal: '',
        departamento: '',
        provincia: '',
        distrito: '',
        cantidadTrabajadores: 0,
        personasContacto: [],
        ubicacionesSedes: [],
      } as IEmpresa);

    this.programacionForm.patchValue({
      _id: programacion._id ?? null,
      hc: programacion.hc ?? null,
      pacienteId: programacion.pacienteId ?? null,
      estadoProgramacion: programacion.estadoProgramacion ?? 'PROGRAMADO',
      tipoDoc: programacion.tipoDoc ?? 'DNI',
      nroDoc: programacion.nroDoc ?? '',
      sinDocumento: !programacion.nroDoc,
      apePatCliente: programacion.apePatCliente ?? '',
      apeMatCliente: programacion.apeMatCliente ?? '',
      nombreCliente: programacion.nombreCliente ?? '',
      sexoCliente: programacion.sexoCliente ?? null,
      fechaNacimiento: programacion.fechaNacimiento
        ? new Date(programacion.fechaNacimiento)
        : null,
      fechaProgramacion: programacion.fechaProgramada
        ? new Date(programacion.fechaProgramada)
        : new Date(),
      empresa: empresaSeleccionada,
      empresaId: programacion.empresaId ?? '',
      rucEmpresa: programacion.rucEmpresa ?? '',
      razonSocialEmpresa: programacion.razonSocialEmpresa ?? '',
      observaciones: programacion.observaciones ?? '',
      sede: programacion.sede ?? '',
      tipoEvaluacion: programacion.tipoEvaluacion ?? '',
      tipoAtencion: programacion.tipoAtencion ?? '',
      prioridad: programacion.prioridad ?? '',
    });

    this.programacionForm.get('empresa')?.setValue(empresaSeleccionada);
    this.onEmpresaSeleccionada(empresaSeleccionada);

    const protocoloSeleccionado = this.protocolosDisponibles.find(
      (protocolo) => protocolo._id === programacion.protocoloId,
    );

    if (protocoloSeleccionado) {
      this.programacionForm
        .get('protocoloEmpresa')
        ?.setValue(protocoloSeleccionado);
      this.onProtocoloSeleccionado(protocoloSeleccionado);
    }

    this.aplicarEstadoVistaOEdicion();
    this.actualizarModoDocumento();
    if (programacion.pacienteId || programacion.estadoProgramacion !== 'PROGRAMADO') {
      this.bloquearCamposPaciente();
    }
  }

  private aplicarEstadoVistaOEdicion(): void {
    if (this.esModoVista) {
      this.programacionForm.disable();
      return;
    }

    const estado = this.programacionForm.get('estadoProgramacion')?.value;
    const bloqueado = !this.puedeEditarProgramacion(estado);

    if (bloqueado) {
      this.programacionForm.disable();
    }
  }

  displayFnEmpresa(empresa: IEmpresa | null): string {
    if (!empresa) {
      return '';
    }

    return `${empresa.ruc} - ${empresa.razonSocial}`;
  }

  private ordenarEmpresasPorNombre(empresas: IEmpresa[]): IEmpresa[] {
    return [...empresas].sort((a, b) =>
      a.razonSocial.localeCompare(b.razonSocial, 'es', { sensitivity: 'base' }),
    );
  }

  private ordenarProtocolosPorNombre(
    protocolos: IProtocoloEmpresa[],
  ): IProtocoloEmpresa[] {
    return [...protocolos].sort((a, b) =>
      a.nombreProtocolo.localeCompare(b.nombreProtocolo, 'es', {
        sensitivity: 'base',
      }),
    );
  }

  onEmpresaSeleccionada(empresa: IEmpresa): void {
    this.seleccionarEmpresa(empresa);

    const protocolos = empresa.protocolos ?? [];
    this.protocolosDisponibles = this.ordenarProtocolosPorNombre(
      protocolos.filter((protocolo) => protocolo.estado),
    );

    const protocoloControl = this.programacionForm.get('protocoloEmpresa');
    protocoloControl?.setValue(null);
    if (this.protocolosDisponibles.length > 0) {
      protocoloControl?.enable();
    } else {
      protocoloControl?.disable();
    }

    this.serviciosProtocoloSeleccionado = [];
  }

  onProtocoloSeleccionado(protocolo: IProtocoloEmpresa | null): void {
    if (!protocolo) {
      this.serviciosProtocoloSeleccionado = [];
      return;
    }

    this.serviciosProtocoloSeleccionado = [...(protocolo.servicios ?? [])].sort(
      (a, b) =>
        a.codServicio.localeCompare(b.codServicio, 'es', {
          sensitivity: 'base',
        }),
    );
  }

  displayProtocolo(protocolo: IProtocoloEmpresa | null): string {
    if (!protocolo) {
      return '';
    }

    return `${protocolo.codigoProtocolo} - ${protocolo.nombreProtocolo}`;
  }

  protocoloTienePlazo(protocolo: IProtocoloEmpresa | null): boolean {
    const cantidadDias = Number(protocolo?.plazoResultados?.cantidadDias);
    const tipoDias = protocolo?.plazoResultados?.tipoDias;

    return (
      Number.isInteger(cantidadDias) &&
      cantidadDias > 0 &&
      (tipoDias === 'HABILES' || tipoDias === 'CALENDARIO')
    );
  }

  textoPlazoProtocolo(protocolo: IProtocoloEmpresa | null): string {
    if (!this.protocoloTienePlazo(protocolo)) {
      return 'No definido';
    }

    const cantidadDias = Number(protocolo?.plazoResultados?.cantidadDias);
    const tipoDias = protocolo?.plazoResultados?.tipoDias;
    const tipoTexto = tipoDias === 'HABILES' ? 'hábiles' : 'calendario';

    return `${cantidadDias} ${cantidadDias === 1 ? 'día' : 'días'} ${tipoTexto}`;
  }

  private limpiarEmpresaSeleccionada(): void {
    this.programacionForm.patchValue({
      protocoloEmpresa: null,
      empresaId: '',
      rucEmpresa: '',
      razonSocialEmpresa: '',
    });
    this.programacionForm.get('protocoloEmpresa')?.disable();

    this.protocolosDisponibles = [];
    this.serviciosProtocoloSeleccionado = [];
  }

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.programacionForm
      .get('departamentoCliente')
      ?.valueChanges.subscribe((departamentoId) => {
        // Obtener y cargar las provincias según el departamento seleccionado
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        // Reiniciar el select de provincias
        this.programacionForm.get('provinciaCliente')?.setValue('01'); // Limpia la selección de provincias
      });
  }

  onProvinciaChange(): void {
    this.programacionForm
      .get('provinciaCliente')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.programacionForm.get(
          'departamentoCliente',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.programacionForm.get('distritoCliente')?.setValue('01');
      });
  }

  get phones(): FormArray {
    return this.programacionForm.get('phones') as FormArray;
  }

  agregarTelefono() {
    if (this.esModoVista || this.guardandoDatosPaciente ||
      !this.puedeEditarProgramacion(this.programacionForm.get('estadoProgramacion')?.value)) return;
    if (this.phones.length >= 15) {
      Swal.fire('Límite de teléfonos', 'Se admiten hasta 15 teléfonos.', 'info');
      return;
    }
    this.phones.push(this.crearTelefonoGroup({ phoneNumber: '', descriptionPhone: '' }));
  }

  eliminarTelefono(index: number) {
    if (this.esModoVista || this.guardandoDatosPaciente ||
      !this.puedeEditarProgramacion(this.programacionForm.get('estadoProgramacion')?.value)) return;
    this.phones.removeAt(index);
  }

  public formSubmitted: boolean = false;

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  // ====== Programación temporal sin documento ======
  cambiarSinDocumento(activado: boolean): void {
    if (this.programacionForm.get('pacienteId')?.value || this.esModoVista) {
      return;
    }
    this.programacionForm.get('sinDocumento')?.setValue(activado);
    if (activado) {
      this.programacionForm.get('nroDoc')?.setValue('');
    }
    this.actualizarModoDocumento();
  }

  private actualizarModoDocumento(): void {
    const sinDocumento = !!this.programacionForm.get('sinDocumento')?.value;
    const vinculado = !!this.programacionForm.get('pacienteId')?.value;
    const bloqueado = this.esModoVista ||
      !this.puedeEditarProgramacion(this.programacionForm.get('estadoProgramacion')?.value);
    const controlTipo = this.programacionForm.get('tipoDoc');
    const controlNumero = this.programacionForm.get('nroDoc');

    if (sinDocumento || vinculado || bloqueado) {
      controlTipo?.disable({ emitEvent: false });
      controlNumero?.disable({ emitEvent: false });
    } else {
      controlTipo?.enable({ emitEvent: false });
      controlNumero?.enable({ emitEvent: false });
    }
    controlNumero?.setValidators([
      ...(sinDocumento || vinculado ? [] : [Validators.required]),
      this._documentValidator.documentValidator('tipoDoc'),
    ]);
    controlNumero?.updateValueAndValidity({ emitEvent: false });
  }

  // ====== Buscar paciente registrado desde el diálogo de Cotización Personas ======
  abrirBusquedaPaciente(): void {
    if (this.esModoVista || !this.puedeEditarProgramacion(
      this.programacionForm.get('estadoProgramacion')?.value,
    )) {
      return;
    }

    this._dialog.open(DialogBuscarPacienteComponent, {
      width: '900px',
      maxWidth: '95vw',
      // ====== Mostrar hasta 100 pacientes recientes en Programaciones ======
      data: { cantidadRecientes: 100 },
    }).afterClosed().subscribe((paciente: IPaciente | undefined) => {
      if (paciente?._id) {
        const seleccionar = () => {
          // ====== Cargar complementarios reales; la búsqueda solo trae identidad ======
          this._pacienteService.getPatientbyId(paciente._id!).subscribe({
            next: (datos) => {
              this.habilitarCamposPaciente();
              this.seleccionarPacienteEncontrado({ ...paciente, ...datos });
            },
            error: () => Swal.fire('No se pudo consultar el paciente',
              'Vuelve a buscarlo antes de modificar sus datos.', 'error'),
          });
        };
        if (this.datosPacientePendientes) {
          this.confirmarDescartarDatosPaciente().then((confirmado) => {
            if (confirmado) seleccionar();
          });
        } else {
          seleccionar();
        }
      }
    });
  }

  // ====== Ingreso manual sin crear todavía un paciente ======
  usarIngresoManual(): void {
    if (this.modoDialog !== 'create') {
      return;
    }
    const volverAManual = () => {
      this.habilitarCamposPaciente();
      this.limpiarDatosPacienteBuscado();
    };
    if (this.datosPacientePendientes) {
      this.confirmarDescartarDatosPaciente().then((confirmado) => {
        if (confirmado) volverAManual();
      });
    } else {
      volverAManual();
    }
  }

  actualizarEdad() {
    const fecha = this.programacionForm.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.programacionForm.get('edad')?.setValue(edadCalculada);
  }

  private crearTelefonoGroup(phone: {
    phoneNumber: string;
    descriptionPhone: string;
  }): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber ?? '', [Validators.required, Validators.pattern(/^\d{9,11}$/)]],
      descriptionPhone: [phone.descriptionPhone ?? '', [Validators.required, Validators.maxLength(30)]],
    });
  }

  private cargarTelefonos(phones: any[] = []): void {
    this.phones.clear();
    phones.forEach((phone) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });
  }

  private bloquearCamposPaciente(): void {
    this.camposIdentidadProtegidos.forEach((campo) =>
      this.programacionForm.get(campo)?.disable({ emitEvent: false }),
    );
    this.camposComplementarios.forEach((campo) => {
      const control = this.programacionForm.get(campo);
      if (this.puedeActualizarDatosPaciente) {
        control?.enable({ emitEvent: false });
      } else {
        control?.disable({ emitEvent: false });
      }
    });
  }

  private habilitarCamposPaciente(): void {
    [...this.camposIdentidadProtegidos, ...this.camposComplementarios]
      .forEach((campo) => this.programacionForm.get(campo)?.enable({ emitEvent: false }));
  }

  private limpiarDatosPacienteBuscado(): void {
    this.programacionForm.patchValue({
      pacienteId: null,
      hc: null,
      tipoDoc: 'DNI',
      nroDoc: '',
      sexoCliente: null,
      fechaNacimiento: '',
      apePatCliente: '',
      apeMatCliente: '',
      nombreCliente: '',
      edad: '',
    });
    this.phones.clear();
    this.contactoOriginal = null;
    this.programacionForm.get('sinDocumento')?.setValue(false);
    this.actualizarModoDocumento();
  }

  private seleccionarPacienteEncontrado(paciente: IPaciente): void {
    this.programacionForm.patchValue({
      pacienteId: paciente._id ?? null,
      hc: paciente.hc ?? null,
      sinDocumento: !paciente.nroDoc,
      tipoDoc: paciente.tipoDoc ?? this.programacionForm.get('tipoDoc')?.value,
      nroDoc: paciente.nroDoc ?? this.programacionForm.get('nroDoc')?.value,
      apePatCliente: paciente.apePatCliente ?? '',
      apeMatCliente: paciente.apeMatCliente ?? '',
      nombreCliente: paciente.nombreCliente ?? '',
      fechaNacimiento: this.fechaNacimientoDesdePaciente(paciente.fechaNacimiento),
      sexoCliente: paciente.sexoCliente ?? null,
    });

    this.cargarTelefonos(paciente.phones ?? []);
    this.actualizarEdad();
    this.bloquearCamposPaciente();
    this.actualizarModoDocumento();
    this.contactoOriginal = this.contactoActualSerializado();
  }

  // ====== Evitar desfases UTC al abrir fechas antiguas de la HC ======
  private fechaNacimientoDesdePaciente(valor: Date | string | null): Date | null {
    if (!valor) return null;
    const iso = valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const [anio, mes, dia] = iso.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  // ====== Comparar únicamente datos complementarios ======
  private fechaContactoISO(fecha: Date | string | null): string | null {
    if (!fecha) return null;
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    if (Number.isNaN(d.getTime())) return null;
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')].join('-');
  }

  private contactoActual() {
    const raw = this.programacionForm.getRawValue();
    return {
      sexoCliente: raw.sexoCliente || null,
      fechaNacimiento: this.fechaContactoISO(raw.fechaNacimiento),
      phones: this.phones.getRawValue().map((tel: any) => ({
        phoneNumber: String(tel.phoneNumber ?? '').trim(),
        descriptionPhone: String(tel.descriptionPhone ?? '').trim(),
      })),
    };
  }

  private contactoActualSerializado(): string {
    return JSON.stringify(this.contactoActual());
  }

  private confirmarDescartarDatosPaciente(): Promise<boolean> {
    return Swal.fire({
      title: 'Cambios del paciente sin guardar',
      text: 'Los datos complementarios modificados no se han guardado. ¿Deseas descartarlos?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Descartar cambios',
      cancelButtonText: 'Volver',
    }).then((result) => !!result.isConfirmed);
  }

  // ====== Guardar solo sexo, nacimiento y teléfonos en la HC ======
  async guardarDatosPaciente(): Promise<void> {
    const pacienteId = this.programacionForm.get('pacienteId')?.value as string | null;
    if (!this.puedeActualizarDatosPaciente || !pacienteId ||
      !this.datosPacientePendientes || this.guardandoDatosPaciente) return;
    if (this.programacionForm.get('sexoCliente')?.invalid ||
      this.programacionForm.get('fechaNacimiento')?.invalid || this.phones.invalid ||
      this.phones.length > 15) {
      this.programacionForm.get('fechaNacimiento')?.markAsTouched();
      this.phones.markAllAsTouched();
      await Swal.fire('Datos incompletos', 'Verifica fecha de nacimiento y teléfonos.', 'warning');
      return;
    }
    const estadoAnterior = JSON.parse(this.contactoOriginal || '{}');
    const actual = this.contactoActual();
    const cambios: {
      sexoCliente?: string | null;
      fechaNacimiento?: string | null;
      phones?: { phoneNumber: string; descriptionPhone: string }[];
    } = {};
    if (estadoAnterior.sexoCliente !== actual.sexoCliente) cambios.sexoCliente = actual.sexoCliente;
    if (estadoAnterior.fechaNacimiento !== actual.fechaNacimiento) cambios.fechaNacimiento = actual.fechaNacimiento;
    if (JSON.stringify(estadoAnterior.phones) !== JSON.stringify(actual.phones)) cambios.phones = actual.phones;

    if (cambios.phones &&
      new Set(cambios.phones.map((tel) => tel.phoneNumber)).size !== cambios.phones.length) {
      await Swal.fire('Teléfonos duplicados', 'No repitas un mismo número de teléfono.', 'warning');
      return;
    }

    const confirmacion = await Swal.fire({
      title: 'Actualizar datos del paciente',
      text: 'Se actualizarán únicamente los datos complementarios en la historia clínica. DNI, nombres y apellidos permanecerán intactos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Guardar datos del paciente',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmacion.isConfirmed) return;

    this.guardandoDatosPaciente = true;
    this._pacienteService.actualizarDatosComplementarios(pacienteId, cambios)
      .pipe(finalize(() => { this.guardandoDatosPaciente = false; }))
      .subscribe({
        next: (paciente) => {
          this.seleccionarPacienteEncontrado(paciente);
          Swal.fire('Paciente actualizado', 'Los datos complementarios fueron guardados en la HC.', 'success');
        },
        error: (err) => Swal.fire('No se pudo guardar',
          err?.error?.msg || 'Verifica los datos e intenta nuevamente.', 'error'),
      });
  }

  seleccionarEmpresa(empresa: IEmpresa) {
    this.programacionForm.get('empresaId')?.setValue(empresa._id);
    this.programacionForm.get('rucEmpresa')?.setValue(empresa.ruc);
    this.programacionForm
      .get('razonSocialEmpresa')
      ?.setValue(empresa.razonSocial);

  }

  cerrar() {
    if (this.guardandoDatosPaciente || this.guardandoProgramacion) return;
    if (this.datosPacientePendientes) {
      this.confirmarDescartarDatosPaciente().then((confirmado) => {
        if (confirmado) this.dialogRef.close();
      });
      return;
    }
    this.dialogRef.close();
  }

  private construirPayloadProgramacion(): IProgramacionEmpresa {
    const raw = this.programacionForm.getRawValue();
    const protocolo = raw.protocoloEmpresa as IProtocoloEmpresa | null;

    const payload: IProgramacionEmpresa = {
      empresaId: raw.empresaId,
      rucEmpresa: raw.rucEmpresa,
      razonSocialEmpresa: raw.razonSocialEmpresa,
      tipoDoc: raw.sinDocumento ? null : raw.tipoDoc,
      nroDoc: raw.sinDocumento ? null : String(raw.nroDoc ?? '').trim().toUpperCase(),
      nombreCliente: raw.nombreCliente,
      apePatCliente: raw.apePatCliente,
      apeMatCliente: raw.apeMatCliente ?? '',
      pacienteId: raw.pacienteId ?? null,
      sexoCliente: raw.sexoCliente ?? null,
      fechaNacimiento: raw.fechaNacimiento ?? '',
      hc: raw.hc ?? null,
      protocoloId: protocolo?._id ?? '',
      codProtocolo: protocolo?.codigoProtocolo ?? '',
      nombreProtocolo: protocolo?.nombreProtocolo ?? '',
      serviciosProgramados: this.serviciosProtocoloSeleccionado.map(
        (servicio) => ({
          servicioId: servicio.servicioId,
          codServicio: servicio.codServicio,
          nombreServicio: servicio.nombreServicio,
          tipoServicio: servicio.tipoServicio,
        }),
      ),
      fechaProgramada: raw.fechaProgramacion,
      sede: raw.sede,
      tipoEvaluacion: raw.tipoEvaluacion,
      tipoAtencion: raw.tipoAtencion,
      prioridad: raw.prioridad,
      estadoProgramacion: raw.estadoProgramacion ?? 'PROGRAMADO',
      observaciones: raw.observaciones?.trim() || '',
      origenRegistro: 'MANUAL',
    };

    if (this.esModoEdicion && raw._id) {
      payload._id = raw._id;
    }

    return payload;
  }

  private normalizarNombre(valor: string | undefined): string {
    return (valor ?? '').trim().replace(/\s+/g, ' ').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  private validarDuplicadoProgramacion(payload: IProgramacionEmpresa) {
    const fecha = new Date(payload.fechaProgramada);
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);

    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    return this._programacionService
      .listarProgramaciones({
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
      })
      .pipe(
        map((programaciones) =>
          programaciones.some(
            (programacion) =>
              programacion._id !== payload._id &&
              programacion.empresaId === payload.empresaId &&
              programacion.protocoloId === payload.protocoloId &&
              (payload.pacienteId && programacion.pacienteId === payload.pacienteId ||
                payload.nroDoc && programacion.tipoDoc === payload.tipoDoc &&
                programacion.nroDoc === payload.nroDoc ||
                !payload.pacienteId && !payload.nroDoc && !programacion.nroDoc &&
                this.normalizarNombre(programacion.nombreCliente) === this.normalizarNombre(payload.nombreCliente) &&
                this.normalizarNombre(programacion.apePatCliente) === this.normalizarNombre(payload.apePatCliente) &&
                this.normalizarNombre(programacion.apeMatCliente) === this.normalizarNombre(payload.apeMatCliente)),
          ),
        ),
      );
  }

  registraProgramacion() {
    if (this.esModoVista) {
      this.cerrar();
      return;
    }
    if (this.guardandoDatosPaciente) return;
    if (this.datosPacientePendientes) {
      Swal.fire('Datos del paciente sin guardar',
        'Guarda los datos complementarios del paciente antes de crear la programación.', 'warning');
      return;
    }

    this.formSubmitted = true;

    if (this.programacionForm.invalid) {
      this.programacionForm.markAllAsTouched();
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Completa los campos obligatorios para registrar la programación.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    const protocolo = this.programacionForm.get('protocoloEmpresa')?.value;
    if (!protocolo) {
      Swal.fire({
        title: 'Protocolo requerido',
        text: 'Debes seleccionar un protocolo para continuar.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (!this.protocoloTienePlazo(protocolo)) {
      Swal.fire({
        title: 'Plazo no definido',
        text: 'El protocolo seleccionado no tiene definido el plazo de resultados. Actualízalo en Mantenimiento de Empresas antes de programar.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    if (this.serviciosProtocoloSeleccionado.length === 0) {
      Swal.fire({
        title: 'Sin servicios',
        text: 'El protocolo seleccionado no tiene servicios para programar.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    const estadoActual = this.programacionForm.get('estadoProgramacion')?.value;
    if (!this.puedeEditarProgramacion(estadoActual) && this.esModoEdicion) {
      Swal.fire({
        title: 'Programación bloqueada',
        text: 'No se puede editar una programación en estado Atendido o Cancelado.',
        icon: 'info',
        confirmButtonText: 'Ok',
      });
      return;
    }

    Swal.fire({
      title: this.esModoEdicion
        ? '¿Confirmar actualización?'
        : '¿Confirmar registro?',
      text: this.esModoEdicion
        ? 'Se actualizará la programación con los datos ingresados.'
        : this.programacionForm.get('sinDocumento')?.value
          ? 'Se programará sin documento. Verifica cuidadosamente los nombres y completa el documento cuando lo recibas.'
          : 'Se registrará la programación con los datos ingresados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.esModoEdicion
        ? 'Sí, actualizar'
        : 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const payload = this.construirPayloadProgramacion();
      this.guardandoProgramacion = true;

      this.validarDuplicadoProgramacion(payload)
        .pipe(
          finalize(() => {
            this.guardandoProgramacion = false;
          }),
        )
        .subscribe({
          next: (hayDuplicado) => {
            if (hayDuplicado) {
              Swal.fire({
                title: 'Duplicado',
                text: 'Ya existe una programación del mismo paciente para la misma empresa y protocolo en este mismo día.',
                icon: 'warning',
                confirmButtonText: 'Ok',
              });
              return;
            }

            const request$ = this.esModoEdicion
              ? this._programacionService.actualizarProgramacion(payload)
              : this._programacionService.crearProgramacionEmpresa(payload);

            request$.subscribe({
              next: (resp) => {
                Swal.fire(
                  this.esModoEdicion ? 'Actualizado' : 'Registrado',
                  this.esModoEdicion
                    ? 'Programación actualizada correctamente.'
                    : 'Programación registrada correctamente.',
                  'success',
                );

                this.dialogRef.close({
                  ok: true,
                  mode: this.modoDialog,
                  programacion: resp?.programacion ?? payload,
                });
              },
              error: (err) => {
                const mensaje =
                  err?.error?.msg ||
                  err.message ||
                  (this.esModoEdicion
                    ? 'No se pudo actualizar la programación. Intenta nuevamente.'
                    : 'No se pudo registrar la programación. Intenta nuevamente.');

                Swal.fire({
                  title: 'Error',
                  text: mensaje,
                  icon: 'error',
                  confirmButtonText: 'Ok',
                });
              },
            });
          },
          error: (err) => {
            console.error('Error al validar duplicados:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo validar la programación. Intenta nuevamente.',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
    });
  }
}
