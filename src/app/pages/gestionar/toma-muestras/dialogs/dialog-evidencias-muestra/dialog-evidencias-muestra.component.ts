import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

import {
  EtapaEvidenciaMuestra,
  IEvidenciaFotograficaMuestra,
  IResumenEvidenciasMuestra,
  IMuestraLaboratorio,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

export interface IDialogEvidenciasMuestraData {
  muestra: IMuestraLaboratorio;
  numeroRecipiente: number | null;
}

interface IEtapaEvidenciaOpcion {
  valor: EtapaEvidenciaMuestra;
  etiqueta: string;
}

@Component({
  selector: 'app-dialog-evidencias-muestra',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    CapturaEvidenciaMuestraComponent,
  ],
  templateUrl: './dialog-evidencias-muestra.component.html',
  styleUrl: './dialog-evidencias-muestra.component.scss',
})
export class DialogEvidenciasMuestraComponent implements OnInit {
  readonly data = inject<IDialogEvidenciasMuestraData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogEvidenciasMuestraComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  @ViewChild(CapturaEvidenciaMuestraComponent)
  capturaEvidencia?: CapturaEvidenciaMuestraComponent;

  readonly form = this._fb.group({
    etapa: this._fb.control<EtapaEvidenciaMuestra | null>(null, {
      validators: [Validators.required],
    }),
    observacion: [''],
  });

  etapasDisponibles: IEtapaEvidenciaOpcion[] = [];

  evidencias: IEvidenciaFotograficaMuestra[] = [];

  resumen: IResumenEvidenciasMuestra = {
    total: 0,
    activas: 0,
    anuladas: 0,
  };

  archivoSeleccionado: File | null = null;

  cargando = true;
  subiendo = false;
  errorCarga = '';
  huboCambios = false;

  // ====== Ciclo de vida ======

  ngOnInit(): void {
    this.etapasDisponibles = this.resolverEtapasDisponibles();

    const etapaInicial =
      this.etapasDisponibles[this.etapasDisponibles.length - 1]?.valor ?? null;

    this.form.controls.etapa.setValue(etapaInicial);

    this.cargarEvidencias();
  }

  // ====== Resolver etapas disponibles ======

  private resolverEtapasDisponibles(): IEtapaEvidenciaOpcion[] {
    const muestra = this.data.muestra;
    const etapas: IEtapaEvidenciaOpcion[] = [];

    if (muestra.recolectadoPor && muestra.fechaRecoleccion) {
      etapas.push({
        valor: 'RECOLECCION',
        etiqueta: 'Recolección',
      });
    }

    if (muestra.recibidoPor && muestra.fechaRecepcion) {
      etapas.push({
        valor: 'RECEPCION',
        etiqueta: 'Recepción',
      });
    }

    if (muestra.aceptadoPor && muestra.fechaAceptacion) {
      etapas.push({
        valor: 'ACEPTACION',
        etiqueta: 'Aceptación',
      });
    }

    if (muestra.rechazadoPor && muestra.fechaRechazo) {
      etapas.push({
        valor: 'RECHAZO',
        etiqueta: 'Rechazo',
      });
    }

    return etapas;
  }

  // ====== Cargar evidencias ======

  cargarEvidencias(): void {
    this.cargando = true;
    this.errorCarga = '';

    this._muestraLaboratorioService
      .obtenerEvidencias(this.data.muestra._id, true)
      .subscribe({
        next: (response) => {
          this.evidencias = [...(response.evidencias ?? [])].sort(
            (a, b) =>
              new Date(b.fechaRegistro ?? 0).getTime() -
              new Date(a.fechaRegistro ?? 0).getTime(),
          );

          this.resumen = response.resumenEvidencias;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar evidencias de la muestra:', error);

          this.evidencias = [];
          this.cargando = false;
          this.errorCarga =
            error?.error?.msg ||
            'No se pudieron cargar las evidencias fotográficas';
        },
      });
  }

  // ====== Puede registrar evidencia ======

