import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
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
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { MatTabsModule } from '@angular/material/tabs';

import Swal from 'sweetalert2';

import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { RolesService } from '../../../../services/permisos/roles/roles.service';
import { RecursoHumanoService } from '../../../../services/mantenimiento/recursoHumano/recurso-humano.service';
import { customPaginatorIntl } from '../../../../services/utilitarios/mat-paginator-intl';
import { UbigeoService } from '../../../../services/utilitarios/ubigeo.service';
import { ProfesionService } from '../../../../services/mantenimiento/profesion/profesion.service';
import { EspecialidadService } from '../../../../services/mantenimiento/especialidad/especialidad.service';
import { FechaValidatorService } from '../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { IRol } from '../../../../models/permisos/roles.models';
import { IRecHumano } from '../../../../models/Mantenimiento/recursoHumano.models';

@Component({
  selector: 'app-mant-recurso-humano',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CommonModule,
  ],
  providers: [
    { provide: MatPaginatorIntl, useFactory: customPaginatorIntl },
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
  ],
  templateUrl: './mant-recurso-humano.component.html',
  styleUrl: './mant-recurso-humano.component.scss',
})
export class MantRecursoHumanoComponent implements OnInit, AfterViewInit {
  private _rolesService = inject(RolesService);
  private _recHumanoService = inject(RecursoHumanoService);
  private _ubigeoService = inject(UbigeoService);
  private _profesionService = inject(ProfesionService);
  private _especialidadService = inject(EspecialidadService);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  constructor() {}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.suscribirseUsuarioSistema();
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosRecHumano();
    this.listarRolesDisponibles();
    this.listarProfesiones();
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  private _fb = inject(FormBuilder);
  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);

  public myFormRecHumano: FormGroup = this._fb.group({
    codRecHumano: '',
    tipoDoc: ['', [Validators.required]],
    nroDoc: [
      '',
      [
        Validators.required,
        this._documentValidator.documentValidator('tipoDoc'),
      ],
    ],
    nombreRecHumano: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apePatRecHumano: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatRecHumano: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    fechaNacimiento: [
      '',
      [Validators.required, this._fechaService.fechaNoFuturaValidator()],
    ],
    edad: [{ value: '', disabled: true }],
    sexoRecHumano: ['', [Validators.required]],
    departamentoRecHumano: ['15'],
    provinciaRecHumano: ['01'],
    distritoRecHumano: ['', [Validators.required]],
    direcRecHumano: [''],
    mailRecHumano: ['', [Validators.email]],
    phones: this._fb.array([], Validators.required),
    gradoInstruccion: ['', [Validators.required]],
    profesionesRecurso: this._fb.array([]),
    atiendeConsultas: [false, Validators.required],
    usuarioSistema: false,
    datosLogueo: this._fb.group({
      nombreUsuario: [{ value: '', disabled: true }, [Validators.required]],
      correoLogin: [{ value: '', disabled: true }, [Validators.email]],
      passwordHash: [{ value: '', disabled: true }, [Validators.required]],
      rol: [{ value: '', disabled: true }, [Validators.required]],
      sedeAsignada: [{ value: '', disabled: true }, [Validators.required]],
      estado: [{ value: false, disabled: true }], // puede ser ACTIVO / INACTIVO
    }),
  });

  crearProfesion(): FormGroup {
    return this._fb.group({
      profesionRef: [''],
      //codProfesion: ['', Validators.required],
      nivelProfesion: ['', Validators.required],
      titulo: [''],
      nroColegiatura: [''],
      centroEstudiosProfesion: [''],
      anioEgresoProfesion: [''],
      especialidades: this._fb.array([]),
    });
  }

  crearEspecialidad(): FormGroup {
    return this._fb.group({
      especialidadRef: [''],
      //codEspecialidad: ['', Validators.required],
      rne: ['', Validators.required],
      centroEstudiosEspecialidad: [''],
      anioEgresoEspecialidad: [''],
    });
  }

  get phones(): FormArray {
    return this.myFormRecHumano.get('phones') as FormArray;
  }

  get profesionesRecurso(): FormArray {
    return this.myFormRecHumano.get('profesionesRecurso') as FormArray;
  }

  especialidades(i: number): FormArray {
    return this.profesionesRecurso.at(i).get('especialidades') as FormArray;
  }

  get datosLogueo(): FormGroup {
    return this.myFormRecHumano.get('datosLogueo') as FormGroup;
  }

  hidePassword = true;

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];
  public rolesDisponibles: IRol[] = [];

  listarRolesDisponibles() {
    this._rolesService.getAllRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles;
      },
      error: () => {
        this.rolesDisponibles = [];
      },
    });
  }

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.myFormRecHumano
      .get('departamentoRecHumano')
      ?.valueChanges.subscribe((departamentoId) => {
        // Obtener y cargar las provincias según el departamento seleccionado
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        // Reiniciar el select de provincias
        this.myFormRecHumano.get('provinciaRecHumano')?.setValue('01'); // Limpia la selección de provincias
      });
  }

  onProvinciaChange(): void {
    this.myFormRecHumano
      .get('provinciaRecHumano')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.myFormRecHumano.get(
          'departamentoRecHumano',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.myFormRecHumano.get('distritoRecHumano')?.setValue('01');
      });
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
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

  agregarProfesion() {
    this.profesionesRecurso.push(this.crearProfesion());
  }

  eliminarProfesion(index: number) {
    this.profesionesRecurso.removeAt(index);
  }

  agregarEspecialidad(i: number) {
    this.especialidades(i).push(this.crearEspecialidad());
  }

  eliminarEspecialidad(i: number, j: number) {
    this.especialidades(i).removeAt(j);
  }

  public formSubmitted: boolean = false;

  validarArrayTelefono(): boolean {
    const telefonos = this.myFormRecHumano.get('phones') as FormArray;

    if (telefonos.length > 0) {
      return true;
    }
    return false;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorRecHumano') paginatorRecHumano!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourceRecursoHumano.paginator = this.paginatorRecHumano;
  }

  //Tabla rrhh
  columnasTablaRecursoHumano: string[] = [
    'nro',
    'codigo',
    'nombreCompleto',
    'nroDoc',
  ];
  dataSourceRecursoHumano = new MatTableDataSource<IRecHumano>();

  cargarRecursoHumano(recursoHumano: IRecHumano): void {
    this.recHumanoSeleccionado = true;

    // Usuario sistema: activar o desactivar grupo de login
    this.myFormRecHumano
      .get('usuarioSistema')
      ?.setValue(recursoHumano.usuarioSistema);

    const datosLogueoGroup = this.myFormRecHumano.get('datosLogueo');
    if (recursoHumano.usuarioSistema) {
      datosLogueoGroup?.enable(); // Habilita si aplica
    } else {
      datosLogueoGroup?.disable(); // Deshabilita si no aplica
    }

    this.myFormRecHumano.patchValue({
      codRecHumano: recursoHumano.codRecHumano,
      tipoDoc: recursoHumano.tipoDoc,
      nroDoc: recursoHumano.nroDoc,
      nombreRecHumano: recursoHumano.nombreRecHumano,
      apePatRecHumano: recursoHumano.apePatRecHumano,
      apeMatRecHumano: recursoHumano.apeMatRecHumano,
      fechaNacimiento: recursoHumano.fechaNacimiento,
      sexoRecHumano: recursoHumano.sexoRecHumano,
      departamentoRecHumano: recursoHumano.departamentoRecHumano,
      provinciaRecHumano: recursoHumano.provinciaRecHumano,
      distritoRecHumano: recursoHumano.distritoRecHumano,
      direcRecHumano: recursoHumano.direcRecHumano,
      mailRecHumano: recursoHumano.mailRecHumano,
      gradoInstruccion: recursoHumano.gradoInstruccion,
      atiendeConsultas: recursoHumano.atiendeConsultas,
      usuarioSistema: recursoHumano.usuarioSistema,
    });

    // Cargar valores del grupo datosLogueo si existen
    if (recursoHumano.datosLogueo) {
      datosLogueoGroup?.patchValue({
        nombreUsuario: recursoHumano.datosLogueo.nombreUsuario || '',
        correoLogin: recursoHumano.datosLogueo.correoLogin || '',
        passwordHash: recursoHumano.datosLogueo.passwordHash || '',
        rol: recursoHumano.datosLogueo.rol._id || '',
        sedeAsignada: recursoHumano.datosLogueo.sedeAsignada || '',
        estado: recursoHumano.datosLogueo.estado,
      });
    }

    // Limpiar el FormArray antes de llenarlo
    this.phones.clear();

    // Agregar cada teléfono al FormArray
    recursoHumano.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });

    this.actualizarEdad();

    this.profesionesRecurso.clear();
    // Agregar cada profesión al FormArray
    recursoHumano.profesionesRecurso.forEach(
      (profesion: any, index: number) => {
        this.profesionesRecurso.push(this.crearProfesionGroup(profesion));
        const profesionId =
          profesion.profesionRef._id || profesion.profesionRef;
        this.onProfesionSeleccionada(profesionId, index);
      },
    );
  }

  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone],
    });
  }

  private crearProfesionGroup(profesion: any): FormGroup {
    const especialidadesArray = this._fb.array([]) as FormArray;

    if (profesion.especialidades && profesion.especialidades.length > 0) {
      profesion.especialidades.forEach((esp: any) => {
        especialidadesArray.push(this.crearEspecialidadGroup(esp));
      });
    }

    return this._fb.group({
      profesionRef: [profesion.profesionRef],
      nivelProfesion: [profesion.nivelProfesion],
      titulo: [profesion.titulo],
      codProfesion: [profesion.codProfesion],
      nroColegiatura: [profesion.nroColegiatura],
      centroEstudiosProfesion: [profesion.centroEstudiosProfesion],
      anioEgresoProfesion: [profesion.anioEgresoProfesion],
      especialidades: especialidadesArray,
    });
  }

  private crearEspecialidadGroup(especialidad: any): FormGroup {
    return this._fb.group({
      especialidadRef: [especialidad.especialidadRef],
      codEspecialidad: [especialidad.codEspecialidad],
      rne: [especialidad.rne],
      centroEstudiosEspecialidad: [especialidad.centroEstudiosEspecialidad],
      anioEgresoEspecialidad: [especialidad.anioEgresoEspecialidad],
    });
  }

  profesiones: any[] = [];
  especialidadesPorProfesion: any[][] = [];
  listarProfesiones() {
    this._profesionService.getAllProfesions().subscribe({
      next: (profesiones) => {
        this.profesiones = profesiones;
      },
      error: () => {
        this.profesiones = [];
      },
    });
  }

  onProfesionSeleccionada(idProfesion: string, index: number): void {
    this._especialidadService
      .getEspecialidadesPorProfesion(idProfesion)
      .subscribe({
        next: (especialidades) => {
          this.especialidadesPorProfesion[index] = especialidades;
          console.log('Especialidades cargadas:', especialidades);
        },
        error: (err) => {
          console.error('Error al cargar especialidades', err);
          this.especialidadesPorProfesion[index] = [];
        },
      });
  }

  ultimosRecHumano(): void {
    this._recHumanoService.getLastRecHumanos(0).subscribe((recHumano) => {
      this.dataSourceRecursoHumano.data = recHumano;
      console.log('Recursos humanos obtenidos:', recHumano);
    });
  }

  actualizarEdad() {
    const fecha = this.myFormRecHumano.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.myFormRecHumano.get('edad')?.setValue(edadCalculada);
  }

  terminoBusquedaRecHumanoControl = new FormControl('');

  filtrar() {
    const termino = this.terminoBusquedaRecHumanoControl.value || '';
    this.dataSourceRecursoHumano.filter = termino.trim().toLowerCase();
  }

  recHumanoSeleccionado = false;

  registraRecHumano() {
    console.log('Registro de recurso humano iniciado');
    this.formSubmitted = true;

    if (this.myFormRecHumano.invalid) {
      console.log(
        'Formulario inválido, marcando todos los campos como tocados',
      );
      this.myFormRecHumano.markAllAsTouched();
      return;
    }

    if (!this.validarArrayTelefono()) {
      console.log('No hay teléfonos registrados, mostrando alerta');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este recuso humano?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede registro');
        const body: IRecHumano = this.myFormRecHumano.value;

        this._recHumanoService.registrarRecHumano(body).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('Recurso registrado');
              this.ultimosRecHumano();
              this.nuevoRecHumano();
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

  actualizarRecHumano() {
    this.formSubmitted = true;

    console.log('entro a actualizarRecHumano');
    if (this.myFormRecHumano.invalid) {
      this.myFormRecHumano.markAllAsTouched();
      return;
    }

    if (!this.validarArrayTelefono()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este recurso humano?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede actualización');
        const formValue = this.myFormRecHumano.value;

        this._recHumanoService
          .actualizarRecHumano(formValue.codRecHumano, formValue)
          .subscribe({
            next: (res) => {
              if (res.ok) {
                this.mostrarAlertaExito('actualizado');
                this.ultimosRecHumano();
                this.nuevoRecHumano();
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

  nuevoRecHumano() {
    this.myFormRecHumano.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario
    this.phones.clear(); // Limpia el FormArray de teléfonos, si es necesario
    this.profesionesRecurso.clear();
    this.myFormRecHumano.patchValue({
      departamentoRecHumano: '15',
      provinciaRecHumano: '01',
      distritoRecHumano: '',
    });
    this.recHumanoSeleccionado = false;
  }

  private suscribirseUsuarioSistema(): void {
    this.myFormRecHumano
      .get('usuarioSistema')
      ?.valueChanges.subscribe((esUsuario) => {
        const grupoLogin = this.myFormRecHumano.get('datosLogueo') as FormGroup;

        if (esUsuario) {
          // Activar campos y establecer validaciones
          grupoLogin.get('nombreUsuario')?.enable();
          grupoLogin.get('correoLogin')?.enable();
          grupoLogin.get('passwordHash')?.enable();
          grupoLogin.get('rol')?.enable();
          grupoLogin.get('sedeAsignada')?.enable();
          grupoLogin.get('estado')?.enable();

          grupoLogin.get('nombreUsuario')?.setValidators([Validators.required]);
          grupoLogin.get('passwordHash')?.setValidators([Validators.required]);
          grupoLogin.get('rol')?.setValidators([Validators.required]);
          grupoLogin.get('sedeAsignada')?.setValidators([Validators.required]);
        } else {
          // Desactivar campos y quitar validaciones
          grupoLogin.get('nombreUsuario')?.reset();
          grupoLogin.get('correoLogin')?.reset();
          grupoLogin.get('passwordHash')?.reset();
          grupoLogin.get('rol')?.reset();
          grupoLogin.get('sedeAsignada')?.reset();

          grupoLogin.get('nombreUsuario')?.clearValidators();
          grupoLogin.get('correoLogin')?.clearValidators();
          grupoLogin.get('passwordHash')?.clearValidators();
          grupoLogin.get('rol')?.clearValidators();
          grupoLogin.get('sedeAsignada')?.clearValidators();

          grupoLogin.get('nombreUsuario')?.disable();
          grupoLogin.get('correoLogin')?.disable();
          grupoLogin.get('passwordHash')?.disable();
          grupoLogin.get('rol')?.disable();
          grupoLogin.get('sedeAsignada')?.disable();
          grupoLogin.get('estado')?.disable();
        }

        // Actualiza el estado de los controles para que los errores se reflejen
        grupoLogin.get('nombreUsuario')?.updateValueAndValidity();
        grupoLogin.get('correoLogin')?.updateValueAndValidity();
        grupoLogin.get('passwordHash')?.updateValueAndValidity();
        grupoLogin.get('rol')?.updateValueAndValidity();
        grupoLogin.get('sedeAsignada')?.updateValueAndValidity();
      });
  }
}
