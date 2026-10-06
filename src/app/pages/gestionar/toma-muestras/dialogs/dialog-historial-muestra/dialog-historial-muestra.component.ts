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
}

interface IEventoHistorialMuestra {
  clave: string;
  tipo: string;
  titulo: string;
  fecha: Date | string;
  usuario: string | null;
  detalle: string;
  icono: string;
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

  readonly eventos = this.construirEventos();

  cerrar(): void {
    this._dialogRef.close();
  }

  private construirEventos(): IEventoHistorialMuestra[] {
    const muestra = this.data.muestra;
    const eventos: IEventoHistorialMuestra[] = [];

    const agregar = (
      tipo: string,
      titulo: string,
      fecha: Date | string | null | undefined,
      usuario: string | null | undefined,
      detalle: string,
      icono: string,
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

    agregar(
      'RECOLECCION',
      'Muestra recolectada',
      muestra.fechaRecoleccion,
      muestra.usuarioRecoleccion,
      muestra.observacionRecoleccion || 'Recolección registrada',
      'vaccines',
    );

    agregar(
      'RECEPCION',
      'Muestra recepcionada',
      muestra.fechaRecepcion,
      muestra.usuarioRecepcion,
      muestra.observacionRecepcion || 'Recepción registrada',
      'move_to_inbox',
    );

    agregar(
      'ACEPTACION',
      'Muestra aceptada',
      muestra.fechaAceptacion,
      muestra.usuarioAceptacion,
      muestra.observacionAceptacion || 'Evaluación de muestra aceptada',
      'check_circle',
    );

    agregar(
      'RECHAZO',
      'Muestra rechazada',
      muestra.fechaRechazo,
      muestra.usuarioRechazo,
      muestra.motivoRechazo || 'Muestra rechazada',
      'block',
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
            ? `Autorizado por ${correccion.usuarioAutorizacion}${
                correccion.rolAutorizacion
                  ? ` (${correccion.rolAutorizacion})`
                  : ''
              }`
            : '',
        ]
          .filter(Boolean)
          .join(' · '),
        'published_with_changes',
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