  puedeRegistrarEvidencia(): boolean {
    return (
      this.data.muestra.estadoMuestra !== 'ANULADA' &&
      this.etapasDisponibles.length > 0
    );
  }

  // ====== Cambiar evidencia seleccionada ======

  cambiarEvidencia(
    evidencia: IEvidenciaCapturada | null,
  ): void {
    this.archivoSeleccionado = evidencia?.archivo ?? null;
  }

  // ====== Registrar evidencia ======

  registrarEvidencia(): void {
    if (!this.puedeRegistrarEvidencia() || this.subiendo) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.archivoSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Falta la imagen',
        text: 'Debe tomar o seleccionar una fotografía para continuar.',
        confirmButtonText: 'Entendido',
      });

      return;
    }

    const etapa = this.form.controls.etapa.value;

    if (!etapa) {
      return;
    }

    const observacion = this.form.controls.observacion.value?.trim() || '';

    this.subiendo = true;

    this._muestraLaboratorioService
      .registrarEvidencia(
        this.data.muestra._id,
        this.archivoSeleccionado,
        etapa,
        observacion,
      )
      .subscribe({
        next: (response) => {
          this.subiendo = false;
          this.huboCambios = true;

          this.form.controls.observacion.setValue('');
          this.archivoSeleccionado = null;
          this.capturaEvidencia?.limpiar();
          this.cargarEvidencias();

          Swal.fire({
            icon: 'success',
            title: 'Evidencia registrada',
            text: response.msg || 'La fotografía fue registrada correctamente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });
        },
        error: (error) => {
          this.subiendo = false;

          console.error('Error al registrar evidencia fotográfica:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la evidencia',
            text:
              error?.error?.msg ||
              'No se pudo registrar la evidencia fotográfica.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Anular evidencia ======

  async anularEvidencia(
    evidencia: IEvidenciaFotograficaMuestra,
  ): Promise<void> {
    if (evidencia.estadoEvidencia === 'ANULADA') {
      return;
    }

    const resultado = await Swal.fire({
      icon: 'warning',
      title: '¿Anular evidencia?',
      text: 'La imagen no se eliminará físicamente; quedará registrada como anulada para trazabilidad.',
      input: 'textarea',
      inputLabel: 'Motivo de anulación',
      inputPlaceholder: 'Ingrese el motivo...',
      inputAttributes: {
        maxlength: '300',
      },
      showCancelButton: true,
      confirmButtonText: 'Anular evidencia',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#d33',
      inputValidator: (value) => {
        if (!String(value ?? '').trim()) {
          return 'Debe indicar el motivo de anulación';
        }

        return undefined;
      },
    });

    if (!resultado.isConfirmed) {
      return;
    }

    const motivoAnulacion = String(resultado.value ?? '').trim();

    this._muestraLaboratorioService
      .anularEvidencia(this.data.muestra._id, evidencia._id, {
        motivoAnulacion,
      })
      .subscribe({
        next: (response) => {
          this.huboCambios = true;
          this.cargarEvidencias();

          Swal.fire({
            icon: 'success',
            title: 'Evidencia anulada',
            text: response.msg || 'La evidencia quedó anulada correctamente.',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#3085d6',
          });
        },
        error: (error) => {
          console.error('Error al anular evidencia fotográfica:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo anular la evidencia',
            text:
              error?.error?.msg ||
              'No se pudo anular la evidencia fotográfica.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Etiqueta de etapa ======

  obtenerEtiquetaEtapa(etapa: EtapaEvidenciaMuestra): string {
    const etiquetas: Record<EtapaEvidenciaMuestra, string> = {
      RECOLECCION: 'Recolección',
      RECEPCION: 'Recepción',
      ACEPTACION: 'Aceptación',
      RECHAZO: 'Rechazo',
    };

    return etiquetas[etapa];
  }

  // ====== Formatear tamaño ======

  formatearTamano(bytes: number | null): string {
    if (!bytes || bytes <= 0) {
      return '-';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  // ====== Cerrar ======

  cerrar(): void {
    this._dialogRef.close(this.huboCambios);
  }
}
