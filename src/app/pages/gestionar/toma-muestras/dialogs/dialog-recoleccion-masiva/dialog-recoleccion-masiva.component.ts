import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
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
  IMuestraRecoleccionMasiva,
  IOpcionMuestraSnapshot,
  IRecolectarMuestrasMasivamenteResponse,
  OrigenAtencionBandejaMuestra,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';

export interface IDialogRecoleccionMasivaData {
  origenAtencion: OrigenAtencionBandejaMuestra;
  fechaInicio: string;
  fechaFin: string;
}

@Component({
  selector: 'app-dialog-recoleccion-masiva',
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
  ],
  templateUrl: './dialog-recoleccion-masiva.component.html',
  styleUrl: './dialog-recoleccion-masiva.component.scss',
})
export class DialogRecoleccionMasivaComponent implements OnInit {
  readonly data = inject<IDialogRecoleccionMasivaData>(MAT_DIALOG_DATA);

  private readonly _fb = inject(FormBuilder);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  private readonly _dialogRef = inject(
    MatDialogRef<DialogRecoleccionMasivaComponent>,
  );

  readonly form = this._fb.group({
    terminoBusqueda: [''],
    tipoMuestraId: [''],
    observacionRecoleccion: [''],
  });

  readonly columnasParticular: string[] = [
    'seleccion',
    'etiqueta',
    'paciente',
    'documento',
    'opcionFisica',
    'examenes',
  ];

  readonly columnasEmpresa: string[] = [
    'seleccion',
    'etiqueta',
    'paciente',
    'documento',
    'programacion',
    'empresa',
    'sede',
    'opcionFisica',
    'examenes',
  ];

  muestrasTodas: IMuestraRecoleccionMasiva[] = [];

  muestras: IMuestraRecoleccionMasiva[] = [];

  tiposMuestraDisponibles: Array<{
    id: string;
    nombre: string;
  }> = [];

  readonly seleccionadas = new Set<string>();

  readonly controlesOpcion = new Map<
    string,
    FormControl<string | null>
  >();

  cargando = false;

  procesando = false;

  huboCambios = false;

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

  // ====== Resumen de selección ======

  get totalSeleccionadas(): number {
    return this.seleccionadas.size;
  }

