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
  IMuestraLaboratorio,
  IRecibirMuestraDTO,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface IRecepcionarMuestraDialogData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-recepcionar-muestra',
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
  templateUrl: './dialog-recepcionar-muestra.component.html',
  styleUrl: './dialog-recepcionar-muestra.component.scss',
})
export class DialogRecepcionarMuestraComponent {
  readonly data = inject<IRecepcionarMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogRecepcionarMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  procesando = false;
  archivoEvidencia: File | null = null;

  readonly formRecepcion = this._fb.group({
    observacionRecepcion: [''],
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

  // ====== Registrar recepción ======

  async registrarRecepcion(): Promise<void> {
    if (this.procesando) {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Registrar recepción?',
      html: `
        <div style="text-align: left;">
          <p>
            La muestra
            <strong>${
              this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra
            }</strong>
            será registrada como recepcionada.
          </p>
          <p>
            Esta acción confirma que el recipiente recolectado fue recibido
            para continuar con su evaluación en laboratorio.
          </p>
          ${
            this.archivoEvidencia
              ? '<p>También se registrará la fotografía como evidencia de recepción.</p>'
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, recepcionar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const raw = this.formRecepcion.getRawValue();

    const body: IRecibirMuestraDTO = {
      observacionRecepcion: raw.observacionRecepcion?.trim() ?? '',
    };

    this.procesando = true;

    this._muestraLaboratorioService
      .recibirMuestra(this.data.muestra._id, body)
      .subscribe({
        next: (response) => {
          this.registrarEvidenciaPosterior(
            response.msg || 'La muestra fue recepcionada correctamente.',
            body.observacionRecepcion ?? '',
          );
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al registrar recepción:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la recepción',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar la recepción de la muestra.',
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
        'Muestra recepcionada',
        mensajeOperacion,
      );
      return;
    }

    this._muestraLaboratorioService
      .registrarEvidencia(
        this.data.muestra._id,
        this.archivoEvidencia,
        'RECEPCION',
        observacion,
      )
      .subscribe({
        next: () => {
          void this.finalizarOperacion(
            'Muestra recepcionada',
            'La recepción y su evidencia fotográfica fueron registradas correctamente.',
          );
        },
        error: (error) => {
          console.error(
            'La recepción se registró, pero falló la evidencia:',
            error,
          );

          void this.finalizarOperacionConAdvertencia(
            'Recepción registrada, evidencia pendiente',
            error?.error?.msg ||
              'La recepción se guardó correctamente, pero la fotografía no pudo registrarse. Puede agregarla posteriormente desde Evidencias.',
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
      confirmButtonColor: '#3085d6',
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
