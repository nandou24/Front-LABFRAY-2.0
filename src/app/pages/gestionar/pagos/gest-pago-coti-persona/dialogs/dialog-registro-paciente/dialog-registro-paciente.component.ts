import { Component, inject, OnInit } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { UbigeoService } from '../../../../../../services/utilitarios/ubigeo.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PacienteService } from '../../../../../../services/mantenimiento/paciente/paciente.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-registro-paciente',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
  ],
  templateUrl: './dialog-registro-paciente.component.html',
  styleUrl: './dialog-registro-paciente.component.scss',
})
export class DialogRegistroPacienteComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);
  private _ubigeoService = inject(UbigeoService);
  private _dialogRef = inject(MatDialogRef<DialogRegistroPacienteComponent>);
  private _pacienteService = inject(PacienteService);
  private _data = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.onDepartamentoChange();
    this.onProvinciaChange();

    console.log('Datos recibidos en el diálogo:', this._data);
    // Actualizar valores del formulario con los datos recibidos
    if (this._data) {
      this.pacientePagoForm.patchValue({
        tipoDoc: this._data.paciente.tipoDoc ?? '',
        nroDoc: this._data.paciente.nroDoc ?? '',
        nombreCliente: this._data.paciente.nombreCompleto ?? '',
      });
    }
  }

  public pacientePagoForm: FormGroup = this._fb.group({
    hc: [''],
    tipoDoc: ['', [Validators.required]], // Valor por defecto: DNI
    nroDoc: [
      '',
      [
        Validators.required,
        this._documentValidator.documentValidator('tipoDoc'),
      ],
    ],
    apePatCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatCliente: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    nombreCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    fechaNacimiento: [
      '',
      [Validators.required, this._fechaService.fechaNoFuturaValidator()],
    ],
    edad: [{ value: '', disabled: true }],
    sexoCliente: ['', Validators.required],
    departamentoCliente: ['15'],
    provinciaCliente: ['01'],
    distritoCliente: ['', Validators.required],
    direcCliente: [''],
    mailCliente: ['', Validators.email],
    phones: this._fb.array([]),
  });

  get phones(): FormArray {
    return this.pacientePagoForm.get('phones') as FormArray;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  codCotizacion = this._data?.codCotizacion;
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  onDepartamentoChange(): void {
    this.pacientePagoForm
      .get('departamentoCliente')
      ?.valueChanges.subscribe((departamentoId) => {
        // Obtener y cargar las provincias según el departamento seleccionado
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        // Reiniciar el select de provincias
        this.pacientePagoForm.get('provinciaCliente')?.setValue('01'); // Limpia la selección de provincias
      });
  }

  onProvinciaChange(): void {
    this.pacientePagoForm
      .get('provinciaCliente')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.pacientePagoForm.get(
          'departamentoCliente',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.pacientePagoForm.get('distritoCliente')?.setValue('01');
      });
  }

  public formSubmitted: boolean = false;

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

  actualizarEdad() {
    console.log('Entro actualizar edad');
    const fecha = this.pacientePagoForm.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.pacientePagoForm.get('edad')?.setValue(edadCalculada);
  }

  validarArrayTelefono(): boolean {
    const telefonos = this.pacientePagoForm.get('phones') as FormArray;

    if (telefonos.length > 0) {
      return true;
    }
    return false;
  }

  registrarPaciente() {
    if (this.pacientePagoForm.invalid || !this.validarArrayTelefono()) {
      this.pacientePagoForm.markAllAsTouched();
      return;
    }

    const paciente = this.pacientePagoForm.getRawValue();
    paciente.codCotizacion = this.codCotizacion;

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este paciente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._pacienteService
          .registrarPacienteDesdeCotizacion(paciente)
          .subscribe({
            next: (resp) => {
              Swal.fire({
                title: '¡Paciente registrado!',
                text: 'Se registró correctamente y se asignó la historia clínica.',
                icon: 'success',
                confirmButtonText: 'Aceptar',
                timer: 1500,
                timerProgressBar: true,
                showConfirmButton: false,
              });
              this._dialogRef.close({
                exito: true,
                nuevoHC: resp.hc,
                paciente: resp.paciente,
              });
            },
            error: (err) => {
              console.error('Error al registrar paciente:', err);
              Swal.fire(
                'Error',
                err?.error?.msg || 'No se pudo registrar al paciente.',
                'error',
              );
            },
          });
      }
    });
  }

  cancelarRegistroPaciente() {}
}