  get totalOpcionesPendientesSeleccionadas(): number {
    return this.muestras.filter(
      (muestra) =>
        this.seleccionadas.has(muestra._id) &&
        !this.obtenerOpcionSeleccionada(muestra),
    ).length;
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

  get puedeProcesar(): boolean {
    return (
      !this.procesando &&
      this.totalSeleccionadas > 0 &&
      this.totalSeleccionadas <= 500 &&
      this.totalOpcionesPendientesSeleccionadas === 0
    );
  }

  // ====== Selección ======

  estaSeleccionada(muestra: IMuestraRecoleccionMasiva): boolean {
    return this.seleccionadas.has(muestra._id);
  }

  cambiarSeleccion(
    muestra: IMuestraRecoleccionMasiva,
    cambio: MatCheckboxChange,
  ): void {
    if (cambio.checked) {
      if (this.seleccionadas.size >= 500) {
        Swal.fire({
          icon: 'warning',
          title: 'Límite de recolección',
          text: 'Solo se pueden procesar hasta 500 muestras por lote.',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#3085d6',
        });

        return;
      }

      this.seleccionadas.add(muestra._id);

      return;
    }

    this.seleccionadas.delete(muestra._id);
  }

  cambiarSeleccionTodas(cambio: MatCheckboxChange): void {
    if (!cambio.checked) {
      this.seleccionadas.clear();

      return;
    }

    if (this.muestras.length > 500) {
      Swal.fire({
        icon: 'warning',
        title: 'Límite de recolección',
        text:
          'La lista contiene más de 500 muestras. Filtre la lista antes de seleccionar todas.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3085d6',
      });

      return;
    }

    this.muestras.forEach((muestra) => {
      this.seleccionadas.add(muestra._id);
    });
  }

  // ====== Opción física ======

  construirClaveOpcion(opcion: IOpcionMuestraSnapshot): string {
    return `${opcion.tipoMuestraId}:${opcion.tuboEnvaseId}`;
  }

  obtenerControlOpcion(
    muestra: IMuestraRecoleccionMasiva,
  ): FormControl<string | null> {
    const existente = this.controlesOpcion.get(muestra._id);

    if (existente) {
      return existente;
    }

    const control = new FormControl<string | null>(null);

    this.controlesOpcion.set(muestra._id, control);

    return control;
  }

  obtenerOpcionSeleccionada(
    muestra: IMuestraRecoleccionMasiva,
  ): IOpcionMuestraSnapshot | null {
    const valor = this.obtenerControlOpcion(muestra).value;

    if (!valor) {
      return null;
    }

    return (
      muestra.opcionesPermitidas.find(
        (opcion) => this.construirClaveOpcion(opcion) === valor,
      ) ?? null
    );
  }

  private sincronizarControlesOpcion(): void {
    this.muestrasTodas.forEach((muestra) => {
      const control = this.obtenerControlOpcion(muestra);

      const opcionesVisibles = this.obtenerOpcionesVisibles(muestra);

      const clavesVisibles = new Set(
        opcionesVisibles.map((opcion) =>
          this.construirClaveOpcion(opcion),
        ),
      );

      if (muestra.opcionesPermitidas.length === 1) {
        control.setValue(
          this.construirClaveOpcion(muestra.opcionesPermitidas[0]),
          {
            emitEvent: false,
          },
        );

        return;
      }

      if (control.value && clavesVisibles.has(control.value)) {
        return;
      }

      if (
        this.form.controls.tipoMuestraId.value &&
        opcionesVisibles.length === 1
      ) {
        control.setValue(
          this.construirClaveOpcion(opcionesVisibles[0]),
          {
            emitEvent: false,
          },
        );

        return;
      }

      control.setValue(null, {
        emitEvent: false,
      });
    });
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
      (muestra.opcionesPermitidas ?? []).forEach((opcion) => {
        if (!opcion.tipoMuestraId) {
          return;
        }

        const nombre =
          opcion.tipoMuestra?.nombreTipoMuestra?.trim() ||
          opcion.tipoMuestra?.codTipoMuestra?.trim() ||
          opcion.tipoMuestraId;

        if (!tipos.has(opcion.tipoMuestraId)) {
          tipos.set(opcion.tipoMuestraId, nombre);
        }
      });
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
      ? this.muestrasTodas.filter((muestra) =>
          (muestra.opcionesPermitidas ?? []).some(
            (opcion) => opcion.tipoMuestraId === tipoMuestraId,
          ),
        )
      : [...this.muestrasTodas];

    this.sincronizarControlesOpcion();

    this.limpiarSeleccionNoVisible();
  }

  // ====== Opciones visibles ======

  obtenerOpcionesVisibles(
    muestra: IMuestraRecoleccionMasiva,
  ): IOpcionMuestraSnapshot[] {
    const tipoMuestraId =
      this.form.controls.tipoMuestraId.value?.trim() ?? '';

    if (!tipoMuestraId) {
      return muestra.opcionesPermitidas ?? [];
    }

    return (muestra.opcionesPermitidas ?? []).filter(
      (opcion) => opcion.tipoMuestraId === tipoMuestraId,
    );
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
      .obtenerMuestrasRecoleccionMasiva(
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
            'Error al consultar muestras para recolección masiva:',
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
              'No se pudo consultar la recolección masiva.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Registrar recolección ======

  async registrarRecoleccion(): Promise<void> {
    if (this.procesando || this.totalSeleccionadas === 0) {
      return;
    }

    if (this.totalSeleccionadas > 500) {
      await Swal.fire({
        icon: 'warning',
        title: 'Límite de recolección',
        text: 'Solo se pueden procesar hasta 500 muestras por lote.',
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3085d6',
      });

      return;
    }

    if (this.totalOpcionesPendientesSeleccionadas > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta definir la opción física',
        text:
          `${this.totalOpcionesPendientesSeleccionadas} ` +
          `${
            this.totalOpcionesPendientesSeleccionadas === 1
              ? 'muestra seleccionada requiere'
              : 'muestras seleccionadas requieren'
          } elegir el tipo de muestra y recipiente.`,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#3085d6',
      });

      return;
    }

    const muestrasSeleccionadas = this.muestras.filter((muestra) =>
      this.seleccionadas.has(muestra._id),
    );

    const payload = muestrasSeleccionadas.map((muestra) => {
      const opcion = this.obtenerOpcionSeleccionada(muestra);

      if (!opcion) {
        throw new Error(
          `No se pudo resolver la opción física de ${muestra.codigoEtiqueta || muestra.codMuestra}`,
        );
      }

      return {
        muestraLaboratorioId: muestra._id,
        tipoMuestraId: opcion.tipoMuestraId,
        tuboEnvaseId: opcion.tuboEnvaseId,
      };
    });

    const cantidad = payload.length;

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Registrar recolección masiva?',
      html: `
        <div style="text-align: left;">
          Se registrará la recolección de
          <strong>${cantidad}</strong>
          ${cantidad === 1 ? 'muestra seleccionada' : 'muestras seleccionadas'}.
          <div style="margin-top: 8px; font-size: 13px; color: #64748b;">
            Cada recipiente conservará la opción física seleccionada en esta lista.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, recolectar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const observacion =
      this.form.controls.observacionRecoleccion.value?.trim() ?? '';

    this.procesando = true;

    this._muestraLaboratorioService
      .recolectarMuestrasMasivamente({
        muestras: payload,
        observacionRecoleccion: observacion || undefined,
      })
      .subscribe({
        next: async (response) => {
          this.procesando = false;

          if (response.resumen.recolectadas > 0) {
            this.huboCambios = true;
          }

          this.seleccionadas.clear();

          await this.mostrarResultado(response);

          this.cargarMuestras();
        },

        error: (error) => {
          this.procesando = false;

          console.error('Error al registrar recolección masiva:', error);

          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la recolección',
            text:
              error?.error?.msg ||
              'No se pudo completar la recolección masiva.',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#d33',
          });
        },
      });
  }

  // ====== Mostrar resultado ======

  private async mostrarResultado(
    response: IRecolectarMuestrasMasivamenteResponse,
  ): Promise<void> {
    const resumen = response.resumen;

    const icono =
      resumen.noProcesadas === 0
        ? 'success'
        : resumen.recolectadas > 0
          ? 'warning'
          : 'error';

    const titulo =
      resumen.noProcesadas === 0
        ? 'Recolección completada'
        : resumen.recolectadas > 0
          ? 'Recolección parcial'
          : 'No se procesaron muestras';

    const incidencias = response.noProcesadas
      .map((item) => {
        const etiqueta = this.escaparHtml(
          item.codigoEtiqueta || item.muestraLaboratorioId || 'Muestra',
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
            <strong>${resumen.recolectadas}</strong>
            ${
              resumen.recolectadas === 1
                ? 'muestra recolectada.'
                : 'muestras recolectadas.'
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

                <div style="margin-top: 12px; max-height: 240px; overflow: auto;">
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

  // ====== Paciente ======

  obtenerNombrePaciente(muestra: IMuestraRecoleccionMasiva): string {
    return [
      muestra.paciente.apePatCliente,
      muestra.paciente.apeMatCliente,
      muestra.paciente.nombreCliente,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  obtenerDocumentoPaciente(muestra: IMuestraRecoleccionMasiva): string {
    return [muestra.paciente.tipoDoc, muestra.paciente.nroDoc]
      .filter(Boolean)
      .join(' ');
  }

  // ====== Exámenes ======

  obtenerExamenes(muestra: IMuestraRecoleccionMasiva): string {
    return (muestra.examenes ?? [])
      .map((examen) => examen.nombrePruebaLab || examen.nombreServicio)
      .filter(Boolean)
      .join(', ');
  }

  // ====== Color recipiente ======

  resolverColorRecipiente(color: string | null | undefined): string {
    const normalizado = String(color ?? '')
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

    return colores[normalizado] ?? '#cbd5e1';
  }

  // ====== Cerrar ======

  cerrar(): void {
    this._dialogRef.close(this.huboCambios);
  }

  // ====== Escapar HTML ======

  private escaparHtml(valor: unknown): string {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
