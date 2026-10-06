import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import {
  IHistorialEventoResultado,
  IResultadoLaboratorio,
} from '../../../../../models/Gestion/resultadoLaboratorio.models';

export interface IHistorialResultadoDialogData {
  resultado: IResultadoLaboratorio;
}

interface IEventoHistorialVista extends IHistorialEventoResultado {
  claveVista: string;
}

@Component({
  selector: 'app-dialog-historial-resultado',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './dialog-historial-resultado.component.html',
  styleUrl: './dialog-historial-resultado.component.scss',
})
export class DialogHistorialResultadoComponent {
  readonly data = inject<IHistorialResultadoDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogHistorialResultadoComponent>,
  );

  readonly eventos = this.construirEventos();

  cerrar(): void {
    this._dialogRef.close();
  }

  obtenerIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      INICIALIZACION: 'add_circle_outline',
      REGISTRO: 'edit_note',
      MODIFICACION: 'edit',
      REVISION_VALIDACION: 'fact_check',
      VALIDACION: 'verified',
      LIBERACION: 'publish',
      ANULACION: 'block',
      REAPERTURA: 'restart_alt',
    };

    return iconos[tipo] ?? 'history';
  }

  obtenerTitulo(tipo: string): string {
    const titulos: Record<string, string> = {
      INICIALIZACION: 'Resultado inicializado',
      REGISTRO: 'Registro de resultados',
      MODIFICACION: 'Modificación de resultados',
      REVISION_VALIDACION: 'Revisión previa a validación',
      VALIDACION: 'Resultado validado',
      LIBERACION: 'Resultado liberado',
      ANULACION: 'Resultado anulado',
      REAPERTURA: 'Resultado reabierto',
    };

    return titulos[tipo] ?? tipo;
  }

  obtenerItemsSnapshot(
    evento: IEventoHistorialVista,
  ): Array<{ nombreInforme: string; valor: unknown; unidadesRef: string }> {
    const snapshot = evento.snapshotResultado as
      | {
          resultadosItems?: Array<{
            nombreInforme?: string;
            valor?: unknown;
            unidadesRef?: string;
          }>;
        }
      | null
      | undefined;

    return (snapshot?.resultadosItems ?? []).map((item) => ({
      nombreInforme: String(item.nombreInforme ?? 'Item'),
      valor: item.valor ?? '-',
      unidadesRef: String(item.unidadesRef ?? ''),
    }));
  }

  private construirEventos(): IEventoHistorialVista[] {
    const resultado = this.data.resultado;
    const eventos: IEventoHistorialVista[] = (resultado.historialEventos ?? []).map(
      (evento, indice) => ({
        ...evento,
        claveVista: evento._id ?? `persistido-${indice}`,
      }),
    );

    const existe = (tipo: string, fecha: string | null | undefined): boolean => {
      if (!fecha) {
        return false;
      }

      const objetivo = new Date(fecha).getTime();

      return eventos.some(
        (evento) =>
          evento.tipoEvento === tipo &&
          Math.abs(new Date(evento.fechaEvento).getTime() - objetivo) < 1000,
      );
    };

    const agregar = (
      tipoEvento: IHistorialEventoResultado['tipoEvento'],
      fecha: string | null | undefined,
      usuario: string | null | undefined,
      detalle: string,
      estadoAnterior: string | null = null,
      estadoNuevo: string | null = null,
    ): void => {
      if (!fecha || existe(tipoEvento, fecha)) {
        return;
      }

      eventos.push({
        claveVista: `sintetico-${tipoEvento}-${fecha}-${eventos.length}`,
        tipoEvento,
        versionResultado: Number(resultado.versionResultado ?? 1),
        estadoAnterior,
        estadoNuevo,
        ejecutadoPor: null,
        usuarioEjecucion: usuario ?? null,
        fechaEvento: String(fecha),
        detalle,
        metadatos: null,
        snapshotResultado: null,
      });
    };

    agregar(
      'INICIALIZACION',
      resultado.fechaRegistro ?? resultado.createdAt,
      resultado.usuarioRegistro,
      'Resultado inicializado para la unidad clínica',
      null,
      'PENDIENTE',
    );

    resultado.resultadosItems.forEach((item) => {
      agregar(
        'REGISTRO',
        item.fechaRegistroResultado,
        item.usuarioRegistroResultado,
        `Registro del Item ${item.nombreInforme}`,
      );
      agregar(
        'MODIFICACION',
        item.fechaActualizacionResultado,
        item.usuarioActualizacionResultado,
        `Modificación del Item ${item.nombreInforme}`,
      );
    });

    agregar(
      'VALIDACION',
      resultado.fechaValidacion,
      resultado.usuarioValidacion,
      resultado.observacionValidacion
        ? `Resultado validado. Observación: ${resultado.observacionValidacion}`
        : 'Resultado validado',
      'COMPLETO',
      'VALIDADO',
    );

    agregar(
      'LIBERACION',
      resultado.fechaLiberacion,
      resultado.usuarioLiberacion,
      'Resultado liberado para visualización o entrega',
      'VALIDADO',
      'LIBERADO',
    );

    agregar(
      'ANULACION',
      resultado.fechaAnulacion,
      resultado.usuarioAnulacion,
      [
        resultado.motivoAnulacion
          ? `Motivo: ${resultado.motivoAnulacion}`
          : 'Resultado anulado',
        resultado.usuarioAutorizacionAnulacion
          ? `Autorizado por ${resultado.usuarioAutorizacionAnulacion}${
              resultado.rolAutorizacionAnulacion
                ? ` (${resultado.rolAutorizacionAnulacion})`
                : ''
            }`
          : '',
      ]
        .filter(Boolean)
        .join(' · '),
      resultado.estadoPrevioAnulacion ?? null,
      'ANULADO',
    );

    return eventos.sort(
      (a, b) =>
        new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime(),
    );
  }
}
