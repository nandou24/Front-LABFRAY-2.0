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
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

import {
  IBandejaResultadosLaboratorioItem,
  IResultadoLaboratorio,
  OrigenAtencionBandejaResultado,
} from '../../../../../models/Gestion/resultadoLaboratorio.models';
import { ResultadoLaboratorioService } from '../../../../../services/gestion/resultadosLaboratorio/resultados-laboratorio.service';

export interface IDialogLiberacionMasivaData {
  origenAtencion: OrigenAtencionBandejaResultado;
  fechaInicio: string;
  fechaFin: string;
}

interface IResultadoLiberacionMasivaFila {
  resultado: IResultadoLaboratorio;
  solicitud: IBandejaResultadosLaboratorioItem['solicitud'];
  totalAlertas: number;
  alertasCriticas: number;
}

@Component({
  selector: 'app-dialog-liberacion-masiva',
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
  templateUrl: './dialog-liberacion-masiva.component.html',
  styleUrl: './dialog-liberacion-masiva.component.scss',
})
export class DialogLiberacionMasivaComponent implements OnInit {
  readonly data = inject<IDialogLiberacionMasivaData>(MAT_DIALOG_DATA);

  private readonly _fb = inject(FormBuilder);

  private readonly _resultadoLaboratorioService = inject(
    ResultadoLaboratorioService,
  );

  private readonly _dialogRef = inject(
    MatDialogRef<DialogLiberacionMasivaComponent>,
  );

  readonly form = this._fb.group({
    terminoBusqueda: [''],
  });

  readonly columnasParticular: string[] = [
    'seleccion',
    'codigoLaboratorio',
    'paciente',
    'documento',
    'prueba',
    'instancia',
    'alertas',
    'validacion',
  ];

  readonly columnasEmpresa: string[] = [
    'seleccion',
    'codigoLaboratorio',
    'paciente',
    'documento',
    'programacion',
    'empresa',
    'prueba',
    'instancia',
    'alertas',
    'validacion',
  ];

  resultados: IResultadoLiberacionMasivaFila[] = [];

  readonly seleccionados = new Set<string>();

  cargando = false;
  procesando = false;

  ngOnInit(): void {
    this.cargarResultados();
  }

  // ====== Columnas ======

  get columnas(): string[] {
    return this.data.origenAtencion === 'EMPRESA'
      ? this.columnasEmpresa
      : this.columnasParticular;
  }

  // ====== Selección ======

  get totalSeleccionados(): number {
    return this.seleccionados.size;
  }

  get todosSeleccionados(): boolean {
    return (
      this.resultados.length > 0 &&
      this.resultados.every((fila) =>
        this.seleccionados.has(fila.resultado._id),
      )
    );
  }

  get seleccionParcial(): boolean {
    return this.totalSeleccionados > 0 && !this.todosSeleccionados;
  }

  estaSeleccionado(fila: IResultadoLiberacionMasivaFila): boolean {
    return this.seleccionados.has(fila.resultado._id);
  }

  cambiarSeleccion(
    fila: IResultadoLiberacionMasivaFila,
    cambio: MatCheckboxChange,
  ): void {
    if (cambio.checked) {
      this.seleccionados.add(fila.resultado._id);
      return;
    }

    this.seleccionados.delete(fila.resultado._id);
  }

  cambiarSeleccionTodos(cambio: MatCheckboxChange): void {
    if (cambio.checked) {
      this.resultados.forEach((fila) => {
        this.seleccionados.add(fila.resultado._id);
      });
      return;
    }

    this.seleccionados.clear();
  }

  // ====== Buscar ======

  buscar(): void {
    this.cargarResultados();
  }

  limpiarBusqueda(): void {
    this.form.controls.terminoBusqueda.setValue('');
    this.cargarResultados();
  }

  // ====== Cargar resultados validados ======

  cargarResultados(): void {
    const termino = this.form.controls.terminoBusqueda.value?.trim() ?? '';

    this.cargando = true;
    this.seleccionados.clear();

    this._resultadoLaboratorioService
      .obtenerBandeja(
        this.data.fechaInicio,
        this.data.fechaFin,
        termino,
      )
      .subscribe({
        next: (response) => {
          const filas: IResultadoLiberacionMasivaFila[] = [];

          (response.solicitudes ?? [])
            .filter(
              (row) =>
                row.solicitud.origenAtencion === this.data.origenAtencion &&
                row.solicitud.estado !== 'ANULADO',
            )
            .forEach((row) => {
              (row.resultados.detalle ?? [])
                .filter(
                  (resultado) => resultado.estadoResultado === 'VALIDADO',
                )
                .forEach((resultado) => {
                  filas.push({
                    resultado,
                    solicitud: row.solicitud,
                    totalAlertas: this.obtenerTotalAlertas(resultado),
                    alertasCriticas: this.obtenerAlertasCriticas(resultado),
                  });
                });
            });

          this.resultados = filas.sort((a, b) => {
            const fechaA = new Date(a.solicitud.fechaEmision).getTime();
            const fechaB = new Date(b.solicitud.fechaEmision).getTime();

            if (fechaA !== fechaB) {
              return fechaA - fechaB;
            }

            return String(a.resultado.codPruebaLab).localeCompare(
              String(b.resultado.codPruebaLab),
              'es',
            );
          });

          this.cargando = false;
        },
        error: async (error) => {
          this.resultados = [];
          this.cargando = false;

          await Swal.fire({
            icon: 'error',
            title: 'No se pudieron cargar los resultados',
            text:
              error?.error?.msg ||
              'No se pudo consultar la liberación masiva.',
            confirmButtonText: 'Cerrar',
          });
        },
      });
  }

