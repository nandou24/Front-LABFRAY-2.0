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
import { ReferenciaMedicoService } from '../../../../services/mantenimiento/referencias/referencia-medico.service';
import { UbigeoService } from '../../../../services/utilitarios/ubigeo.service';
import { FechaValidatorService } from '../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { IRefMedico } from '../../../../models/Mantenimiento/referenciaMedico.models';
import { ProfesionService } from '../../../../services/mantenimiento/profesion/profesion.service';
import { EspecialidadService } from '../../../../services/mantenimiento/especialidad/especialidad.service';

@Component({
  selector: 'app-referencia-medico',
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
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './referencia-medico.component.html',
  styleUrl: './referencia-medico.component.scss',
})
export class ReferenciaMedicoComponent implements OnInit, AfterViewInit {
  constructor(
    private _refMedicoService: ReferenciaMedicoService,
    private _ubigeoService: UbigeoService,
  ) {}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosRefMedico();
    this.listarProfesiones();
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  private _fb = inject(FormBuilder);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);
  private _profesionService = inject(ProfesionService);
  private _especialidadService = inject(EspecialidadService);

  public myFormRefMedico: FormGroup = this._fb.group({
    codRefMedico: '',
    tipoDoc: ['', [Validators.required]],
    nroDoc: [
      '',
      [
        Validators.required,
        this._documentValidator.documentValidator('tipoDoc'),
      ],
    ],
    nombreRefMedico: ['', [Validators.required]],
    apePatRefMedico: ['', [Validators.required]],
    apeMatRefMedico: [''],
    fechaNacimiento: [
      '',
      [Validators.required, this._fechaService.fechaNoFuturaValidator()],
    ],
    edad: [{ value: '', disabled: true }],
    sexoRefMedico: ['', [Validators.required]],
    departamentoRefMedico: ['15'],
    provinciaRefMedico: ['01'],
    distritoRefMedico: ['', [Validators.required]],
    direcRefMedico: [''],
    mailRefMedico: ['', [Validators.email]],
    phones: this._fb.array([], Validators.required),
    profesionesRefMedico: this._fb.array([]),
    profesionSolicitante: new FormControl(null),
    //especialidadesRefMedico: this._fb.array([]),
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
    return this.myFormRefMedico.get('phones') as FormArray;
  }
  get profesionesRefMedico(): FormArray {
    return this.myFormRefMedico.get('profesionesRefMedico') as FormArray;
  }

  especialidades(i: number): FormArray {
    return this.profesionesRefMedico.at(i).get('especialidades') as FormArray;
  }

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  onDepartamentoChange(): void {
    this.myFormRefMedico
      .get('departamentoRefMedico')
      ?.valueChanges.subscribe((departamentoId) => {
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        this.myFormRefMedico.get('provinciaRefMedico')?.setValue('01');
      });
  }
  onProvinciaChange(): void {
    this.myFormRefMedico
      .get('provinciaRefMedico')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.myFormRefMedico.get(
          'departamentoRefMedico',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.myFormRefMedico.get('distritoRefMedico')?.setValue('01');
      });
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  agregarTelefono() {
    const telefonoForm = this._fb.group({
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{9,11}$/)],
      ],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]],
    });
    this.phones.push(telefonoForm);
  }
  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
  }

  agregarProfesion() {
    this.profesionesRefMedico.push(this.crearProfesion());
  }

  eliminarProfesion(index: number) {
    this.profesionesRefMedico.removeAt(index);
  }

  agregarEspecialidad(i: number) {
    this.especialidades(i).push(this.crearEspecialidad());
  }

  eliminarEspecialidad(i: number, j: number) {
    this.especialidades(i).removeAt(j);
  }

  public formSubmitted: boolean = false;
  validarArrayTelefono(): boolean {
    const telefonos = this.myFormRefMedico.get('phones') as FormArray;
    return telefonos.length > 0;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorRefMedico') paginatorRefMedico!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceRefMedico.paginator = this.paginatorRefMedico;
  }

  columnasTablaRefMedico: string[] = [
    'nro',
    'codigo',
    'nombreCompleto',
    'nroDoc',
  ];
  dataSourceRefMedico = new MatTableDataSource<IRefMedico>();

  filaSeleccionadaIndex: number | null = null;

  cargarRefMedico(refMedico: IRefMedico, index: number): void {
    this.filaSeleccionadaIndex = index;

    this.refMedicoSeleccionado = true;

    this.myFormRefMedico.patchValue(refMedico);
    this.phones.clear();
    refMedico.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });
    this.actualizarEdad();
    this.profesionesRefMedico.clear();

    refMedico.profesionesRefMedico.forEach((profesion: any, index: number) => {
      this.profesionesRefMedico.push(this.crearProfesionGroup(profesion));
      const profesionId = profesion.profesionRef._id || profesion.profesionRef;
      this.onProfesionSeleccionada(profesionId, index);
    });
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

  // Array para mantener todos los datos iniciales en memoria
  private todosLosRefMedicos: IRefMedico[] = [];

  ultimosRefMedico(): void {
    console.log('Cargando últimos referentes médicos');
    this._refMedicoService.getLastRefMedicos(0).subscribe((refMedico) => {
      this.todosLosRefMedicos = refMedico; // Guardar todos los datos en memoria
      this.dataSourceRefMedico.data = refMedico;
    });
  }

  actualizarEdad() {
    const fecha = this.myFormRefMedico.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.myFormRefMedico.get('edad')?.setValue(edadCalculada);
  }

  terminoBusqueda = new FormControl('');

  buscarRefMedico() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todos los datos iniciales
      this.dataSourceRefMedico.data = this.todosLosRefMedicos;
      this.dataSourceRefMedico.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceRefMedico.data = this.todosLosRefMedicos; // Asegurar que tiene todos los datos
      this.dataSourceRefMedico.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceRefMedico.paginator) {
      this.dataSourceRefMedico.paginator.firstPage();
    }
  }
  seleccionarProfesionSolicitante(index: number) {
    const grupo = this.profesionesRefMedico.at(index);
    const estabaActivo = grupo.get('profesionSolicitante')?.value;
    if (estabaActivo) {
      grupo.get('profesionSolicitante')?.setValue(false);
      this.myFormRefMedico.get('profesionSolicitante')?.reset();
    } else {
      this.profesionesRefMedico.controls.forEach((group, i) => {
        group.get('profesionSolicitante')?.setValue(i === index);
      });
      const { profesion, nroColegiatura } = grupo.value;
      this.myFormRefMedico
        .get('profesionSolicitante')
        ?.setValue({ profesion, nroColegiatura });
    }
  }
  refMedicoSeleccionado = false;
  registrarRefMedico() {
    this.formSubmitted = true;
    if (this.myFormRefMedico.invalid) {
      this.myFormRefMedico.markAllAsTouched();
      return;
    }
    if (!this.validarArrayTelefono()) {
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este referente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const body: IRefMedico = this.myFormRefMedico.value;
        this._refMedicoService.registrarRefMedico(body).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('registrado');
              this.ultimosRefMedico();
              this.nuevoRefMedico();
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
      text: 'Referente ' + tipo + ' correctamente',
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
  actualizarRefMedico() {
    this.formSubmitted = true;
    if (this.myFormRefMedico.invalid) {
      this.myFormRefMedico.markAllAsTouched();
      return;
    }
    if (!this.validarArrayTelefono()) {
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este referente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const formValue = this.myFormRefMedico.value;
        this._refMedicoService
          .actualizarRefMedico(formValue.codRefMedico, formValue)
          .subscribe({
            next: (res) => {
              if (res.ok) {
                this.mostrarAlertaExito('actualizado');
                this.ultimosRefMedico();
                this.nuevoRefMedico();
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
  nuevoRefMedico() {
    this.myFormRefMedico.reset();
    this.formSubmitted = false;
    this.phones.clear();
    this.profesionesRefMedico.clear();
    this.myFormRefMedico.patchValue({
      departamentoRefMedico: '15',
      provinciaRefMedico: '01',
      distritoRefMedico: '',
      profesionSolicitante: { profesion: '', nroColegiatura: '' },
    });
    this.refMedicoSeleccionado = false;
    this.filaSeleccionadaIndex = null; // Resetear la fila seleccionada
  }
}
