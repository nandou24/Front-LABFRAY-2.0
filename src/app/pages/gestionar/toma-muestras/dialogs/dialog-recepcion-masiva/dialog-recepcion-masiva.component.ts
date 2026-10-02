import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';

import {
  IMuestraRecepcionMasiva,
  IRecibirMuestrasMasivamenteResponse,
  OrigenAtencionBandejaMuestra,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';

export interface IDialogRecepcionMasivaData {
  origenAtencion: OrigenAtencionBandejaMuestra;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-dialog-recepcion-masiva',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
  ],
  templateUrl: './dialog-recepcion-masiva.component.html',
  styleUrl: './dialog-recepcion-masiva.component.scss',
})
export class DialogRecepcionMasivaComponent implements OnInit {
  readonly data = inject<IDialogRecepcionMasivaData>(MAT_DIALOG_DATA);

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  private readonly _dialogRef = inject(
    MatDialogRef<DialogRecepcionMasivaComponent>,
  );

  readonly form = this._fb.group({
    terminoBusqueda: [''],
    observacionRecepcion: [''],
  });

  readonly columnasParticular: string[] = [
    'seleccion',
    'etiqueta',
    'paciente',
    'documento',
    'tipoMuestra',
    'recipiente',
    'fechaRecoleccion',
  ];

  readonly columnasEmpresa: string[] = [
    'seleccion',
    'etiqueta',
    'paciente',
    'documento',
    'programacion',
    'empresa',
    'sede',
    'tipoMuestra',
    'recipiente',
    'fechaRecoleccion',
  ];

  muestras: IMuestraRecepcionMasiva[] = [];

  readonly seleccionadas = new Set<string>();

  cargando = false;

  procesando = false;

  huboCambios = false;

  ngOnInit(): void {
    this.cargarMuestras();
  }

  // ====== Columnas ======

  get columnas(): string[] {
    return this.data.origenAtencion === 'EMPRESA'
      ? this.columnasEmpresa
      : this.columnasParticular;
  }

  // ====== Selección ======

  get totalSeleccionadas(): number {
    return this.seleccionadas.size;
  }

  get todasSeleccionadas(): boolean {
    return (
      this.muestras.length > 0 &&
      this.muestras.every((muestra) => this.seleccionadas.has(muestra._id))
    );
  }

  get seleccionParcial(): boolean {
    return this.totalSeleccionadas > 0 && !this.todasSeleccionadas;
  }

  estaSeleccionada(muestra: IMuestraRecepcionMasiva): boolean {
    return this.seleccionadas.has(muestra._id);
  }

  cambiarSeleccion(
    muestra: IMuestraRecepcionMasiva,
    cambio: MatCheckboxChange,
  ): void {
    if (cambio.checked) {
      this.seleccionadas.add(muestra._id);
    } else {
      this.seleccionadas.delete(muestra._id);
    }
  }

  cambiarSeleccionTodas(cambio: MatCheckboxChange): void {
    if (cambio.checked) {
      this.muestras.forEach((muestra) => {
        this.seleccionadas.add(muestra._id);
      });

      return;
    }

    this.seleccionadas.clear();
  }

  // ====== Buscar ======

  buscar(): void {
    this.cargarMuestras();
  }

  limpiarBusqueda(): void {
    this.form.controls.terminoBusqueda.setValue('');

    this.cargarMuestras();
  }

  // ====== Cargar muestras ======

