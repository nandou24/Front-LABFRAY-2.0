import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { FechaValidatorService } from '../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../services/utilitarios/validators/docValidator/doc-validator.service';

@Component({
  selector: 'app-programacion-paciente',
  imports: [
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './programacion-paciente.component.html',
  styleUrl: './programacion-paciente.component.scss',
})
export class ProgramacionPacienteComponent {
  private _fb = inject(FormBuilder);
  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);

  public myFormProgramacion: FormGroup = this._fb.group({
    codProgramacion: '',
    hc: [null],
    tipoDoc: ['DNI', [Validators.required]], // Valor por defecto: DNI
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
    fechaNacimiento: ['', [this._fechaService.fechaNoFuturaValidator()]],
    edad: [{ value: '', disabled: true }],
    sexoCliente: [],
    departamentoCliente: ['15'],
    provinciaCliente: ['01'],
    distritoCliente: ['', Validators.required],
    direcCliente: [''],
    mailCliente: ['', Validators.email],
    phones: this._fb.array([]),
  });

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  actualizarEdad() {
    const fecha = this.myFormProgramacion.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.myFormProgramacion.get('edad')?.setValue(edadCalculada);
  }
}
