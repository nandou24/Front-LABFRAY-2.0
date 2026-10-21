import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import {
  IProgramacionEmpresa,
  TipoDocumentoProgramacion,
} from '../../../../../../models/Gestion/programacionEmpresa.models';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';

@Component({
  selector: 'app-dialog-regularizar-documento-empresa',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule,
  ],
  templateUrl: './dialog-regularizar-documento-empresa.component.html',
  styleUrl: './dialog-regularizar-documento-empresa.component.scss',
})
export class DialogRegularizarDocumentoEmpresaComponent {
  private readonly dialogRef = inject(MatDialogRef<DialogRegularizarDocumentoEmpresaComponent>);
  private readonly service = inject(ProgramacionEmpresaService);
  readonly data = inject(MAT_DIALOG_DATA) as { programacion: IProgramacionEmpresa };

  readonly formulario = new FormGroup({
    tipoDoc: new FormControl<TipoDocumentoProgramacion>(
      (this.data.programacion.tipoDoc as TipoDocumentoProgramacion) || 'DNI',
      { nonNullable: true, validators: [Validators.required] },
    ),
    nroDoc: new FormControl(this.data.programacion.nroDoc ?? '', {
      nonNullable: true, validators: [Validators.required],
    }),
    motivo: new FormControl('', {
      nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(300)],
    }),
    identidadConfirmada: new FormControl(false, {
      nonNullable: true, validators: [Validators.requiredTrue],
    }),
  });

  guardando = false;
  mensajeError = '';

  get nombreCompleto(): string {
    const p = this.data.programacion;
    return [p.apePatCliente, p.apeMatCliente, p.nombreCliente]
      .filter(Boolean).join(' ');
  }

  // ====== Cambiar validación según el tipo de documento ======
  actualizarTipoDocumento(): void {
    const formato: Record<TipoDocumentoProgramacion, RegExp> = {
      DNI: /^\d{8}$/,
      CE: /^[A-Za-z0-9]{1,13}$/,
      PASAPORTE: /^[A-Za-z0-9]{1,16}$/,
    };
    const tipo = this.formulario.controls.tipoDoc.value;
    this.formulario.controls.nroDoc.setValidators([
      Validators.required, Validators.pattern(formato[tipo]),
    ]);
    this.formulario.controls.nroDoc.updateValueAndValidity();
  }

  constructor() {
    this.actualizarTipoDocumento();
  }

  async guardar(): Promise<void> {
    this.actualizarTipoDocumento();
    if (this.formulario.invalid || !this.data.programacion._id || this.guardando) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensajeError = '';
    const { tipoDoc, nroDoc, motivo } = this.formulario.getRawValue();
    try {
      const resultado = await firstValueFrom(this.service.regularizarDocumento(
        this.data.programacion._id,
        { tipoDoc, nroDoc: nroDoc.trim().toUpperCase(), motivo: motivo.trim() },
      ));
      if (resultado.ok && resultado.programacion) {
        this.dialogRef.close(resultado);
      } else {
        this.mensajeError = resultado.msg || 'No se pudo guardar el documento.';
      }
    } catch (error: any) {
      this.mensajeError = error?.error?.msg || 'No se pudo actualizar el documento.';
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    if (!this.guardando) this.dialogRef.close();
  }
}