  cargarMuestras(): void {
    const termino =
      this.form.controls.terminoBusqueda.value?.trim() ?? '';

    this.cargando = true;

    this._muestraLaboratorioService
      .obtenerMuestrasRecepcionMasiva(
        this.data.fechaInicio,
        this.data.fechaFin,
        this.data.origenAtencion,
        termino,
      )
      .subscribe({
        next: (response) => {
          this.muestras = response.muestras ?? [];

          const idsDisponibles = new Set(
            this.muestras.map((muestra) => muestra._id),
          );

          [...this.seleccionadas].forEach((id) => {
            if (!idsDisponibles.has(id)) {
              this.seleccionadas.delete(id);
            }
          });

          this.cargando = false;
        },

        error: (error) => {
          console.error(
            'Error al consultar muestras para recepción masiva:',
            error,
          );

          this.muestras = [];

          this.seleccionadas.clear();

          this.cargando = false;

          Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar las muestras',
            text:
              error?.error?.msg ||
              'No se pudo consultar la recepción masiva.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Registrar recepción ======

  async registrarRecepcion(): Promise<void> {
    if (this.procesando || this.totalSeleccionadas === 0) {
      return;
    }

    const cantidad = this.totalSeleccionadas;

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Registrar recepción masiva?',
      html: `
        <div style="text-align: left;">
          Se recepcionarán
          <strong>${cantidad}</strong>
          ${cantidad === 1 ? 'muestra seleccionada' : 'muestras seleccionadas'}.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, recepcionar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const observacion =
      this.form.controls.observacionRecepcion.value?.trim() ?? '';

    this.procesando = true;

    this._muestraLaboratorioService
      .recibirMuestrasMasivamente({
        muestraLaboratorioIds: [...this.seleccionadas],
        observacionRecepcion: observacion || undefined,
      })
      .subscribe({
        next: async (response) => {
          this.procesando = false;

          if (response.resumen.recepcionadas > 0) {
            this.huboCambios = true;
          }

          this.seleccionadas.clear();

          await this.mostrarResultado(response);

          this.cargarMuestras();
        },

        error: (error) => {
          this.procesando = false;

          console.error('Error al registrar recepción masiva:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la recepción',
            text:
              error?.error?.msg ||
              'No se pudo completar la recepción masiva.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Mostrar resultado ======

  private async mostrarResultado(
    response: IRecibirMuestrasMasivamenteResponse,
  ): Promise<void> {
    const resumen = response.resumen;

    const icono =
      resumen.noProcesadas === 0
        ? 'success'
        : resumen.recepcionadas > 0
          ? 'warning'
          : 'error';

    const titulo =
      resumen.noProcesadas === 0
        ? 'Recepción completada'
        : resumen.recepcionadas > 0
          ? 'Recepción parcial'
          : 'No se procesaron muestras';

    const incidencias = response.noProcesadas
      .map((item) => {
        const etiqueta = this.escaparHtml(
          item.codigoEtiqueta || item.muestraLaboratorioId,
        );

        const motivo = this.escaparHtml(item.motivo);

        return `
          <div style="
            margin-top: 8px;
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            border-radius: 7px;
            text-align: left;
          ">
            <strong>${etiqueta}</strong>
            <div style="margin-top: 3px; font-size: 13px;">
              ${motivo}
            </div>
          </div>
        `;
      })
      .join('');

    await Swal.fire({
      icon: icono,
      title: titulo,
      html: `
        <div style="text-align: left;">
          <div>
            <strong>${resumen.recepcionadas}</strong>
            ${
              resumen.recepcionadas === 1
                ? 'muestra recepcionada.'
                : 'muestras recepcionadas.'
            }
          </div>

          ${
            resumen.noProcesadas > 0
              ? `
                <div style="margin-top: 8px;">
                  <strong>${resumen.noProcesadas}</strong>
                  ${
                    resumen.noProcesadas === 1
                      ? 'muestra no procesada.'
                      : 'muestras no procesadas.'
                  }
                </div>

                <div style="margin-top: 10px;">
                  ${incidencias}
                </div>
              `
              : ''
          }
        </div>
      `,
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#3085d6',
    });
  }

  // ====== Nombre paciente ======

  obtenerNombrePaciente(muestra: IMuestraRecepcionMasiva): string {
    return [
      muestra.paciente.apePatCliente,
      muestra.paciente.apeMatCliente,
      muestra.paciente.nombreCliente,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // ====== Documento paciente ======

  obtenerDocumentoPaciente(muestra: IMuestraRecepcionMasiva): string {
    return [muestra.paciente.tipoDoc, muestra.paciente.nroDoc]
      .filter(Boolean)
      .join(' ');
  }

  // ====== Escapar HTML ======

  private escaparHtml(valor: string): string {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // ====== Cerrar ======

  cerrar(): void {
    this._dialogRef.close(this.huboCambios);
  }
}
