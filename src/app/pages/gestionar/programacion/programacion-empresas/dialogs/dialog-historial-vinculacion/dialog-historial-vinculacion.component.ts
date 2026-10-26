import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';

interface IEventoVinculacion {
  tipo: string;
  fecha: string;
  hcAnterior: string | null;
  hcNueva: string | null;
  usuario: string;
  nombreCompletoUsuario?: string | null;
  ejecutadoPor?: string;
  origenDocumento?: string;
  tipoResolucion?: string | null;
  motivoDecision?: string | null;
}

interface IRevisionIdentidad {
  decision: 'DISTINTO' | 'PENDIENTE';
  pacienteIdCandidato: string;
  hcCandidata: string | null;
  documentoCoincidente: boolean;
  motivo: string | null;
  fecha: string;
  usuario: string;
  nombreCompletoUsuario?: string | null;
}

@Component({
  selector: 'app-dialog-historial-vinculacion',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dialog-historial-vinculacion.component.html',
  styleUrl: './dialog-historial-vinculacion.component.scss',
})
export class DialogHistorialVinculacionComponent implements OnInit {
  readonly data = inject(MAT_DIALOG_DATA) as { programacion: IProgramacionEmpresa };
  private readonly dialogRef = inject(MatDialogRef<DialogHistorialVinculacionComponent>);
  private readonly service = inject(ProgramacionEmpresaService);

  historial: IEventoVinculacion[] = [];
  revisiones: IRevisionIdentidad[] = [];
  estadosCandidatos: Array<{ pacienteId: string; hc: string | null; nombreCompleto: string;
    documentoCoincidente: boolean; estado: 'SIN_REVISAR' | 'PENDIENTE' | 'PERSONA_DISTINTA' | 'CONFLICTO_DOCUMENTAL' }> = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarHistorial();
  }

  // ====== Consultar historial sin modificar registros ======
  cargarHistorial(): void {
    const id = this.data.programacion._id;
    if (!id) {
      this.error = 'No se encontró el identificador de la programación.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.service.obtenerHistorialVinculaciones(id).subscribe({
      next: respuesta => {
        this.historial = [...(respuesta.historial ?? [])]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.revisiones = [...(respuesta.revisiones ?? [])]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.estadosCandidatos = respuesta.estadosCandidatos ?? [];
        this.cargando = false;
      },
      error: e => {
        this.error = e.error?.msg || 'No se pudo consultar el historial de vinculación.';
        this.cargando = false;
      },
    });
  }

  tituloEstado(estado: string): string {
    const titulos: Record<string, string> = {
      SIN_REVISAR: 'Sin revisar',
      PENDIENTE: 'Identidad pendiente de confirmar',
      PERSONA_DISTINTA: 'No corresponde al trabajador programado',
      CONFLICTO_DOCUMENTAL: 'Documento coincidente: requiere resolución',
    };
    return titulos[estado] ?? estado;
  }

  tituloEvento(tipo: string): string {
    return tipo === 'VINCULACION_INICIAL' ? 'Primera vinculación' :
      tipo === 'CORRECCION_AUTORIZADA' ? 'Corrección autorizada' : tipo.replace(/_/g, ' ');
  }

  nombreOperador(evento: IEventoVinculacion | IRevisionIdentidad): string {
    return evento.nombreCompletoUsuario?.trim() || evento.usuario || 'No disponible';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
