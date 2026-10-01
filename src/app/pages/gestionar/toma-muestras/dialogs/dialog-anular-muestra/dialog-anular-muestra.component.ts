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

export interface IAnularMuestraDialogData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-anular-muestra',
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
  templateUrl: './dialog-anular-muestra.component.html',
  styleUrl: './dialog-anular-muestra.component.scss',
})
export class DialogAnularMuestraComponent {
  readonly data = inject<IAnularMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogAnularMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  procesando = false;

  readonly formAnulacion = this._fb.group({
    motivoAnulacion: ['', [Validators.required]],
  });

  // ====== Puede anular ======

  puedeAnular(): boolean {
    const estado = this.data.muestra.estadoMuestra;

    return (
      estado === 'PENDIENTE' ||
      estado === 'RECOLECTADA' ||
      estado === 'RECEPCIONADA'
    );
  }

  // ====== Cerrar ======

  cerrar(): void {
    if (this.procesando) {
      return;
    }

    this._dialogRef.close(false);
  }

  // ====== Anular muestra ======

  async anularMuestra(): Promise<void> {
    if (this.procesando || !this.puedeAnular()) {
      return;
    }

    if (this.formAnulacion.invalid) {
      this.formAnulacion.markAllAsTouched();
      return;
    }

    const motivo =
      this.formAnulacion.controls.motivoAnulacion.value?.trim() ?? '';

    if (!motivo) {
      this.formAnulacion.controls.motivoAnulacion.setErrors({
        required: true,
      });

      return;
    }

    const etiqueta =
      this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Anular muestra?',
      html: `
        <div style="text-align: left;">
          <p>
            El intento
            <strong>${etiqueta}</strong>
            pasará de
            <strong>${this.data.muestra.estadoMuestra}</strong>
            a <strong>ANULADA</strong>.
          </p>

          <p>
            No se generará una nueva muestra automáticamente y ningún
            intento anterior volverá a quedar vigente.
          </p>

          <p>
            Las evidencias ya registradas se conservarán como parte del
            historial del intento.
          </p>
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, anular muestra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c2410c',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesando = true;

    this._muestraLaboratorioService
      .anularMuestra(this.data.muestra._id, {
        motivoAnulacion: motivo,
      })
      .subscribe({
        next: async (response) => {
          this.procesando = false;

          await Swal.fire({
            icon: 'success',
            title: 'Muestra anulada',
            text:
              response.msg ||
              'La muestra fue anulada correctamente y el recipiente quedó sin intento vigente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });

          this._dialogRef.close(true);
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al anular muestra:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo anular la muestra',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar la anulación de la muestra.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }
}
