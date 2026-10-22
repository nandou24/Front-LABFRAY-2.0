import { CommonModule } from '@angular/common';
import { FotoPacienteMiniaturaComponent } from '../../../shared/components/foto-paciente-miniatura/foto-paciente-miniatura.component';
import { Component, Input, OnInit, inject, ViewChildren, QueryList } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
  IBandejaTomaMuestrasItem, IConsultaMuestrasLaboratorioResponse,
  IPlanMuestraLaboratorio, IMuestraLaboratorio, IServicioBandejaMuestra,
} from '../../../models/Gestion/muestraLaboratorio.models';
import { IEtiquetaMuestra } from '../../../models/Gestion/etiqueta-muestra.models';
import { MuestraLaboratorioService } from '../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import { DialogEtiquetasMuestraComponent } from './dialogs/dialog-etiquetas-muestra/dialog-etiquetas-muestra.component';
import { TomaInlineRecipienteComponent } from './toma-inline-recipiente.component';

// ====== Estación operativa: pruebas y recipientes ======
@Component({
  selector: 'app-toma-inline-unica',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TomaInlineRecipienteComponent, FotoPacienteMiniaturaComponent],
  templateUrl: './toma-inline-unica.component.html',
  styleUrl: './toma-inline-unica.component.scss',
})
export class TomaInlineUnicaComponent implements OnInit {
  @Input({ required: true }) item!: IBandejaTomaMuestrasItem;
  @ViewChildren(TomaInlineRecipienteComponent) filas!: QueryList<TomaInlineRecipienteComponent>;

  private readonly service = inject(MuestraLaboratorioService);
  private readonly dialog = inject(MatDialog);
  cargando = false;
  errorCarga = '';
  consulta: IConsultaMuestrasLaboratorioResponse | null = null;
  usuariosHistorial: Record<string, string> = {};
  planResaltado = '';

  // ====== Resumen del estado vigente por recipiente ======
  resumenRecipientes = {
    porTomar: 0,
    porRecibir: 0,
    porEvaluar: 0,
    conIncidencia: 0,
    aceptadas: 0,
    pendientes: 0,
  };

  ngOnInit(): void { this.cargar(); }

  get planes(): IPlanMuestraLaboratorio[] { return this.consulta?.planes ?? []; }

  get totalPruebasCubiertas(): number {
    return (this.item.solicitud.servicios ?? []).filter(s =>
      ['RECEPCIONADA', 'ACEPTADA'].includes(this.estadoServicio(s)),
    ).length;
  }

  // ====== Un solo refresco para todos los recipientes ======
  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.service.obtenerPorSolicitud(this.item.solicitud._id).subscribe({
      next: response => {
        this.consulta = response;
        this.usuariosHistorial = response.usuariosHistorial ?? {};
        this.actualizarResumenRecipientes();
        this.item.solicitud.estado = response.solicitud.estado;
        if (response.solicitud.estadoOperativo) {
          this.item.solicitud.estadoOperativo = response.solicitud.estadoOperativo;
        }
        this.item.muestras.resumen = response.resumen;
        this.item.muestras.inicializadas = response.planes.length > 0;
        if (!this.planes.some(p => p.claveMuestraPlan === this.planResaltado)) {
          this.planResaltado = this.planes[0]?.claveMuestraPlan ?? '';
        }
        this.cargando = false;
      },
      error: err => {
        this.errorCarga = err?.error?.msg || 'No se pudo cargar el plan de toma.';
        this.cargando = false;
      },
    });
  }

  // ====== Contar solo el último intento del recipiente ======
  private actualizarResumenRecipientes(): void {
    const resumen = {
      porTomar: 0,
      porRecibir: 0,
      porEvaluar: 0,
      conIncidencia: 0,
      aceptadas: 0,
      pendientes: 0,
    };

    for (const plan of this.planes) {
      const estado = this.intentoMostrar(plan)?.estadoMuestra ?? 'PENDIENTE';

      switch (estado) {
        case 'RECOLECTADA':
          resumen.porRecibir += 1;
          break;
        case 'RECEPCIONADA':
          resumen.porEvaluar += 1;
          break;
        case 'ACEPTADA':
          resumen.aceptadas += 1;
          break;
        case 'RECHAZADA':
        case 'ANULADA':
          resumen.conIncidencia += 1;
          break;
        default:
          resumen.porTomar += 1;
          break;
      }
    }

    resumen.pendientes =
      resumen.porTomar + resumen.porRecibir + resumen.porEvaluar + resumen.conIncidencia;

    this.resumenRecipientes = resumen;
  }

  trackByPlan(_index: number, plan: IPlanMuestraLaboratorio): string {
    return plan.claveMuestraPlan;
  }

  seleccionarPlan(plan: IPlanMuestraLaboratorio): void {
    this.planResaltado = plan.claveMuestraPlan;
  }

  intentoMostrar(plan: IPlanMuestraLaboratorio): IMuestraLaboratorio | null {
    const actual = plan.intentoVigente;
    return (actual && plan.intentos.find(i => i._id === actual._id)) ??
      plan.intentos[plan.intentos.length - 1] ?? null;
  }

  private correspondeServicio(plan: IPlanMuestraLaboratorio, s: IServicioBandejaMuestra): boolean {
    const muestra = this.intentoMostrar(plan);
    return !!muestra?.coberturas.some(c =>
      (s.servicioId && c.servicioId === s.servicioId) ||
      (c.codServicio && c.codServicio === s.codServicio),
    );
  }

  esPruebaResaltada(s: IServicioBandejaMuestra): boolean {
    return this.planes.some(p => p.claveMuestraPlan === this.planResaltado &&
      this.correspondeServicio(p, s));
  }

  estadoServicio(s: IServicioBandejaMuestra): string {
    const relacionados = this.planes.filter(p => this.correspondeServicio(p, s));
    if (!relacionados.length) return 'SIN MUESTRA';
    const estados = relacionados.map(p => this.intentoMostrar(p)?.estadoMuestra ?? 'PENDIENTE');
    if (estados.every(e => e === 'ACEPTADA')) return 'ACEPTADA';
    if (estados.some(e => e === 'RECHAZADA' || e === 'ANULADA')) return 'INCIDENCIA';
    if (estados.every(e => e === 'ACEPTADA' || e === 'RECEPCIONADA')) return 'RECEPCIONADA';
    if (estados.every(e => e === 'RECOLECTADA')) return 'POR_RECIBIR';
    if (estados.some(e => e === 'ACEPTADA' || e === 'RECEPCIONADA' || e === 'RECOLECTADA')) {
      return 'PARCIAL';
    }
    return 'PENDIENTE';
  }

  get totalEtiquetas(): number {
    return this.planes.filter(p => {
      const muestra = this.intentoMostrar(p);
      return !!muestra?.codigoEtiqueta && muestra.estadoMuestra !== 'ANULADA';
    }).length;
  }

  etiquetasTodas(): void {
    const etiquetas = this.filas.toArray()
      .map(fila => fila.obtenerEtiqueta())
      .filter((e): e is IEtiquetaMuestra => e !== null);
    if (!etiquetas.length) return;
    this.dialog.open(DialogEtiquetasMuestraComponent, {
      width: '920px', maxWidth: '96vw', maxHeight: '92vh', autoFocus: false,
      data: { etiquetas },
    });
  }
}