  // ====== Liberar seleccionados ======

  async liberarSeleccionados(): Promise<void> {
    if (this.procesando || this.totalSeleccionados === 0) {
      return;
    }

    const seleccionados = this.resultados.filter((fila) =>
      this.seleccionados.has(fila.resultado._id),
    );

    const totalAlertas = seleccionados.reduce(
      (total, fila) => total + fila.totalAlertas,
      0,
    );
    const totalCriticas = seleccionados.reduce(
      (total, fila) => total + fila.alertasCriticas,
      0,
    );

    const confirmacion = await Swal.fire({
      icon: totalAlertas > 0 ? 'warning' : 'question',
      title: '¿Liberar resultados seleccionados?',
      html: `
        <div style="text-align:left">
          <p>Se liberarán <strong>${seleccionados.length}</strong> resultado(s) validado(s).</p>
          ${
            totalAlertas > 0
              ? `<p>La selección contiene <strong>${totalAlertas}</strong> alerta(s) clínica(s), de las cuales <strong>${totalCriticas}</strong> son críticas.</p>`
              : ''
          }
          ${
            totalCriticas > 0
              ? `<label style="display:flex; gap:8px; align-items:flex-start; margin-top:12px"><input id="confirmar-liberacion-masiva-critica" type="checkbox" style="margin-top:4px" /><span>Confirmo que revisé las alertas críticas antes de liberar los resultados seleccionados.</span></label>`
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Liberar seleccionados',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#15803d',
      preConfirm: () => {
        if (totalCriticas <= 0) {
          return true;
        }

        const confirmacionCritica = document.querySelector<HTMLInputElement>(
          '#confirmar-liberacion-masiva-critica',
        );

        if (!confirmacionCritica?.checked) {
          Swal.showValidationMessage(
            'Debe confirmar explícitamente la revisión de las alertas críticas.',
          );
          return false;
        }

        return true;
      },
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesando = true;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.liberarResultadosMasivamente({
          resultadoIds: seleccionados.map((fila) => fila.resultado._id),
          confirmarAlertasCriticas: totalCriticas > 0,
        }),
      );

      await Swal.fire({
        icon:
          response.resumen.alertas.criticas > 0 ? 'warning' : 'success',
        title: 'Liberación completada',
        html: `
          <div style="text-align:left">
            <div><strong>${response.resumen.liberados}</strong> resultado(s) liberado(s).</div>
            <div style="margin-top:6px"><strong>${response.resumen.solicitudesAfectadas}</strong> solicitud(es) actualizada(s).</div>
          </div>
        `,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#15803d',
      });

      this._dialogRef.close(true);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudieron liberar los resultados',
        text:
          error?.error?.msg ||
          'Ocurrió un error durante la liberación masiva.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Datos visibles ======

  obtenerNombrePaciente(fila: IResultadoLiberacionMasivaFila): string {
    const paciente = fila.solicitud.paciente;

    return [
      paciente.apePatCliente,
      paciente.apeMatCliente,
      paciente.nombreCliente,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  obtenerDocumentoPaciente(fila: IResultadoLiberacionMasivaFila): string {
    const paciente = fila.solicitud.paciente;

    return [paciente.tipoDoc, paciente.nroDoc]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  private obtenerTotalAlertas(resultado: IResultadoLaboratorio): number {
    return (resultado.resultadosItems ?? []).reduce(
      (total, item) => total + (item.alertasDetectadas?.length ?? 0),
      0,
    );
  }

  private obtenerAlertasCriticas(resultado: IResultadoLaboratorio): number {
    return (resultado.resultadosItems ?? []).reduce(
      (total, item) =>
        total +
        (item.alertasDetectadas ?? []).filter(
          (alerta) => alerta.nivelAlerta === 'CRITICA',
        ).length,
      0,
    );
  }

  // ====== Cerrar ======

  cerrar(): void {
    if (this.procesando) {
      return;
    }

    this._dialogRef.close(false);
  }
}
