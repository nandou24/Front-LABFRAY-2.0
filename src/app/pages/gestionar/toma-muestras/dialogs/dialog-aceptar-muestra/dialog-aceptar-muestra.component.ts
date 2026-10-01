import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
  IAceptarMuestraDTO,
  IMuestraLaboratorio,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface IAceptarMuestraDialogData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-aceptar-muestra',
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
  templateUrl: './dialog-aceptar-muestra.component.html',
  styleUrl: './dialog-aceptar-muestra.component.scss',
})
export class DialogAceptarMuestraComponent {
  readonly data = inject<IAceptarMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogAceptarMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  procesando = false;
  archivoEvidencia: File | null = null;

  readonly formAceptacion = this._fb.group({
    observacionAceptacion: [''],
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

  // ====== Aceptar muestra ======

  async aceptarMuestra(): Promise<void> {
    if (this.procesando || this.data.muestra.estadoMuestra !== 'RECEPCIONADA') {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Aceptar muestra?',
      html: `
        <div style="text-align: left;">
          <p>
            La muestra
            <strong>${
              this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra
            }</strong>
            será marcada como apta para continuar con el procesamiento.
          </p>
          <p>
            Confirma que el recipiente recibido cumple las condiciones para el
            análisis de laboratorio.
          </p>
          ${
            this.archivoEvidencia
              ? '<p>También se registrará la fotografía como evidencia de aceptación.</p>'
              : '<p><strong>La fotografía de aceptación es recomendada.</strong></p>'
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, aceptar muestra',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const raw = this.formAceptacion.getRawValue();

    const body: IAceptarMuestraDTO = {
      observacionAceptacion: raw.observacionAceptacion?.trim() ?? '',
    };

    this.procesando = true;

    this._muestraLaboratorioService
      .aceptarMuestra(this.data.muestra._id, body)
      .subscribe({
        next: (response) => {
          this.registrarEvidenciaPosterior(
            response.msg || 'La muestra fue aceptada correctamente.',
            body.observacionAceptacion ?? '',
          );
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al aceptar muestra:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo aceptar la muestra',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar la aceptación de la muestra.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Registrar evidencia posterior ======

  private registrarEvidenciaPosterior(
    mensajeOperacion: string,
    observacion: string,
  ): void {
    if (!this.archivoEvidencia) {
      void this.finalizarOperacion(
        'Muestra aceptada',
        mensajeOperacion,
      );
      return;
    }

    this._muestraLaboratorioService
      .registrarEvidencia(
        this.data.muestra._id,
        this.archivoEvidencia,
        'ACEPTACION',
        observacion,
      )
      .subscribe({
        next: () => {
          void this.finalizarOperacion(
            'Muestra aceptada',
            'La aceptación y su evidencia fotográfica fueron registradas correctamente.',
          );
        },
        error: (error) => {
          console.error(
            'La aceptación se registró, pero falló la evidencia:',
            error,
          );

          void this.finalizarOperacionConAdvertencia(
            'Aceptación registrada, evidencia pendiente',
            error?.error?.msg ||
              'La aceptación se guardó correctamente, pero la fotografía no pudo registrarse. Puede agregarla posteriormente desde Evidencias.',
          );
        },
      });
  }

  // ====== Finalizar operación ======

  private async finalizarOperacion(
    titulo: string,
    mensaje: string,
  ): Promise<void> {
    this.procesando = false;

    await Swal.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#15803d',
    });

    this._dialogRef.close(true);
  }

  // ====== Finalizar con advertencia ======

  private async finalizarOperacionConAdvertencia(
    titulo: string,
    mensaje: string,
  ): Promise<void> {
    this.procesando = false;

    await Swal.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#d97706',
    });

    this._dialogRef.close(true);
  }
}
