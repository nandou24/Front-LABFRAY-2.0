import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';

import {
  IMuestraRecepcionMasiva,
  IRecibirMuestrasMasivamenteResponse,
  OrigenAtencionBandejaMuestra,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent,
  IEvidenciaCapturada,
} from '../../components/captura-evidencia-muestra/captura-evidencia-muestra.component';

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
    MatSelectModule,
    MatTableModule,
    CapturaEvidenciaMuestraComponent,
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
    tipoMuestraId: [''],
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

  muestrasTodas: IMuestraRecepcionMasiva[] = [];

  muestras: IMuestraRecepcionMasiva[] = [];

  tiposMuestraDisponibles: Array<{
    id: string;
    nombre: string;
  }> = [];

  readonly seleccionadas = new Set<string>();

  cargando = false;

  procesando = false;

  huboCambios = false;

  evidenciaGrupal: IEvidenciaCapturada | null = null;

  @ViewChild(CapturaEvidenciaMuestraComponent)
  private capturaEvidenciaGrupal?: CapturaEvidenciaMuestraComponent;

  ngOnInit(): void {
    this.form.controls.tipoMuestraId.valueChanges.subscribe(() => {
      this.aplicarFiltroTipoMuestra();
    });

    this.cargarMuestras();
  }

  // ====== Columnas ======

  get columnas(): string[] {
    return this.data.origenAtencion === 'EMPRESA'
      ? this.columnasEmpresa
      : this.columnasParticular;
  }

  // ====== Evidencia grupal opcional ======

  get permiteEvidenciaGrupal(): boolean {
    return this.data.origenAtencion === 'EMPRESA';
  }

  cambiarEvidenciaGrupal(evidencia: IEvidenciaCapturada | null): void {
    this.evidenciaGrupal = evidencia;
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

    this.form.controls.tipoMuestraId.setValue('', {
      emitEvent: false,
    });

    this.cargarMuestras();
  }

  // ====== Construir tipos de muestra ======

  private construirTiposMuestraDisponibles(): void {
    const tipos = new Map<string, string>();

    this.muestrasTodas.forEach((muestra) => {
      if (!muestra.tipoMuestraId) {
        return;
      }

      const nombre =
        muestra.tipoMuestra?.nombreTipoMuestra?.trim() ||
        muestra.tipoMuestra?.codTipoMuestra?.trim() ||
        muestra.tipoMuestraId;

      if (!tipos.has(muestra.tipoMuestraId)) {
        tipos.set(muestra.tipoMuestraId, nombre);
      }
    });

    this.tiposMuestraDisponibles = [...tipos.entries()]
      .map(([id, nombre]) => ({
        id,
        nombre,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  // ====== Aplicar filtro por tipo ======

  private aplicarFiltroTipoMuestra(): void {
    const tipoMuestraId =
      this.form.controls.tipoMuestraId.value?.trim() ?? '';

    this.muestras = tipoMuestraId
      ? this.muestrasTodas.filter(
          (muestra) => muestra.tipoMuestraId === tipoMuestraId,
        )
      : [...this.muestrasTodas];

    this.limpiarSeleccionNoVisible();
  }

  // ====== Limpiar selección oculta ======

  private limpiarSeleccionNoVisible(): void {
    const idsVisibles = new Set(
      this.muestras.map((muestra) => muestra._id),
    );

    [...this.seleccionadas].forEach((id) => {
      if (!idsVisibles.has(id)) {
        this.seleccionadas.delete(id);
      }
    });
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
          this.muestrasTodas = response.muestras ?? [];

          this.construirTiposMuestraDisponibles();

          this.aplicarFiltroTipoMuestra();

          this.cargando = false;
        },

        error: (error) => {
          console.error(
            'Error al consultar muestras para recepción masiva:',
            error,
          );

          this.muestrasTodas = [];

          this.muestras = [];

          this.tiposMuestraDisponibles = [];

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
          ${
            this.permiteEvidenciaGrupal && this.evidenciaGrupal?.archivo
              ? `<div style="margin-top: 8px; font-size: 13px; color: #64748b;">
                   La fotografía grupal opcional se almacenará una sola vez y se asociará únicamente a las muestras de Empresa procesadas correctamente.
                 </div>`
              : ''
          }
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
      .recibirMuestrasMasivamente(
        {
          muestraLaboratorioIds: [...this.seleccionadas],
          observacionRecepcion: observacion || undefined,
        },
        this.permiteEvidenciaGrupal
          ? this.evidenciaGrupal?.archivo
          : undefined,
      )
      .subscribe({
        next: async (response) => {
          this.procesando = false;

          if (response.resumen.recepcionadas > 0) {
            this.huboCambios = true;

            if (this.evidenciaGrupal?.archivo) {
              this.capturaEvidenciaGrupal?.limpiar();
            }
          }

          this.seleccionadas.clear();

          await this.mostrarResultado(response);

          // ====== Reiniciar filtro de tipo ======

          if (response.resumen.recepcionadas > 0) {
            this.form.controls.tipoMuestraId.setValue('', {
              emitEvent: false,
            });
          }

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

    const evidenciasAsociadas = resumen.evidenciasAsociadas ?? 0;

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
            evidenciasAsociadas > 0
              ? `
                <div style="margin-top: 8px;">
                  Evidencia grupal asociada a
                  <strong>${evidenciasAsociadas}</strong>
                  ${
                    evidenciasAsociadas === 1
                      ? 'muestra procesada.'
                      : 'muestras procesadas.'
                  }
                </div>
              `
              : ''
          }

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

  // ====== Color visual de recipiente ======

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
