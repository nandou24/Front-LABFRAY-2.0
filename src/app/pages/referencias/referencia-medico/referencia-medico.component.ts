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
import { UbigeoService } from '../../../services/utilitarios/ubigeo.service';
import { IRefMedico } from '../../../models/referenciaMedico.models';
import { ReferenciaMedicoService } from '../../../services/mantenimiento/referencias/referencia-medico.service';
import Swal from 'sweetalert2';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { DocValidatorService } from '../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { FechaValidatorService } from '../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';

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
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  private _fb = inject(FormBuilder);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);

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
    especialidadesRefMedico: this._fb.array([]),
  });

  get phones(): FormArray {
    return this.myFormRefMedico.get('phones') as FormArray;
  }
  get profesionesRefMedico(): FormArray {
    return this.myFormRefMedico.get('profesionesRefMedico') as FormArray;
  }
  get especialidadesRefMedico(): FormArray {
    return this.myFormRefMedico.get('especialidadesRefMedico') as FormArray;
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
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
    const profesionForm = this._fb.group({
      nivelProfesion: ['', [Validators.required]],
      titulo: [''],
      profesion: ['', [Validators.required]],
      nroColegiatura: [''],
      centroEstudiosProfesion: [''],
      anioEgresoProfesion: [''],
      profesionSolicitante: [false],
    });
    this.profesionesRefMedico.push(profesionForm);
  }
  eliminarProfesion(index: number) {
    this.profesionesRefMedico.removeAt(index);
  }
  agregarEspecialidad() {
    const especialidadForm = this._fb.group({
      especialidad: ['', [Validators.required]],
      centroEstudiosEspecialidad: [''],
      rne: ['', [Validators.required]],
      anioEgresoEspecialidad: [''],
    });
    this.especialidadesRefMedico.push(especialidadForm);
  }
  eliminarEspecialidad(index: number) {
    this.especialidadesRefMedico.removeAt(index);
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

  cargarRefMedico(refMedico: IRefMedico): void {
    this.refMedicoSeleccionado = true;

    this.myFormRefMedico.patchValue({
      codRefMedico: refMedico.codRefMedico,
      tipoDoc: refMedico.tipoDoc,
      nroDoc: refMedico.nroDoc,
      nombreRefMedico: refMedico.nombreRefMedico,
      apePatRefMedico: refMedico.apePatRefMedico,
      apeMatRefMedico: refMedico.apeMatRefMedico,
      fechaNacimiento: refMedico.fechaNacimiento,
      sexoRefMedico: refMedico.sexoRefMedico,
      departamentoRefMedico: refMedico.departamentoRefMedico,
      provinciaRefMedico: refMedico.provinciaRefMedico,
      distritoRefMedico: refMedico.distritoRefMedico,
      direcRefMedico: refMedico.direcRefMedico,
      mailRefMedico: refMedico.mailRefMedico,
    });
    this.phones.clear();
    refMedico.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });
    this.actualizarEdad();
    this.profesionesRefMedico.clear();
    if (refMedico.profesionesRefMedico) {
      refMedico.profesionesRefMedico.forEach((profesion: any) => {
        const esSolicitante =
          refMedico.profesionSolicitante?.profesion === profesion.profesion;
        this.profesionesRefMedico.push(
          this.crearProfesionGroup(profesion, esSolicitante),
        );
      });
    }
    this.especialidadesRefMedico.clear();
    if (refMedico.especialidadesRefMedico) {
      refMedico.especialidadesRefMedico.forEach((especialidad: any) => {
        this.especialidadesRefMedico.push(
          this.crearEspecialidadGroup(especialidad),
        );
      });
    }
  }
  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone],
    });
  }
  private crearProfesionGroup(
    profesion: any,
    esSolicitante: boolean,
  ): FormGroup {
    return this._fb.group({
      nivelProfesion: [profesion.nivelProfesion],
      titulo: [profesion.titulo],
      profesion: [profesion.profesion],
      nroColegiatura: [profesion.nroColegiatura],
      centroEstudiosProfesion: [profesion.centroEstudiosProfesion],
      anioEgresoProfesion: [profesion.anioEgresoProfesion],
      profesionSolicitante: [esSolicitante],
    });
  }
  private crearEspecialidadGroup(especialidad: any): FormGroup {
    return this._fb.group({
      especialidad: [especialidad.especialidad],
      rne: [especialidad.rne],
      centroEstudiosEspecialidad: [especialidad.centroEstudiosEspecialidad],
      anioEgresoEspecialidad: [especialidad.anioEgresoEspecialidad],
    });
  }
  ultimosRefMedico(): void {
    console.log('Cargando últimos referentes médicos');
    this._refMedicoService.getLastRefMedicos(0).subscribe((refMedico) => {
      this.dataSourceRefMedico.data = refMedico;
    });
  }
  actualizarEdad() {
    const fecha = this.myFormRefMedico.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.myFormRefMedico.get('edad')?.setValue(edadCalculada);
  }

  terminoBusquedaRefMedicoControl = new FormControl('');
  filtrarRefMedico() {
    const termino = this.terminoBusquedaRefMedicoControl.value || '';
    this.dataSourceRefMedico.filter = termino.trim().toLowerCase();
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
    this.especialidadesRefMedico.clear();
    this.myFormRefMedico.patchValue({
      departamentoRefMedico: '15',
      provinciaRefMedico: '01',
      distritoRefMedico: '',
      profesionSolicitante: { profesion: '', nroColegiatura: '' },
    });
    this.refMedicoSeleccionado = false;
  }
}
