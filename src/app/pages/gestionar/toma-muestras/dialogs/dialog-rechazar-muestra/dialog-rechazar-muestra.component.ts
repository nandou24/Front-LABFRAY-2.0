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

import { IMuestraLaboratorio } from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface IRechazarMuestraDialogData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-rechazar-muestra',
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
  templateUrl: './dialog-rechazar-muestra.component.html',
  styleUrl: './dialog-rechazar-muestra.component.scss',
})
export class DialogRechazarMuestraComponent {
  readonly data = inject<IRechazarMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogRechazarMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  procesando = false;
  archivoEvidencia: File | null = null;

  readonly formRechazo = this._fb.group({
    motivoRechazo: ['', [Validators.required]],
  });

  // ====== Cerrar ======

  cerrar(): void {
    if (this.procesando) {
      return;
    }

    this._dialogRef.close(false);
  }

  // ====== Cambiar evidencia ======

  cambiarEvidencia(evidencia: IEvidenciaCapturada | null): void {
    this.archivoEvidencia = evidencia?.archivo ?? null;
  }

  // ====== Rechazar muestra ======

  async rechazarMuestra(): Promise<void> {
    if (this.procesando || this.data.muestra.estadoMuestra !== 'RECEPCIONADA') {
      return;
    }

    if (this.formRechazo.invalid) {
      this.formRechazo.markAllAsTouched();
      return;
    }

    const motivo = this.formRechazo.controls.motivoRechazo.value?.trim() ?? '';

    if (!motivo) {
      this.formRechazo.controls.motivoRechazo.setErrors({ required: true });
      return;
    }

    if (!this.archivoEvidencia) {
      await Swal.fire({
        icon: 'warning',
        title: 'Fotografía obligatoria',
        text: 'Debe tomar o cargar una fotografía de la muestra antes de registrar el rechazo.',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#d97706',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Rechazar muestra?',
      html: `
        <div style="text-align: left;">
          <p>
            La muestra
            <strong>${
              this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra
            }</strong>
            será marcada como rechazada.
          </p>
          <p>
            El motivo y la fotografía de rechazo se registrarán como parte de
            la misma operación.
          </p>
          <p>
            Este intento quedará cerrado y la nueva toma se gestionará
            posteriormente mediante un reintento independiente.
          </p>
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, rechazar muestra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesando = true;

    this._muestraLaboratorioService
      .rechazarMuestra(
        this.data.muestra._id,
        motivo,
        this.archivoEvidencia,
      )
      .subscribe({
        next: (response) => {
          this.procesando = false;
          this._dialogRef.close(true);

          void Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Muestra rechazada',
            text:
              response.msg ||
              'La muestra y su evidencia de rechazo fueron registradas correctamente.',
            timer: 2800,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al rechazar muestra:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo rechazar la muestra',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar el rechazo y su fotografía.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }
}
