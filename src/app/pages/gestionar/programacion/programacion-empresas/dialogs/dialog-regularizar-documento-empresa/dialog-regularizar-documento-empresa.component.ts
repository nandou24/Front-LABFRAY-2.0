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
  IHistorialDocumentoPaciente,
  IVerificacionDocumentoHC,
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

  readonly esCorreccion = this.data.programacion.accionDocumentoPaciente === 'CORREGIR';
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
    nombreUsuarioAutorizador: new FormControl('', { nonNullable: true }),
    passwordAutorizador: new FormControl('', { nonNullable: true }),
  });

  guardando = false;
  mensajeError = '';
  mostrandoHistorial = false;
  cargandoHistorial = false;
  errorHistorial = '';
  historial: IHistorialDocumentoPaciente[] = [];
  verificacion: IVerificacionDocumentoHC | null = null;
  verificando = false;
  errorVerificacion = '';

  // ====== Habilitar guardado solo con verificación vigente ======
  get puedeGuardarDocumento(): boolean {
    const resultado = this.verificacion;
    return !this.guardando && !this.verificando && this.formulario.valid &&
      resultado?.ok === true && resultado.hayCoincidencias === false &&
      resultado.tipoDoc === this.formulario.controls.tipoDoc.value &&
      resultado.nroDoc === this.formulario.controls.nroDoc.value.trim().toUpperCase();
  }

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
    this.formulario.controls.nroDoc.updateValueAndValidity({ emitEvent: false });
  }

  constructor() {
    this.actualizarTipoDocumento();
    this.formulario.controls.tipoDoc.valueChanges.subscribe(() => this.limpiarVerificacion());
    this.formulario.controls.nroDoc.valueChanges.subscribe(() => this.limpiarVerificacion());
    if (this.esCorreccion) {
      this.formulario.controls.nombreUsuarioAutorizador.addValidators(Validators.required);
      this.formulario.controls.passwordAutorizador.addValidators(Validators.required);
      this.formulario.controls.nombreUsuarioAutorizador.updateValueAndValidity();
      this.formulario.controls.passwordAutorizador.updateValueAndValidity();
    }
  }

  // ====== Consultar historial solo cuando se solicita ======
  async alternarHistorial(): Promise<void> {
    this.mostrandoHistorial = !this.mostrandoHistorial;
    if (!this.mostrandoHistorial || this.cargandoHistorial || this.historial.length) return;
    const id = this.data.programacion._id;
    if (!id) return;
    this.cargandoHistorial = true;
    this.errorHistorial = '';
    try {
      const respuesta = await firstValueFrom(this.service.historialDocumentos(id));
      this.historial = respuesta.historial ?? [];
    } catch (error: any) {
      this.errorHistorial = error?.error?.msg || 'No se pudo consultar el historial.';
    } finally {
      this.cargandoHistorial = false;
    }
  }


  // ====== Reiniciar revisión ante cambios de documento ======
  private limpiarVerificacion(): void {
    this.verificacion = null;
    this.errorVerificacion = '';
    this.mensajeError = '';
  }

  // ====== Buscar HC con documento actual o histórico ======
  async verificarDocumento(): Promise<boolean> {
    this.mensajeError = '';
    this.errorVerificacion = '';
    this.actualizarTipoDocumento();
    if (!this.data.programacion._id || this.formulario.controls.nroDoc.invalid ||
        this.formulario.controls.tipoDoc.invalid || this.verificando) return false;
    this.verificando = true;
    this.errorVerificacion = '';
    this.verificacion = null;
    const tipoDoc = this.formulario.controls.tipoDoc.value;
    const nroDoc = this.formulario.controls.nroDoc.value.trim().toUpperCase();
    try {
      const resultado = await firstValueFrom(this.service.verificarDocumento(this.data.programacion._id, { tipoDoc, nroDoc }));
      if (tipoDoc !== this.formulario.controls.tipoDoc.value ||
          nroDoc !== this.formulario.controls.nroDoc.value.trim().toUpperCase()) return false;
      this.verificacion = resultado;
      return resultado.ok && !resultado.hayCoincidencias;
    } catch (error: any) {
      this.errorVerificacion = error?.error?.msg || 'No se pudo comprobar el documento.';
      return false;
    } finally {
      this.verificando = false;
    }
  }

  async guardar(): Promise<void> {
    this.actualizarTipoDocumento();
    if (this.formulario.invalid || !this.data.programacion._id || this.guardando) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.puedeGuardarDocumento) {
      this.mensajeError = 'Verifica el documento y confirma que no existan coincidencias antes de guardar.';
      return;
    }
    this.mensajeError = '';
    // ====== El backend vuelve a validar conflictos durante el guardado ======
    this.guardando = true;
    const valores = this.formulario.getRawValue();
    const datos = {
      tipoDoc: valores.tipoDoc,
      nroDoc: valores.nroDoc.trim().toUpperCase(),
      motivo: valores.motivo.trim(),
      identidadConfirmada: valores.identidadConfirmada,
    };
    try {
      const solicitud = this.esCorreccion
        ? this.service.corregirDocumento(this.data.programacion._id, {
            ...datos,
            nombreUsuarioAutorizador: valores.nombreUsuarioAutorizador.trim(),
            passwordAutorizador: valores.passwordAutorizador,
          })
        : this.service.regularizarDocumento(this.data.programacion._id, datos);
      const resultado = await firstValueFrom(solicitud);
      if (resultado.ok && resultado.programacion) {
        this.dialogRef.close(resultado);
      } else {
        this.mensajeError = resultado.msg || 'No se pudo guardar el documento.';
      }
    } catch (error: any) {
      this.mensajeError = error?.error?.msg || 'No se pudo actualizar el documento.';
      if (error?.error?.coincidencias?.hayCoincidencias) {
        this.verificacion = { ok: true, msg: this.mensajeError,
          tipoDoc: valores.tipoDoc, nroDoc: datos.nroDoc, ...error.error.coincidencias };
      }
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    if (!this.guardando) this.dialogRef.close();
  }
}
