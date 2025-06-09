import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
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
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { UbigeoService } from '../../../services/utilitarios/ubigeo.service';
import { IRefMedico } from '../../../models/referenciaMedico.models';
import { ReferenciaMedicoService } from '../../../services/mantenimiento/referencias/referencia-medico.service';
import Swal from 'sweetalert2';

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
    CommonModule
  ],
  templateUrl: './referencia-medico.component.html',
  styleUrl: './referencia-medico.component.scss'
})
export class ReferenciaMedicoComponent implements OnInit, AfterViewInit {
  constructor(
    private _refMedicoService: ReferenciaMedicoService,
    private _ubigeoService: UbigeoService
  ){}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15','01');
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosRefMedico();
  }

  private _fb = inject(FormBuilder);

  public myFormRefMedico: FormGroup = this._fb.group({
    codRefMedico: '',
    tipoDoc: ['', [Validators.required]],
    nroDoc: ['', [Validators.required,
                      documentValidator('tipoDoc')
                    ]],
    nombreRefMedico: ['', [Validators.required]],
    apePatRefMedico: ['', [Validators.required]],
    apeMatRefMedico: [''],
    fechaNacimiento: ['', [Validators.required]],
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
    this.myFormRefMedico.get('departamentoRefMedico')?.valueChanges.subscribe(departamentoId => {
      this.provincias = this._ubigeoService.getProvincia(departamentoId);
      this.distritos = this._ubigeoService.getDistrito(departamentoId,'01');
      this.myFormRefMedico.get('provinciaRefMedico')?.setValue('01');
    });
  }
  onProvinciaChange(): void {
    this.myFormRefMedico.get('provinciaRefMedico')?.valueChanges.subscribe(provinciaId => {
      const departamentoId = this.myFormRefMedico.get('departamentoRefMedico')?.value;
      this.distritos = this._ubigeoService.getDistrito(departamentoId, provinciaId);
      this.myFormRefMedico.get('distritoRefMedico')?.setValue('01');
    });
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  agregarTelefono() {
    const telefonoForm = this._fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{9,11}$/)]],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]]
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
      profesionSolicitante: [false]
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
      anioEgresoEspecialidad: ['']
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

  columnasTablaRefMedico: string[] = ['nro', 'codigo', 'nombreCompleto', 'nroDoc'];
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
      mailRefMedico: refMedico.mailRefMedico
    });
    this.phones.clear();
    refMedico.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });
    this.actualizarEdad();
    this.profesionesRefMedico.clear();
    if (refMedico.profesionesRefMedico) {
      refMedico.profesionesRefMedico.forEach((profesion: any) => {
        const esSolicitante = refMedico.profesionSolicitante?.profesion === profesion.profesion;
        this.profesionesRefMedico.push(this.crearProfesionGroup(profesion, esSolicitante));
      });
    }
    this.especialidadesRefMedico.clear();
    if (refMedico.especialidadesRefMedico) {
      refMedico.especialidadesRefMedico.forEach((especialidad: any) => {
        this.especialidadesRefMedico.push(this.crearEspecialidadGroup(especialidad));
      });
    }
  }
  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone]
    });
  }
  private crearProfesionGroup(profesion: any, esSolicitante: boolean): FormGroup {
    return this._fb.group({
      nivelProfesion: [profesion.nivelProfesion],
      titulo: [profesion.titulo],
      profesion: [profesion.profesion],
      nroColegiatura: [profesion.nroColegiatura],
      centroEstudiosProfesion: [profesion.centroEstudiosProfesion],
      anioEgresoProfesion: [profesion.anioEgresoProfesion],
      profesionSolicitante: [esSolicitante]
    });
  }
  private crearEspecialidadGroup(especialidad: any): FormGroup {
    return this._fb.group({
      especialidad: [especialidad.especialidad],
      rne: [especialidad.rne],
      centroEstudiosEspecialidad: [especialidad.centroEstudiosEspecialidad],
      anioEgresoEspecialidad: [especialidad.anioEgresoEspecialidad]
    });
  }
  ultimosRefMedico(): void {
    console.log("Cargando últimos referentes médicos");
    this._refMedicoService.getLastRefMedicos(0).subscribe(refMedico => {
      this.dataSourceRefMedico.data = refMedico;
    });
  }
  actualizarEdad() {
    const fecha = this.myFormRefMedico.get('fechaNacimiento')?.value;
    const edadCalculada = this.calcularEdad(fecha);
    this.myFormRefMedico.get('edad')?.setValue(edadCalculada);
  }
  calcularEdad(fechaNacimiento: Date | string): string {
    if (!fechaNacimiento) return '';
    const birthDate = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
    if (isNaN(birthDate.getTime())) return '';
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) {
      months += 12;
      years--;
    }
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    return `${years} años, ${months} meses, y ${days} días`;
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
      this.myFormRefMedico.get('profesionSolicitante')?.setValue({ profesion, nroColegiatura });
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
            const mensaje = error?.error?.msg || 'Error inesperado al registrar.';
            this.mostrarAlertaError(mensaje);
          }
        });
      }
    });
  }
  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: 'Confirmado',
      text: 'Referente ' + tipo + ' correctamente',
      icon: 'success',
      confirmButtonText: 'Ok'
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
        this._refMedicoService.actualizarRefMedico(formValue.codRefMedico, formValue).subscribe({
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
            const mensaje = error?.error?.msg || 'Error inesperado al registrar.';
            this.mostrarAlertaError(mensaje);
          }
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
      profesionSolicitante: { profesion: '', nroColegiatura: '' }
    });
    this.refMedicoSeleccionado = false;
  }
}

export function documentValidator(tipoDocControlName: string): ValidatorFn {
  return (control: AbstractControl) => {
    const parent = control.parent; // Accede al formulario completo
    if (!parent) return null; // Verifica si existe un formulario padre

    const tipoDoc = parent.get(tipoDocControlName)?.value; // Obtén el valor de tipoDoc
    const nroDoc = control.value; // Obtén el valor del número de documento

    if (tipoDoc === 'DNI') {
      // DNI: exactamente 8 dígitos numéricos
      if (!/^\d{8}$/.test(nroDoc)) {
        return { invalidDNI: true };
      }
    } else if (tipoDoc === 'CE') {
      // CE: máximo 13 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,13}$/.test(nroDoc)) {
        return { invalidCE: true };
      }
    } else if (tipoDoc === 'PASAPORTE') {
      // Pasaporte: máximo 16 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,16}$/.test(nroDoc)) {
        return { invalidPasaporte: true };
      }
    }

    return null; // Es válido
  };
}