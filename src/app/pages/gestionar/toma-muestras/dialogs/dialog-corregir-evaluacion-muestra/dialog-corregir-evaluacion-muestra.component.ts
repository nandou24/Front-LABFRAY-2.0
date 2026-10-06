import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import Swal from 'sweetalert2';

import {
  EstadoCorreccionEvaluacionMuestra,
  IMuestraLaboratorio,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface ICorregirEvaluacionMuestraDialogData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-corregir-evaluacion-muestra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    CapturaEvidenciaMuestraComponent,
  ],
  templateUrl: './dialog-corregir-evaluacion-muestra.component.html',
  styleUrl: './dialog-corregir-evaluacion-muestra.component.scss',
})
export class DialogCorregirEvaluacionMuestraComponent {
  readonly data = inject<ICorregirEvaluacionMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogCorregirEvaluacionMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  procesando = false;
  ocultarPassword = true;
  archivoEvidencia: File | null = null;

  readonly formCorreccion = this._fb.group({
    motivoCorreccion: ['', [Validators.required]],
    nombreUsuarioAutorizador: ['', [Validators.required]],
    passwordAutorizador: ['', [Validators.required]],
  });

  // ====== Estado destino ======

  get estadoNuevo(): EstadoCorreccionEvaluacionMuestra {
    return this.data.muestra.estadoMuestra === 'ACEPTADA'
      ? 'RECHAZADA'
      : 'ACEPTADA';
  }

  // ====== Requiere fotografía ======

  get requiereEvidencia(): boolean {
    return this.estadoNuevo === 'RECHAZADA';
  }

  // ====== Cerrar ======

  cerrar(): void {
    if (this.procesando) {
      return;
    }

    this.formCorreccion.controls.passwordAutorizador.reset('');
    this._dialogRef.close(false);
  }

  // ====== Cambiar evidencia ======

  cambiarEvidencia(evidencia: IEvidenciaCapturada | null): void {
    this.archivoEvidencia = evidencia?.archivo ?? null;
  }

  // ====== Corregir evaluación ======

  async corregirEvaluacion(): Promise<void> {
    if (
      this.procesando ||
      !['ACEPTADA', 'RECHAZADA'].includes(this.data.muestra.estadoMuestra)
    ) {
      return;
    }

    if (this.formCorreccion.invalid) {
      this.formCorreccion.markAllAsTouched();
      return;
    }

    const motivo =
      this.formCorreccion.controls.motivoCorreccion.value?.trim() ?? '';
    const nombreUsuarioAutorizador =
      this.formCorreccion.controls.nombreUsuarioAutorizador.value?.trim() ?? '';
    const passwordAutorizador =
      this.formCorreccion.controls.passwordAutorizador.value ?? '';

    if (!motivo || !nombreUsuarioAutorizador || !passwordAutorizador) {
      this.formCorreccion.markAllAsTouched();
      return;
    }

    if (this.requiereEvidencia && !this.archivoEvidencia) {
      await Swal.fire({
        icon: 'warning',
        title: 'Fotografía obligatoria',
        text: 'Debe tomar o cargar una fotografía para corregir la muestra a RECHAZADA.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d97706',
      });
      return;
    }

    const etiqueta =
      this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Confirmar corrección?',
      html: `
        <div style="text-align: left;">
          <p>
            La muestra <strong>${etiqueta}</strong> cambiará de
            <strong>${this.data.muestra.estadoMuestra}</strong> a
            <strong>${this.estadoNuevo}</strong>.
          </p>
          <p>
            La operación quedará registrada con el usuario que ejecuta la
            corrección y el usuario que la autoriza.
          </p>
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, corregir evaluación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor:
        this.estadoNuevo === 'RECHAZADA' ? '#b91c1c' : '#166534',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesando = true;

    this._muestraLaboratorioService
      .corregirEvaluacionMuestra(
        this.data.muestra._id,
        {
          motivoCorreccion: motivo,
          nombreUsuarioAutorizador,
          passwordAutorizador,
        },
        this.requiereEvidencia ? this.archivoEvidencia ?? undefined : undefined,
      )
      .subscribe({
        next: async (response) => {
          this.procesando = false;
          this.formCorreccion.controls.passwordAutorizador.reset('');

          await Swal.fire({
            icon: 'success',
            title: 'Evaluación corregida',
            html: `
              <div style="text-align: left;">
                <p>${response.msg}</p>
                <p>
                  Autorizado por:
                  <strong>${response.autorizacion.usuarioAutorizacion}</strong>
                  ${
                    response.autorizacion.rolAutorizacion
                      ? `(${response.autorizacion.rolAutorizacion})`
                      : ''
                  }
                </p>
              </div>
            `,
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });

          this._dialogRef.close(true);
        },
        error: (error) => {
          this.procesando = false;
          this.formCorreccion.controls.passwordAutorizador.reset('');

          console.error('Error al corregir evaluación de muestra:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo corregir la evaluación',
            text:
              error?.error?.msg ||
              'Ocurrió un error al corregir la evaluación de la muestra.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }
}
