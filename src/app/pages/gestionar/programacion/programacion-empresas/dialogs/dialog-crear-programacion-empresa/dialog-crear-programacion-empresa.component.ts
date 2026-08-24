import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  MAT_DIALOG_DATA,
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
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter,
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
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
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

  public programacionForm: FormGroup = this._fb.group({
    _id: [null],
    hc: [null],
    estadoProgramacion: ['PROGRAMADO'],
    tipoDoc: ['DNI'], // Valor por defecto: DNI
    nroDoc: ['', [this._documentValidator.documentValidator('tipoDoc')]],
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
  private readonly camposPacienteBloqueables = [
    'tipoDoc',
    'nroDoc',
    'sexoCliente',
    'fechaNacimiento',
    'apePatCliente',
    'apeMatCliente',
    'nombreCliente',
  ];
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
    this.traerEmpresas();

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
      estadoProgramacion: programacion.estadoProgramacion ?? 'PROGRAMADO',
      tipoDoc: programacion.tipoDoc ?? 'DNI',
      nroDoc: programacion.nroDoc ?? '',
      apePatCliente: programacion.apePatCliente ?? '',
      apeMatCliente: programacion.apeMatCliente ?? '',
      nombreCliente: programacion.nombreCliente ?? '',
      sexoCliente: programacion.sexoCliente ?? null,
      fechaNacimiento: programacion.fechaNacimiento ?? '',
      fechaProgramacion: programacion.fechaProgramada ?? new Date(),
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
    const telefonoForm = this._fb.group({
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{9,11}$/)],
      ],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]],
    });

    this.phones.push(telefonoForm);
  }

  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
  }

  public formSubmitted: boolean = false;

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  buscarPaciente() {
    const tipoDoc = this.programacionForm.get('tipoDoc')?.value;
    const nroDoc = this.programacionForm.get('nroDoc')?.value?.trim();

    if (!tipoDoc || !nroDoc) {
      this.programacionForm.get('tipoDoc')?.markAsTouched();
      this.programacionForm.get('nroDoc')?.markAsTouched();
      return;
    }

    if (this.programacionForm.get('nroDoc')?.invalid) {
      this.programacionForm.get('nroDoc')?.markAsTouched();
      return;
    }

    this._pacienteService
      .getPatient(nroDoc)
      .pipe(
        catchError((error) => {
          console.error('Error al buscar paciente:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo buscar el paciente. Intenta nuevamente.',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
          return of([] as IPaciente[]);
        }),
      )
      .subscribe((pacientes) => {
        const paciente = pacientes.find(
          (item) => item.nroDoc === nroDoc && item.tipoDoc === tipoDoc,
        );

        if (!paciente) {
          this.habilitarCamposPaciente();
          this.limpiarDatosPacienteBuscado();
          Swal.fire({
            title: 'Paciente no encontrado',
            text: 'No existe un paciente registrado con ese tipo y número de documento.',
            icon: 'info',
            confirmButtonText: 'Ok',
          });
          return;
        }

        this.seleccionarPacienteEncontrado(paciente);
      });
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
      phoneNumber: [phone.phoneNumber ?? ''],
      descriptionPhone: [phone.descriptionPhone ?? ''],
    });
  }

  private cargarTelefonos(phones: any[] = []): void {
    this.phones.clear();
    phones.forEach((phone) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });
  }

  private bloquearCamposPaciente(): void {
    this.camposPacienteBloqueables.forEach((campo) =>
      this.programacionForm.get(campo)?.disable(),
    );
  }

  private habilitarCamposPaciente(): void {
    this.camposPacienteBloqueables.forEach((campo) =>
      this.programacionForm.get(campo)?.enable(),
    );
  }

  private limpiarDatosPacienteBuscado(): void {
    this.programacionForm.patchValue({
      _id: null,
      hc: null,
      sexoCliente: null,
      fechaNacimiento: '',
      apePatCliente: '',
      apeMatCliente: '',
      nombreCliente: '',
      edad: '',
    });
    this.phones.clear();
  }

  private seleccionarPacienteEncontrado(paciente: IPaciente): void {
    this.programacionForm.patchValue({
      _id: paciente._id ?? null,
      hc: paciente.hc ?? null,
      tipoDoc: paciente.tipoDoc ?? this.programacionForm.get('tipoDoc')?.value,
      nroDoc: paciente.nroDoc ?? this.programacionForm.get('nroDoc')?.value,
      apePatCliente: paciente.apePatCliente ?? '',
      apeMatCliente: paciente.apeMatCliente ?? '',
      nombreCliente: paciente.nombreCliente ?? '',
      fechaNacimiento: paciente.fechaNacimiento ?? '',
      sexoCliente: paciente.sexoCliente ?? null,
    });

    this.cargarTelefonos(paciente.phones ?? []);
    this.actualizarEdad();
    this.bloquearCamposPaciente();
  }

  seleccionarEmpresa(empresa: IEmpresa) {
    this.programacionForm.get('empresaId')?.setValue(empresa._id);
    this.programacionForm.get('rucEmpresa')?.setValue(empresa.ruc);
    this.programacionForm
      .get('razonSocialEmpresa')
      ?.setValue(empresa.razonSocial);
    console.log('Form:', this.programacionForm.value);
  }

  cerrar() {
    this.dialogRef.close();
  }

  private construirPayloadProgramacion(): IProgramacionEmpresa {
    const raw = this.programacionForm.getRawValue();
    const protocolo = raw.protocoloEmpresa as IProtocoloEmpresa | null;

    return {
      _id: raw._id ?? undefined,
      empresaId: raw.empresaId,
      rucEmpresa: raw.rucEmpresa,
      razonSocialEmpresa: raw.razonSocialEmpresa,
      tipoDoc: raw.tipoDoc,
      nroDoc: raw.nroDoc,
      nombreCliente: raw.nombreCliente,
      apePatCliente: raw.apePatCliente,
      apeMatCliente: raw.apeMatCliente ?? '',
      pacienteId: raw._id ?? null,
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
              programacion.tipoDoc === payload.tipoDoc &&
              programacion.nroDoc === payload.nroDoc,
          ),
        ),
      );
  }

  registraProgramacion() {
    if (this.esModoVista) {
      this.cerrar();
      return;
    }

    console.log('Formulario de programación:', this.programacionForm.value);
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
