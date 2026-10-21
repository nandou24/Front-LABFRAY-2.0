import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { IMuestraLaboratorio } from '../../../../../models/Gestion/muestraLaboratorio.models';

export interface IHistorialMuestraDialogData {
  muestra: IMuestraLaboratorio;
  intentos?: IMuestraLaboratorio[];
  usuariosHistorial?: Record<string, string>;
}

interface IEventoHistorialMuestra {
  clave: string;
  tipo: string;
  titulo: string;
  fecha: Date | string;
  usuario: string | null;
  detalle: string;
  icono: string;
  fechaSoloDia?: boolean;
  estilo?: 'ACEPTADA' | 'RECHAZADA';
}

interface IGrupoHistorialMuestra {
  muestra: IMuestraLaboratorio;
  eventos: IEventoHistorialMuestra[];
  actual: boolean;
}

@Component({
  selector: 'app-dialog-historial-muestra',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './dialog-historial-muestra.component.html',
  styleUrl: './dialog-historial-muestra.component.scss',
})
export class DialogHistorialMuestraComponent {
  readonly data = inject<IHistorialMuestraDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogHistorialMuestraComponent>,
  );

  // ====== Historial completo del recipiente a través de sus intentos ======
  readonly grupos = this.construirGrupos();
  readonly eventos = this.grupos.find(grupo => grupo.actual)?.eventos ?? [];

  // ====== Ajustar superficie del diálogo ======
  constructor() {
    this._dialogRef.addPanelClass('labfray-historial-sin-scroll-horizontal');
  }

  cerrar(): void {
    this._dialogRef.close();
  }

  nombreVisible(usuario: string | null | undefined): string {
    const original = usuario?.trim();
    return original ? this.data.usuariosHistorial?.[original] || original : '-';
  }

  private construirGrupos(): IGrupoHistorialMuestra[] {
    const unicos = new Map<string, IMuestraLaboratorio>();
    for (const intento of [...(this.data.intentos ?? []), this.data.muestra]) {
      if (intento?._id) unicos.set(intento._id, intento);
    }

    return [...unicos.values()]
      .sort((a, b) => b.numeroIntento - a.numeroIntento)
      .map(muestra => ({
        muestra,
        eventos: this.construirEventos(muestra),
        actual: muestra._id === this.data.muestra._id,
      }));
  }

  private construirEventos(muestra: IMuestraLaboratorio): IEventoHistorialMuestra[] {
    const eventos: IEventoHistorialMuestra[] = [];

    const agregar = (
      tipo: string,
      titulo: string,
      fecha: Date | string | null | undefined,
      usuario: string | null | undefined,
      detalle: string,
      icono: string,
      opciones?: { fechaSoloDia?: boolean; estilo?: 'ACEPTADA' | 'RECHAZADA' },
    ): void => {
      if (!fecha) {
        return;
      }

      eventos.push({
        clave: `${tipo}-${String(fecha)}-${eventos.length}`,
        tipo,
        titulo,
        fecha,
        usuario: usuario ?? null,
        detalle,
        icono,
        fechaSoloDia: opciones?.fechaSoloDia,
        estilo: opciones?.estilo,
      });
    };

    agregar(
      'REGISTRO',
      `Muestra creada · intento ${muestra.numeroIntento}`,
      muestra.fechaRegistro ?? muestra.createdAt,
      muestra.usuarioRegistro,
      muestra.codigoEtiqueta || muestra.codMuestra,
      'add_circle_outline',
    );

    // ====== Unir toma y recepción registradas en una operación ======
    const fechaRegistro = muestra.fechaRegistroRecoleccion;
    const fechaRecepcion = muestra.fechaRecepcion;
    const registroSimultaneo = !!fechaRegistro && !!fechaRecepcion &&
      Math.abs(new Date(fechaRegistro).getTime() - new Date(fechaRecepcion).getTime()) <= 2000;

    if (registroSimultaneo) {
      const observaciones = [muestra.observacionRecoleccion, muestra.observacionRecepcion]
        .map((valor) => (valor ?? '').trim())
        .filter((valor, i, valores) => !!valor && valores.indexOf(valor) === i);
      agregar(
        'TOMA_RECEPCION',
        'Muestra recolectada / recepcionada',
        fechaRecepcion,
        muestra.usuarioRecepcion || muestra.usuarioRecoleccion,
        observaciones.join(' · ') || 'Toma y recepción registradas',
        'vaccines',
      );
    } else {
      // ====== Mantener la auditoría de operaciones antiguas separadas ======
      agregar(
        'RECOLECCION',
        'Muestra recolectada',
        fechaRegistro || muestra.fechaRecoleccion,
        muestra.usuarioRecoleccion,
        muestra.observacionRecoleccion || 'Recolección registrada',
        'vaccines',
        { fechaSoloDia: !fechaRegistro },
      );
      agregar(
        'RECEPCION',
        'Muestra recepcionada',
        fechaRecepcion,
        muestra.usuarioRecepcion,
        muestra.observacionRecepcion || 'Recepción registrada',
        'move_to_inbox',
      );
    }

    // ====== Mostrar tomas revertidas y el registro original ======
    (muestra.reversionesTomaRecepcion ?? []).forEach(reversion => {
      agregar(
        'TOMA_REVERTIDA',
        'Toma / recepción revertida',
        reversion.fechaReversion,
        reversion.usuarioReversion,
        `Motivo: ${reversion.motivo}`,
        'undo',
      );
      agregar(
        'TOMA_RECEPCION_HISTORICA',
        'Toma / recepción anterior (revertida)',
        reversion.fechaRecepcion || reversion.fechaRegistroRecoleccion,
        reversion.usuarioRecepcion || reversion.usuarioRecoleccion,
        [reversion.tuboEnvase?.nombreTuboEnvase, reversion.observacionRecoleccion]
          .filter(Boolean).join(' · ') || 'Registro anterior conservado para auditoría',
        'vaccines',
      );
    });

    agregar(
      'ACEPTACION',
      'Muestra aceptada',
      muestra.fechaAceptacion,
      muestra.usuarioAceptacion,
      muestra.observacionAceptacion || 'Evaluación de muestra aceptada',
      'check_circle',
      { estilo: 'ACEPTADA' },
    );

    agregar(
      'RECHAZO',
      'Muestra rechazada',
      muestra.fechaRechazo,
      muestra.usuarioRechazo,
      muestra.motivoRechazo || 'Muestra rechazada',
      'block',
      { estilo: 'RECHAZADA' },
    );

    (muestra.correccionesEvaluacion ?? []).forEach((correccion, indice) => {
      agregar(
        'CORRECCION',
        `Corrección ${correccion.estadoAnterior} → ${correccion.estadoNuevo}`,
        correccion.fechaCorreccion,
        correccion.usuarioEjecucion,
        [
          correccion.motivoCorreccion,
          correccion.usuarioAutorizacion
            ? `Autorizado por ${this.nombreVisible(correccion.usuarioAutorizacion)}${
                correccion.rolAutorizacion
                  ? ` (${correccion.rolAutorizacion})`
                  : ''
              }`
            : '',
        ]
          .filter(Boolean)
          .join(' · '),
        'published_with_changes',
        { estilo: correccion.estadoNuevo === 'RECHAZADA' ? 'RECHAZADA' : 'ACEPTADA' },
      );
    });

    (muestra.evidenciasFotograficas ?? []).forEach((evidencia) => {
      agregar(
        'EVIDENCIA',
        `Evidencia ${evidencia.etapa.toLowerCase()}`,
        evidencia.fechaRegistro,
        evidencia.usuarioRegistro,
        evidencia.observacion || evidencia.nombreArchivo || 'Evidencia registrada',
        'photo_camera',
        { estilo: evidencia.etapa === 'RECHAZO' ? 'RECHAZADA' : undefined },
      );

      agregar(
        'EVIDENCIA_ANULADA',
        'Evidencia anulada',
        evidencia.fechaAnulacion,
        evidencia.usuarioAnulacion,
        evidencia.motivoAnulacion || 'Evidencia anulada',
        'hide_image',
      );
    });

    agregar(
      'ANULACION',
      'Muestra anulada',
      muestra.fechaAnulacion,
      muestra.usuarioAnulacion,
      [
        muestra.estadoPrevioAnulacion
          ? `Estado previo: ${muestra.estadoPrevioAnulacion}`
          : '',
        muestra.motivoAnulacion ? `Motivo: ${muestra.motivoAnulacion}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      'cancel',
    );

    return eventos.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }
}
