import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

import {
  IMuestraLaboratorio,
  IOpcionMuestraSnapshot,
  IRecolectarMuestraDTO,
  UnidadVolumenMuestra,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface IRecolectarMuestraDialogData {
  muestra: IMuestraLaboratorio;
  opciones: IOpcionMuestraSnapshot[];
  numeroRecipiente: number | null;
}

@Component({
  selector: 'app-dialog-recolectar-muestra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    CapturaEvidenciaMuestraComponent,
  ],
  templateUrl: './dialog-recolectar-muestra.component.html',
  styleUrl: './dialog-recolectar-muestra.component.scss',
})
export class DialogRecolectarMuestraComponent {
  readonly data = inject<IRecolectarMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogRecolectarMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  readonly opciones = this.data.opciones ?? [];

  readonly unidadesVolumen: UnidadVolumenMuestra[] = ['uL', 'mL', 'L'];

  procesando = false;
  archivoEvidencia: File | null = null;

  private readonly _validadorVolumen: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const volumen = control.get('volumenRecolectado')?.value;
    const unidad = control.get('unidadVolumenRecolectado')?.value;

    const tieneVolumen =
      volumen !== null &&
      volumen !== undefined &&
      String(volumen).trim() !== '';

    const tieneUnidad =
      unidad !== null &&
      unidad !== undefined &&
      String(unidad).trim() !== '';

    return tieneVolumen === tieneUnidad
      ? null
      : { volumenIncompleto: true };
  };

  readonly formRecoleccion = this._fb.group(
    {
      opcionFisica: [
        this.opciones.length === 1
          ? this.construirClaveOpcion(this.opciones[0])
          : null,
        Validators.required,
      ],

      volumenRecolectado: this._fb.control<number | null>(null, [
        Validators.min(0.000001),
      ]),

      unidadVolumenRecolectado:
        this._fb.control<UnidadVolumenMuestra | null>(null),

      observacionRecoleccion: [''],
    },
    {
      validators: this._validadorVolumen,
    },
  );

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

  // ====== Clave de opción ======

  construirClaveOpcion(opcion: IOpcionMuestraSnapshot): string {
    return `${opcion.tipoMuestraId}:${opcion.tuboEnvaseId}`;
  }

  // ====== Opción seleccionada ======

  obtenerOpcionSeleccionada(): IOpcionMuestraSnapshot | null {
    const clave = this.formRecoleccion.controls.opcionFisica.value;

    if (!clave) {
      return null;
    }

    return (
      this.opciones.find(
        (opcion) => this.construirClaveOpcion(opcion) === clave,
      ) ?? null
    );
  }

  // ====== Registrar recolección ======

  async registrarRecoleccion(): Promise<void> {
    if (this.formRecoleccion.invalid || this.procesando) {
      this.formRecoleccion.markAllAsTouched();
      return;
    }

    const opcion = this.obtenerOpcionSeleccionada();

    if (!opcion) {
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Registrar recolección?',
      html: `
        <div style="text-align: left;">
          <p>
            Se registrará la muestra
            <strong>${this.data.muestra.codigoEtiqueta || this.data.muestra.codMuestra}</strong>
            como recolectada.
          </p>
          <p>
            Recipiente utilizado:<br>
            <strong>${opcion.tuboEnvase.nombreTuboEnvase}</strong>
            · ${opcion.tipoMuestra.nombreTipoMuestra}
          </p>
          ${
            this.archivoEvidencia
              ? '<p>También se registrará la fotografía como evidencia de recolección.</p>'
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const raw = this.formRecoleccion.getRawValue();

    const tieneVolumen =
      raw.volumenRecolectado !== null &&
      raw.volumenRecolectado !== undefined;

    const body: IRecolectarMuestraDTO = {
      tipoMuestraId: opcion.tipoMuestraId,
      tuboEnvaseId: opcion.tuboEnvaseId,
      volumenRecolectado: tieneVolumen
        ? Number(raw.volumenRecolectado)
        : null,
      unidadVolumenRecolectado: tieneVolumen
        ? raw.unidadVolumenRecolectado
        : null,
      observacionRecoleccion:
        raw.observacionRecoleccion?.trim() ?? '',
    };

    this.procesando = true;

    this._muestraLaboratorioService
      .recolectarMuestra(this.data.muestra._id, body)
      .subscribe({
        next: (response) => {
          this.registrarEvidenciaPosterior(
            response.msg || 'La muestra fue recolectada correctamente.',
            body.observacionRecoleccion ?? '',
          );
        },
        error: (error) => {
          this.procesando = false;

          console.error('Error al registrar recolección:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la recolección',
            text:
              error?.error?.msg ||
              'Ocurrió un error al registrar la recolección de la muestra.',
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
        'Recolección registrada',
        mensajeOperacion,
      );
      return;
    }

    this._muestraLaboratorioService
      .registrarEvidencia(
        this.data.muestra._id,
        this.archivoEvidencia,
        'RECOLECCION',
        observacion,
      )
      .subscribe({
        next: () => {
          void this.finalizarOperacion(
            'Recolección registrada',
            'La recolección y su evidencia fotográfica fueron registradas correctamente.',
          );
        },
        error: (error) => {
          console.error(
            'La recolección se registró, pero falló la evidencia:',
            error,
          );

          void this.finalizarOperacionConAdvertencia(
            'Recolección registrada, evidencia pendiente',
            error?.error?.msg ||
              'La recolección se guardó correctamente, pero la fotografía no pudo registrarse. Puede agregarla posteriormente desde Evidencias.',
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

  // ====== Color visual ======

  resolverColorRecipiente(color: string | null | undefined): string {
    const colorNormalizado = String(color ?? '')
      .trim()
      .toUpperCase();

    const colores: Record<string, string> = {
      AMARILLO: '#facc15',
      LILA: '#a78bfa',
      MORADO: '#9333ea',
      ROJO: '#ef4444',
      AZUL: '#3b82f6',
      VERDE: '#22c55e',
      GRIS: '#9ca3af',
      NEGRO: '#1f2937',
      BLANCO: '#f8fafc',
      CELESTE: '#38bdf8',
      NARANJA: '#f97316',
      ROSADO: '#f472b6',
    };

    return colores[colorNormalizado] ?? '#cbd5e1';
  }
}
