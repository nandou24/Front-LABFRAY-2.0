import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, Output, EventEmitter, inject } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import Swal from 'sweetalert2';

import {
  IBandejaTomaMuestrasItem, IMuestraLaboratorio, IPlanMuestraLaboratorio, IOpcionMuestraSnapshot,
  ITomarRecibirMuestraDTO, UnidadVolumenMuestra,
} from '../../../models/Gestion/muestraLaboratorio.models';
import {
  IEtiquetaMuestra, ResolucionTipoMuestraEtiqueta,
} from '../../../models/Gestion/etiqueta-muestra.models';
import { MuestraLaboratorioService } from '../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import {
  CapturaEvidenciaMuestraComponent, IEvidenciaCapturada,
} from './components/captura-evidencia-muestra/captura-evidencia-muestra.component';
import { DialogHistorialMuestraComponent } from './dialogs/dialog-historial-muestra/dialog-historial-muestra.component';
import { DialogEvidenciasMuestraComponent } from './dialogs/dialog-evidencias-muestra/dialog-evidencias-muestra.component';
import { DialogEtiquetasMuestraComponent } from './dialogs/dialog-etiquetas-muestra/dialog-etiquetas-muestra.component';
import { DialogCorregirEvaluacionMuestraComponent } from './dialogs/dialog-corregir-evaluacion-muestra/dialog-corregir-evaluacion-muestra.component';
import { DialogAnularMuestraComponent } from './dialogs/dialog-anular-muestra/dialog-anular-muestra.component';

@Component({
  selector: 'app-toma-inline-recipiente',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatButtonModule, MatDatepickerModule,
    MatNativeDateModule, MatDialogModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatRadioModule, MatSelectModule, MatTooltipModule,
    CapturaEvidenciaMuestraComponent,
  ],
  templateUrl: './toma-inline-recipiente.component.html',
  styleUrl: './toma-inline-recipiente.component.scss',
})
export class TomaInlineRecipienteComponent implements OnChanges {
  @Input({ required: true }) item!: IBandejaTomaMuestrasItem;
  @Input({ required: true }) planActual!: IPlanMuestraLaboratorio;
  @Input() usuariosHistorial: Record<string, string> = {};
  @Output() actualizado = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MuestraLaboratorioService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  procesando = false;
  opciones: IOpcionMuestraSnapshot[] = [];
  readonly hoy = new Date();
  readonly unidades: UnidadVolumenMuestra[] = ['uL', 'mL', 'L'];

  mostrarDetalles = false;
  mostrarFotoToma = false;
  mostrarFotoEvaluacion = false;
  mostrarRechazo = false;
  mostrarReversion = false;
  fotoToma: File | null = null;
  fotoEvaluacion: File | null = null;
  private ultimaClaveMuestra = '';

