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
  IMuestraLaboratorio,
  IRechazarMuestraDTO,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';

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
            Este recipiente no podrá continuar con el procesamiento y quedará
            pendiente la generación de una nueva muestra.
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

    const body: IRechazarMuestraDTO = {
      motivoRechazo: motivo,
    };

    this.procesando = true;

    this._muestraLaboratorioService
      .rechazarMuestra(this.data.muestra._id, body)
      .subscribe({
        next: async (response) => {
          this.procesando = false;

          await Swal.fire({
            icon: 'success',
            title: 'Muestra rechazada',
            text:
              response.msg ||
              'La muestra fue rechazada y requiere una nueva toma.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });

          this._dialogRef.close(true);
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al rechazar muestra:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo rechazar la muestra',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar el rechazo de la muestra.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }
}