  private readonly volumenCompleto: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const v = control.get('volumenRecolectado')?.value;
    const u = control.get('unidadVolumenRecolectado')?.value;
    const tieneVolumen = v !== null && v !== undefined && String(v).trim() !== '';
    const tieneUnidad = u !== null && u !== undefined && String(u).trim() !== '';
    return tieneVolumen === tieneUnidad ? null : { volumenIncompleto: true };
  };

  readonly formToma = this.fb.group({
    opcionFisica: this.fb.control<string | null>(null, Validators.required),
    fechaRecoleccion: this.fb.control<Date | null>(new Date(), Validators.required),
    volumenRecolectado: this.fb.control<number | null>(null, Validators.min(0.000001)),
    unidadVolumenRecolectado: this.fb.control<UnidadVolumenMuestra | null>(null),
    observacionRecoleccion: [''],
  }, { validators: this.volumenCompleto });

  readonly formReversion = this.fb.group({
    motivoReversion: ['', Validators.required],
  });

  readonly formEvaluacion = this.fb.group({
    observacionAceptacion: [''],
    motivoRechazo: ['', Validators.required],
  });

  get plan(): IPlanMuestraLaboratorio | null { return this.planActual ?? null; }

  get muestra(): IMuestraLaboratorio | null {
    const plan = this.plan;
    if (!plan) return null;
    const actual = plan.intentoVigente;
    return (actual && plan.intentos.find(i => i._id === actual._id)) ??
      plan.intentos[plan.intentos.length - 1] ?? null;
  }

  get estado(): string { return this.muestra?.estadoMuestra ?? 'PENDIENTE'; }

  get puedeReintentar(): boolean {
    return !!this.plan?.requiereReintento &&
      (this.estado === 'RECHAZADA' || this.estado === 'ANULADA');
  }

  // ====== Requisitos de rechazo visibles en la tarjeta ======
  get faltantesRechazo(): string[] {
    const pendientes: string[] = [];
    if (!this.formEvaluacion.controls.motivoRechazo.value?.trim()) pendientes.push('Motivo del rechazo');
    if (!this.fotoEvaluacion) pendientes.push('Fotografía de rechazo');
    return pendientes;
  }

  // ====== Reactivar formulario al cambiar intento o etapa ======
  ngOnChanges(): void {
    const muestra = this.muestra;
    this.opciones = muestra ? this.opcionesComunes(muestra) : [];
    const clave = muestra ? `${muestra._id}:${muestra.estadoMuestra}` : '';
    if (!muestra || clave === this.ultimaClaveMuestra) return;
    this.ultimaClaveMuestra = clave;
    const preferida = this.opciones.find(o =>
      o.tipoMuestraId === muestra.tipoMuestraId &&
      o.tuboEnvaseId === muestra.tuboEnvaseId,
    ) ?? this.opciones.find(o => o.esPredeterminada === true) ?? this.opciones[0];
    this.formToma.reset({
      opcionFisica: preferida ? this.claveOpcion(preferida) : null,
      fechaRecoleccion: new Date(),
      volumenRecolectado: null,
      unidadVolumenRecolectado: null,
      observacionRecoleccion: '',
    });
    this.formEvaluacion.reset({ observacionAceptacion: '', motivoRechazo: '' });
    this.fotoToma = null;
    this.fotoEvaluacion = null;
    this.mostrarDetalles = false;
    this.mostrarRechazo = false;
    this.mostrarReversion = false;
    this.formReversion.reset({ motivoReversion: '' });
    this.mostrarFotoToma = false;
    this.mostrarFotoEvaluacion = false;
  }

  claveOpcion(o: IOpcionMuestraSnapshot): string {
    return `${o.tipoMuestraId}:${o.tuboEnvaseId}`;
  }

  opcionesComunes(muestra: IMuestraLaboratorio): IOpcionMuestraSnapshot[] {
    if (!muestra.coberturas?.length) return [];
    const clave = (o: IOpcionMuestraSnapshot) => this.claveOpcion(o);
    let comunes = new Set(
      (muestra.coberturas[0].opcionesPermitidas ?? []).map(clave),
    );
    for (const c of muestra.coberturas.slice(1)) {
      const actual = new Set((c.opcionesPermitidas ?? []).map(clave));
      comunes = new Set([...comunes].filter(k => actual.has(k)));
    }
    const unicas = new Map<string, IOpcionMuestraSnapshot>();
    muestra.coberturas.forEach(c => (c.opcionesPermitidas ?? []).forEach(o => {
      const k = clave(o);
      if (comunes.has(k) && !unicas.has(k)) unicas.set(k, o);
    }));
    // ====== Seleccionar la preferencia compatible con todas las pruebas ======
    const opciones = [...unicas.values()];
    const puntajes = new Map<string, number>();
    muestra.coberturas.forEach(c => {
      const preferida = (c.opcionesPermitidas ?? []).find(o => o.esPredeterminada === true);
      if (preferida) {
        const k = clave(preferida);
        puntajes.set(k, (puntajes.get(k) ?? 0) + 1);
      }
    });
    let clavePreferida: string | null = null;
    let mejorPuntaje = 0;
    opciones.forEach(o => {
      const k = clave(o);
      const puntaje = puntajes.get(k) ?? 0;
      if (puntaje > mejorPuntaje) {
        clavePreferida = k;
        mejorPuntaje = puntaje;
      }
    });
    return opciones.map(o => ({
      ...o, esPredeterminada: clavePreferida !== null && clave(o) === clavePreferida,
    }));
  }

  colorRecipiente(color?: string | null): string {
    const colores: Record<string, string> = {
      AMARILLO: '#facc15', ROJO: '#ef4444', LILA: '#a78bfa',
      MORADO: '#9333ea', AZUL: '#3b82f6', VERDE: '#22c55e',
      GRIS: '#9ca3af', NEGRO: '#1f2937', BLANCO: '#f8fafc',
      CELESTE: '#38bdf8', NARANJA: '#f97316', ROSADO: '#f472b6',
    };
    return colores[String(color ?? '').toUpperCase()] ?? '#cbd5e1';
  }

  cambiarFotoToma(e: IEvidenciaCapturada | null): void { this.fotoToma = e?.archivo ?? null; }
  cambiarFotoEvaluacion(e: IEvidenciaCapturada | null): void { this.fotoEvaluacion = e?.archivo ?? null; }

  // ====== Registrar toma sin abrir diálogo ======
  registrarToma(): void {
    const muestra = this.muestra;
    if (this.procesando || !muestra || this.estado !== 'PENDIENTE') return;
    if (this.formToma.invalid) {
      this.formToma.markAllAsTouched();
      this.mostrarDetalles = true;
      return;
    }
    const r = this.formToma.getRawValue();
    const seleccion = this.opciones.find(o => this.claveOpcion(o) === r.opcionFisica);
    if (!seleccion || !r.fechaRecoleccion) return;
    const fecha = r.fechaRecoleccion;
    const fechaRecoleccion = [fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')].join('-');
    const hayVolumen = r.volumenRecolectado !== null && r.volumenRecolectado !== undefined;
    const body: ITomarRecibirMuestraDTO = {
      tipoMuestraId: seleccion.tipoMuestraId,
      tuboEnvaseId: seleccion.tuboEnvaseId,
      volumenRecolectado: hayVolumen ? Number(r.volumenRecolectado) : null,
      unidadVolumenRecolectado: hayVolumen ? r.unidadVolumenRecolectado : null,
      observacionRecoleccion: r.observacionRecoleccion?.trim() ?? '',
      fechaRecoleccion,
    };
    this.procesando = true;
    this.service.tomarYRecibirMuestra(muestra._id, body, muestra.__v).subscribe({
      next: response => this.guardarFotoPosterior(
        muestra._id, this.fotoToma, 'RECOLECCION', body.observacionRecoleccion ?? '',
        response.msg || 'Toma y recepción registradas.',
      ),
      error: err => this.errorOperacion(err, 'No se pudo registrar la toma / recepción.'),
    });
  }

  // ====== Deshacer una toma accidental sin cerrar el intento ======
  revertirTomaRecepcion(): void {
    const muestra = this.muestra;
    if (!muestra || this.procesando || this.estado !== 'RECEPCIONADA') return;
    const motivo = this.formReversion.controls.motivoReversion.value?.trim() ?? '';
    if (muestra.__v == null) {
      this.actualizado.emit();
      this.snackBar.open('Actualiza el recipiente antes de revertir la toma.', 'Cerrar', { duration: 4500 });
      return;
    }
    if (!motivo) {
      this.formReversion.controls.motivoReversion.markAsTouched();
      return;
    }
    this.procesando = true;
    this.service.revertirTomaRecepcion(muestra._id, motivo, muestra.__v).subscribe({
      next: response => this.exito(response.msg || 'Toma / recepción revertida.'),
      error: err => this.errorOperacion(err, 'No se pudo revertir la toma / recepción.'),
    });
  }

  // ====== Aceptar desde la tarjeta ======
  aceptar(): void {
    const muestra = this.muestra;
    if (this.procesando || !muestra || this.estado !== 'RECEPCIONADA') return;
    this.procesando = true;
    const observacion = this.formEvaluacion.controls.observacionAceptacion.value?.trim() ?? '';
    this.service.aceptarMuestra(muestra._id, { observacionAceptacion: observacion }, muestra.__v)
      .subscribe({
        next: response => this.guardarFotoPosterior(
          muestra._id, this.fotoEvaluacion, 'ACEPTACION', observacion,
          response.msg || 'Muestra aceptada.',
        ),
        error: err => this.errorOperacion(err, 'No se pudo aceptar la muestra.'),
      });
  }

  // ====== Rechazo explícito con evidencia ======
  rechazar(): void {
    const muestra = this.muestra;
    if (this.procesando || !muestra || this.estado !== 'RECEPCIONADA') return;
    const motivo = this.formEvaluacion.controls.motivoRechazo.value?.trim() ?? '';
    if (!motivo) {
      this.formEvaluacion.controls.motivoRechazo.setErrors({ required: true });
      this.formEvaluacion.controls.motivoRechazo.markAsTouched();
      return;
    }
    if (!this.fotoEvaluacion) {
      this.snackBar.open('Para rechazar debe adjuntar una fotografía.', 'Cerrar', {
        duration: 3500,
      });
      return;
    }
    this.procesando = true;
    this.service.rechazarMuestra(muestra._id, motivo, this.fotoEvaluacion, muestra.__v).subscribe({
      next: response => this.exito(response.msg || 'Muestra rechazada.'),
      error: err => this.errorOperacion(err, 'No se pudo rechazar la muestra.'),
    });
  }

  private guardarFotoPosterior(
    id: string, archivo: File | null, etapa: 'RECOLECCION' | 'ACEPTACION',
    observacion: string, mensaje: string,
  ): void {
    if (!archivo) { this.exito(mensaje); return; }
    this.service.registrarEvidencia(id, archivo, etapa, observacion).subscribe({
      next: () => this.exito(mensaje),
      error: err => {
        this.procesando = false;
        this.actualizado.emit();
        void Swal.fire({
          toast: true, position: 'top-end', background: '#164e63', color: '#ffffff', iconColor: '#facc15', icon: 'warning',
          title: 'Operación guardada; fotografía pendiente',
          text: err?.error?.msg || 'Puede agregarla desde Evidencias.',
          timer: 4500, timerProgressBar: true, showConfirmButton: false,
        });
      },
    });
  }

  private exito(mensaje: string): void {
    this.procesando = false;
    this.actualizado.emit();
    void Swal.fire({
      toast: true, position: 'top-end', background: '#164e63', color: '#ffffff', iconColor: '#67e8f9', icon: 'success', title: mensaje,
      timer: 2800, timerProgressBar: true, showConfirmButton: false,
    });
  }

  private errorOperacion(err: any, fallback: string): void {
    this.procesando = false;
    this.snackBar.open(err?.error?.msg || fallback, 'Cerrar', { duration: 4500 });
  }

  // ====== Historial y operaciones especiales ======
  historial(): void {
    if (!this.muestra) return;
    this.dialog.open(DialogHistorialMuestraComponent, {
      width: '780px', maxWidth: '96vw', maxHeight: '88vh', autoFocus: false,
      data: {
        muestra: this.muestra,
        intentos: this.plan?.intentos ?? [],
        usuariosHistorial: this.usuariosHistorial,
      },
    });
  }

  evidencias(): void {
    if (!this.muestra) return;
    const ref = this.dialog.open(DialogEvidenciasMuestraComponent, {
      width: '900px', maxWidth: '96vw', maxHeight: '92vh', autoFocus: false,
      data: { muestra: this.muestra, numeroRecipiente: this.muestra.numeroRecipiente },
    });
    ref.afterClosed().subscribe(() => this.actualizado.emit());
  }

  corregir(): void {
    if (!this.muestra) return;
    const ref = this.dialog.open(DialogCorregirEvaluacionMuestraComponent, {
      width: '680px', maxWidth: '96vw', maxHeight: '92vh', autoFocus: false,
      data: { muestra: this.muestra, numeroRecipiente: this.muestra.numeroRecipiente },
    });
    ref.afterClosed().subscribe(ok => { if (ok === true) this.actualizado.emit(); });
  }

  anular(): void {
    if (!this.muestra) return;
    const ref = this.dialog.open(DialogAnularMuestraComponent, {
      width: '600px', maxWidth: '94vw', maxHeight: '90vh', autoFocus: false,
      data: { muestra: this.muestra, numeroRecipiente: this.muestra.numeroRecipiente },
    });
    ref.afterClosed().subscribe(ok => { if (ok === true) this.actualizado.emit(); });
  }

  generarReintento(): void {
    if (!this.muestra || !this.puedeReintentar || this.procesando) return;
    this.procesando = true;
    this.service.generarReintento(this.muestra._id, this.muestra.__v).subscribe({
      next: response => this.exito(response.msg || 'Nuevo intento disponible.'),
      error: err => this.errorOperacion(err, 'No se pudo generar el reintento.'),
    });
  }

  // ====== Etiqueta individual ======
  etiqueta(): void {
    const etiqueta = this.obtenerEtiqueta();
    if (!etiqueta) return;
    this.dialog.open(DialogEtiquetasMuestraComponent, {
      width: '920px', maxWidth: '96vw', maxHeight: '92vh', autoFocus: false,
      data: { etiquetas: [etiqueta] },
    });
  }

  obtenerEtiqueta(): IEtiquetaMuestra | null {
    const muestra = this.muestra;
    if (!muestra?.codigoEtiqueta || muestra.estadoMuestra === 'ANULADA') return null;
    const codigoLaboratorio = String(muestra.codigoLaboratorio ??
      this.item.solicitud.codigoLaboratorio ?? '').trim();
    const codigoEtiqueta = muestra.codigoEtiqueta.trim();
    const match = codigoLaboratorio.match(/^(.*)-(\d+)$/);
    const opciones = this.opcionesComunes(muestra);
    const tipos = new Map<string, string>();
    opciones.forEach(o => {
      const nombre = String(o.tipoMuestra?.nombreTipoMuestra ?? '').trim();
      if (nombre) tipos.set(o.tipoMuestraId, nombre);
    });
    let resolucion: ResolucionTipoMuestraEtiqueta = 'POR_DEFINIR';
    let tipoMuestra = 'TIPO POR DEFINIR';
    const real = muestra.tipoMuestra?.nombreTipoMuestra?.trim();
    if (real) {
      resolucion = 'REAL'; tipoMuestra = real.toUpperCase();
    } else if (tipos.size === 1) {
      resolucion = 'UNICA_OPCION';
      tipoMuestra = [...tipos.values()][0].toUpperCase();
    }
    const paciente = this.item.solicitud.paciente;
    const etiqueta: IEtiquetaMuestra = {
      muestraLaboratorioId: muestra._id,
      numeroRecipiente: muestra.numeroRecipiente,
      numeroIntento: muestra.numeroIntento,
      estadoMuestra: muestra.estadoMuestra,
      nombrePaciente: [paciente.apePatCliente, paciente.apeMatCliente,
        paciente.nombreCliente].filter(Boolean).join(' ').trim(),
      tipoDocumento: String(paciente.tipoDoc ?? '').trim() || 'DOC',
      numeroDocumento: String(paciente.nroDoc ?? '').trim() || '-',
      codigoLaboratorio,
      codigoLaboratorioPrefijo: match ? match[1] : (codigoLaboratorio || codigoEtiqueta),
      correlativoMensual: match ? match[2] : null,
      codigoEtiqueta,
      codigoEtiquetaSufijo: codigoLaboratorio && codigoEtiqueta.startsWith(codigoLaboratorio)
        ? codigoEtiqueta.slice(codigoLaboratorio.length) : '',
      tipoMuestra,
      resolucionTipoMuestra: resolucion,
    };
    return etiqueta;
  }
}
