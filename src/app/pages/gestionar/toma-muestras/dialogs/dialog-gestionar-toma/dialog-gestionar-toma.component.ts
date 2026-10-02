import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Swal from 'sweetalert2';

import {
  IBandejaTomaMuestrasItem,
  IConsultaMuestrasLaboratorioResponse,
  IMuestraLaboratorio,
  IOpcionMuestraSnapshot,
  IPlanMuestraLaboratorio,
} from '../../../../../models/Gestion/muestraLaboratorio.models';
import { MuestraLaboratorioService } from '../../../../../services/gestion/muestraLaboratorio/muestra-laboratorio.service';
import { DialogRecolectarMuestraComponent } from '../dialog-recolectar-muestra/dialog-recolectar-muestra.component';
import { DialogRecepcionarMuestraComponent } from '../dialog-recepcionar-muestra/dialog-recepcionar-muestra.component';
import { DialogAceptarMuestraComponent } from '../dialog-aceptar-muestra/dialog-aceptar-muestra.component';
import { DialogRechazarMuestraComponent } from '../dialog-rechazar-muestra/dialog-rechazar-muestra.component';
import { DialogEvidenciasMuestraComponent } from '../dialog-evidencias-muestra/dialog-evidencias-muestra.component';
import { DialogAnularMuestraComponent } from '../dialog-anular-muestra/dialog-anular-muestra.component';
import { DialogEtiquetasMuestraComponent } from '../dialog-etiquetas-muestra/dialog-etiquetas-muestra.component';
import {
  IEtiquetaMuestra,
  ResolucionTipoMuestraEtiqueta,
} from '../../../../../models/Gestion/etiqueta-muestra.models';

export interface IGestionarTomaDialogData {
  item: IBandejaTomaMuestrasItem;
}

interface IServicioMuestraDialog {
  claveUnidad: string;
  codServicio: string;
  nombreServicio: string;
}

@Component({
  selector: 'app-dialog-gestionar-toma',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dialog-gestionar-toma.component.html',
  styleUrl: './dialog-gestionar-toma.component.scss',
})
export class DialogGestionarTomaComponent implements OnInit {
  readonly data = inject<IGestionarTomaDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogGestionarTomaComponent>,
  );

  private readonly _dialog = inject(MatDialog);

  private readonly _muestraLaboratorioService = inject(
    MuestraLaboratorioService,
  );

  cargando = true;
  errorCarga = '';
  huboCambios = false;
  generandoReintentoMuestraId: string | null = null;

  consulta: IConsultaMuestrasLaboratorioResponse | null = null;

  // ====== Ciclo de vida ======

  ngOnInit(): void {
    this.cargarMuestras();
  }

  // ====== Cargar muestras ======

  cargarMuestras(): void {
    this.cargando = true;
    this.errorCarga = '';

    this._muestraLaboratorioService
      .obtenerPorSolicitud(this.data.item.solicitud._id)
      .subscribe({
        next: (response) => {
          this.consulta = response;
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al cargar muestras de la solicitud:', error);

          this.consulta = null;
          this.cargando = false;
          this.errorCarga =
            error?.error?.msg ||
            'No se pudieron cargar las muestras de la solicitud';
        },
      });
  }

  // ====== Cerrar dialog ======

  cerrar(): void {
    this._dialogRef.close(this.huboCambios);
  }

  // ====== Intento a mostrar ======

  obtenerIntentoMostrar(
    plan: IPlanMuestraLaboratorio,
  ): IMuestraLaboratorio | null {
    if (plan.intentoVigente) {
      const vigente = plan.intentos.find(
        (intento) => intento._id === plan.intentoVigente?._id,
      );

      if (vigente) {
        return vigente;
      }
    }

    return plan.intentos.length > 0
      ? plan.intentos[plan.intentos.length - 1]
      : null;
  }

  // ====== Intento vigente ======

  obtenerIntentoVigente(
    plan: IPlanMuestraLaboratorio,
  ): IMuestraLaboratorio | null {
    if (!plan.intentoVigente) {
      return null;
    }

    return (
      plan.intentos.find(
        (intento) => intento._id === plan.intentoVigente?._id,
      ) ?? null
    );
  }

  // ====== Estado del plan ======

  obtenerEstadoPlan(plan: IPlanMuestraLaboratorio): string {
    if (plan.intentoVigente?.estadoMuestra) {
      return plan.intentoVigente.estadoMuestra;
    }

    const ultimoIntento =
      plan.intentos.length > 0 ? plan.intentos[plan.intentos.length - 1] : null;

    return ultimoIntento?.estadoMuestra ?? 'SIN MUESTRA';
  }

  // ====== Clase visual del estado ======

  obtenerClaseEstadoMuestra(estado: string | null | undefined): string {
    const estadoNormalizado = String(estado ?? '')
      .trim()
      .toUpperCase();

    const clases: Record<string, string> = {
      PENDIENTE: 'estado-chip-pendiente',
      RECOLECTADA: 'estado-chip-recolectada',
      RECEPCIONADA: 'estado-chip-recepcionada',
      ACEPTADA: 'estado-chip-aceptada',
      RECHAZADA: 'estado-chip-rechazada',
      ANULADA: 'estado-chip-anulada',
    };

    return clases[estadoNormalizado] ?? 'estado-chip-neutro';
  }

  // ====== Validar intento vigente ======

  esIntentoVigente(
    plan: IPlanMuestraLaboratorio,
    muestra: IMuestraLaboratorio,
  ): boolean {
    return plan.intentoVigente?._id === muestra._id;
  }

  // ====== Opciones comunes del recipiente ======

  obtenerOpcionesComunes(
    muestra: IMuestraLaboratorio,
  ): IOpcionMuestraSnapshot[] {
    const coberturas = Array.isArray(muestra.coberturas)
      ? muestra.coberturas
      : [];

    if (coberturas.length === 0) {
      return [];
    }

    const construirClave = (opcion: IOpcionMuestraSnapshot): string =>
      `${opcion.tipoMuestraId}:${opcion.tuboEnvaseId}`;

    const primeraCobertura = coberturas[0];

    let clavesComunes = new Set(
      (primeraCobertura.opcionesPermitidas ?? []).map(construirClave),
    );

    for (const cobertura of coberturas.slice(1)) {
      const clavesCobertura = new Set(
        (cobertura.opcionesPermitidas ?? []).map(construirClave),
      );

      clavesComunes = new Set(
        [...clavesComunes].filter((clave) => clavesCobertura.has(clave)),
      );
    }

    const opcionesPorClave = new Map<string, IOpcionMuestraSnapshot>();

    coberturas.forEach((cobertura) => {
      (cobertura.opcionesPermitidas ?? []).forEach((opcion) => {
        const clave = construirClave(opcion);

        if (clavesComunes.has(clave) && !opcionesPorClave.has(clave)) {
          opcionesPorClave.set(clave, opcion);
        }
      });
    });

    return [...opcionesPorClave.values()];
  }

  // ====== Servicios del recipiente ======

  obtenerServiciosMuestra(
    muestra: IMuestraLaboratorio,
  ): IServicioMuestraDialog[] {
    const servicios = new Map<string, IServicioMuestraDialog>();

    (muestra.coberturas ?? []).forEach((cobertura) => {
      const clave = cobertura.claveUnidad || cobertura.servicioId;

      if (servicios.has(clave)) {
        return;
      }

      servicios.set(clave, {
        claveUnidad: cobertura.claveUnidad,
        codServicio: cobertura.codServicio,
        nombreServicio: cobertura.nombreServicio,
      });
    });

    return [...servicios.values()];
  }

  // ====== Puede registrar recolección ======

  puedeRegistrarRecoleccion(plan: IPlanMuestraLaboratorio): boolean {
    return plan.intentoVigente?.estadoMuestra === 'PENDIENTE';
  }

  // ====== Registrar recolección ======

  registrarRecoleccion(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoVigente(plan);

    if (!muestra || muestra.estadoMuestra !== 'PENDIENTE') {
      return;
    }

    const opciones = this.obtenerOpcionesComunes(muestra);

    if (opciones.length === 0) {
      return;
    }

    const dialogRef = this._dialog.open(DialogRecolectarMuestraComponent, {
      width: '680px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        muestra,
        opciones,
        numeroRecipiente: plan.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      this.huboCambios = true;
      this.cargarMuestras();
    });
  }

  // ====== Puede registrar recepción ======

  puedeRegistrarRecepcion(plan: IPlanMuestraLaboratorio): boolean {
    return plan.intentoVigente?.estadoMuestra === 'RECOLECTADA';
  }

  // ====== Registrar recepción ======

  registrarRecepcion(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoVigente(plan);

    if (!muestra || muestra.estadoMuestra !== 'RECOLECTADA') {
      return;
    }

    const dialogRef = this._dialog.open(DialogRecepcionarMuestraComponent, {
      width: '560px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        muestra,
        numeroRecipiente: plan.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      this.huboCambios = true;
      this.cargarMuestras();
    });
  }

  // ====== Puede evaluar muestra ======

  puedeEvaluarMuestra(plan: IPlanMuestraLaboratorio): boolean {
    return plan.intentoVigente?.estadoMuestra === 'RECEPCIONADA';
  }

  // ====== Aceptar muestra ======

  aceptarMuestra(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoVigente(plan);

    if (!muestra || muestra.estadoMuestra !== 'RECEPCIONADA') {
      return;
    }

    const dialogRef = this._dialog.open(DialogAceptarMuestraComponent, {
      width: '560px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        muestra,
        numeroRecipiente: plan.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      this.huboCambios = true;
      this.cargarMuestras();
    });
  }

  // ====== Rechazar muestra ======

  rechazarMuestra(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoVigente(plan);

    if (!muestra || muestra.estadoMuestra !== 'RECEPCIONADA') {
      return;
    }

    const dialogRef = this._dialog.open(DialogRechazarMuestraComponent, {
      width: '600px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        muestra,
        numeroRecipiente: plan.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      this.huboCambios = true;
      this.cargarMuestras();
    });
  }

  // ====== Puede anular muestra ======

  puedeAnularMuestra(plan: IPlanMuestraLaboratorio): boolean {
    const estado = plan.intentoVigente?.estadoMuestra;

    return (
      estado === 'PENDIENTE' ||
      estado === 'RECOLECTADA' ||
      estado === 'RECEPCIONADA'
    );
  }

  // ====== Anular muestra ======

  anularMuestra(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoVigente(plan);

    if (!muestra || !this.puedeAnularMuestra(plan)) {
      return;
    }

    const dialogRef = this._dialog.open(DialogAnularMuestraComponent, {
      width: '600px',
      maxWidth: '94vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        muestra,
        numeroRecipiente: plan.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      this.huboCambios = true;
      this.cargarMuestras();
    });
  }

  // ====== Puede generar reintento ======

  puedeGenerarReintento(plan: IPlanMuestraLaboratorio): boolean {
    return (
      plan.requiereReintento === true &&
      plan.intentoVigente?.estadoMuestra === 'RECHAZADA'
    );
  }

  // ====== Generar reintento ======

  async generarReintento(plan: IPlanMuestraLaboratorio): Promise<void> {
    const muestra = this.obtenerIntentoVigente(plan);

    if (
      !muestra ||
      muestra.estadoMuestra !== 'RECHAZADA' ||
      !this.puedeGenerarReintento(plan) ||
      this.generandoReintentoMuestraId === muestra._id
    ) {
      return;
    }

    const etiqueta = muestra.codigoEtiqueta || muestra.codMuestra;

    const resultado = await Swal.fire({
      icon: 'question',
      title: '¿Generar nueva muestra?',
      html: `
        <div style="text-align: left;">
          <p>
            Se generará un nuevo intento para el
            <strong>recipiente ${plan.numeroRecipiente ?? ''}</strong>.
          </p>

          <p>
            El intento rechazado
            <strong>${etiqueta}</strong> se conservará en el historial
            y la nueva muestra quedará en estado
            <strong>PENDIENTE</strong>.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, generar nueva muestra',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
    });

    if (!resultado.isConfirmed) {
      return;
    }

    // ====== Bloquear reintento ======

    this.generandoReintentoMuestraId = muestra._id;

    Swal.fire({
      title: 'Generando nueva muestra',
      text: 'Creando el nuevo intento del recipiente...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this._muestraLaboratorioService.generarReintento(muestra._id).subscribe({
      next: (response) => {
        this.generandoReintentoMuestraId = null;
        this.huboCambios = true;
        this.cargarMuestras();

        Swal.fire({
          icon: response.creada ? 'success' : 'info',
          title: response.creada
            ? 'Nueva muestra generada'
            : 'El reintento ya existía',
          text:
            response.msg || 'El nuevo intento de la muestra quedó disponible.',
          confirmButtonText: 'Continuar',
          confirmButtonColor: '#3085d6',
        });
      },
      error: (error) => {
        this.generandoReintentoMuestraId = null;

        console.error('Error al generar reintento de muestra:', error);

        Swal.fire({
          icon: 'error',
          title: 'No se pudo generar la nueva muestra',
          text:
            error?.error?.msg ||
            'No se pudo generar el reintento de la muestra.',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#d33',
        });
      },
    });
  }

  // ====== Puede gestionar evidencias ======

  puedeGestionarEvidencias(muestra: IMuestraLaboratorio): boolean {
    const tieneEvidencias =
      Array.isArray(muestra.evidenciasFotograficas) &&
      muestra.evidenciasFotograficas.length > 0;

    if (tieneEvidencias) {
      return true;
    }

    if (muestra.estadoMuestra === 'ANULADA') {
      return false;
    }

    return Boolean(
      (muestra.recolectadoPor && muestra.fechaRecoleccion) ||
        (muestra.recibidoPor && muestra.fechaRecepcion) ||
        (muestra.aceptadoPor && muestra.fechaAceptacion) ||
        (muestra.rechazadoPor && muestra.fechaRechazo),
    );
  }

  // ====== Contar evidencias activas ======

  contarEvidenciasActivas(muestra: IMuestraLaboratorio): number {
    const evidencias = Array.isArray(muestra.evidenciasFotograficas)
      ? muestra.evidenciasFotograficas
      : [];

    return evidencias.filter(
      (evidencia) => (evidencia.estadoEvidencia ?? 'ACTIVA') === 'ACTIVA',
    ).length;
  }

  // ====== Gestionar evidencias ======

  gestionarEvidencias(muestra: IMuestraLaboratorio): void {
    if (!this.puedeGestionarEvidencias(muestra)) {
      return;
    }

    const dialogRef = this._dialog.open(DialogEvidenciasMuestraComponent, {
      width: '900px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      data: {
        muestra,
        numeroRecipiente: muestra.numeroRecipiente,
      },
    });

    dialogRef.afterClosed().subscribe((actualizado: boolean | undefined) => {
      if (actualizado !== true) {
        return;
      }

      // ====== Refrescar metadata de evidencias ======

      this.cargarMuestras();
    });
  }

  // ====== Etiquetas de muestra ======

  puedeVerEtiqueta(muestra: IMuestraLaboratorio | null | undefined): boolean {
    if (!muestra || muestra.estadoMuestra === 'ANULADA') {
      return false;
    }

    return Boolean(String(muestra.codigoEtiqueta ?? '').trim());
  }

  cantidadEtiquetasDisponibles(): number {
    if (!this.consulta) {
      return 0;
    }

    return this.consulta.planes.reduce((total, plan) => {
      const muestra = this.obtenerIntentoMostrar(plan);
      return total + (this.puedeVerEtiqueta(muestra) ? 1 : 0);
    }, 0);
  }

  verEtiqueta(plan: IPlanMuestraLaboratorio): void {
    const muestra = this.obtenerIntentoMostrar(plan);

    if (!this.puedeVerEtiqueta(muestra) || !muestra) {
      return;
    }

    const etiqueta = this.construirEtiquetaMuestra(muestra);

    if (!etiqueta) {
      this.mostrarErrorEtiqueta();
      return;
    }

    this.abrirVistaPreviaEtiquetas([etiqueta]);
  }

  verTodasEtiquetas(): void {
    if (!this.consulta) {
      return;
    }

    const etiquetas = this.consulta.planes
      .map((plan) => this.obtenerIntentoMostrar(plan))
      .filter((muestra): muestra is IMuestraLaboratorio =>
        this.puedeVerEtiqueta(muestra),
      )
      .map((muestra) => this.construirEtiquetaMuestra(muestra))
      .filter((etiqueta): etiqueta is IEtiquetaMuestra => etiqueta !== null);

    if (etiquetas.length === 0) {
      this.mostrarErrorEtiqueta();
      return;
    }

    this.abrirVistaPreviaEtiquetas(etiquetas);
  }

  private abrirVistaPreviaEtiquetas(etiquetas: IEtiquetaMuestra[]): void {
    this._dialog.open(DialogEtiquetasMuestraComponent, {
      width: '920px',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      data: {
        etiquetas,
      },
    });
  }

  private construirEtiquetaMuestra(
    muestra: IMuestraLaboratorio,
  ): IEtiquetaMuestra | null {
    const codigoEtiqueta = String(muestra.codigoEtiqueta ?? '').trim();

    if (!codigoEtiqueta) {
      return null;
    }

    const codigoLaboratorio = String(
      muestra.codigoLaboratorio ??
        this.data.item.solicitud.codigoLaboratorio ??
        '',
    ).trim();

    const partesCodigo = this.separarCodigoLaboratorio(
      codigoLaboratorio,
      codigoEtiqueta,
    );

    const tipoMuestra = this.resolverTipoMuestraEtiqueta(muestra);
    const paciente = this.data.item.solicitud.paciente;

    return {
      muestraLaboratorioId: muestra._id,
      numeroRecipiente: muestra.numeroRecipiente,
      numeroIntento: muestra.numeroIntento,
      estadoMuestra: muestra.estadoMuestra,
      nombrePaciente: this.obtenerNombrePaciente(),
      tipoDocumento: String(paciente.tipoDoc ?? '').trim() || 'DOC',
      numeroDocumento: String(paciente.nroDoc ?? '').trim() || '-',
      codigoLaboratorio,
      codigoLaboratorioPrefijo: partesCodigo.prefijo,
      correlativoMensual: partesCodigo.correlativo,
      codigoEtiqueta,
      codigoEtiquetaSufijo: partesCodigo.sufijo,
      tipoMuestra: tipoMuestra.nombre,
      resolucionTipoMuestra: tipoMuestra.resolucion,
    };
  }

  private separarCodigoLaboratorio(
    codigoLaboratorio: string,
    codigoEtiqueta: string,
  ): {
    prefijo: string;
    correlativo: string | null;
    sufijo: string;
  } {
    const match = codigoLaboratorio.match(/^(.*)-(\d+)$/);

    if (!match) {
      return {
        prefijo: codigoLaboratorio || codigoEtiqueta,
        correlativo: null,
        sufijo:
          codigoLaboratorio && codigoEtiqueta.startsWith(codigoLaboratorio)
            ? codigoEtiqueta.slice(codigoLaboratorio.length)
            : '',
      };
    }

    const prefijo = match[1];
    const correlativo = match[2];
    const sufijo = codigoEtiqueta.startsWith(codigoLaboratorio)
      ? codigoEtiqueta.slice(codigoLaboratorio.length)
      : '';

    return {
      prefijo,
      correlativo,
      sufijo,
    };
  }

  private resolverTipoMuestraEtiqueta(muestra: IMuestraLaboratorio): {
    nombre: string;
    resolucion: ResolucionTipoMuestraEtiqueta;
  } {
    const nombreReal = String(
      muestra.tipoMuestra?.nombreTipoMuestra ?? '',
    ).trim();

    if (nombreReal) {
      return {
        nombre: nombreReal.toUpperCase(),
        resolucion: 'REAL',
      };
    }

    const opciones = this.obtenerOpcionesComunes(muestra);
    const tipos = new Map<string, string>();

    opciones.forEach((opcion) => {
      const nombre = String(opcion.tipoMuestra?.nombreTipoMuestra ?? '').trim();

      if (!nombre) {
        return;
      }

      const clave = String(opcion.tipoMuestraId || nombre)
        .trim()
        .toUpperCase();

      if (!tipos.has(clave)) {
        tipos.set(clave, nombre);
      }
    });

    if (tipos.size === 1) {
      return {
        nombre: [...tipos.values()][0].toUpperCase(),
        resolucion: 'UNICA_OPCION',
      };
    }

    return {
      nombre: 'TIPO POR DEFINIR',
      resolucion: 'POR_DEFINIR',
    };
  }

  private mostrarErrorEtiqueta(): void {
    Swal.fire({
      icon: 'warning',
      title: 'Etiqueta no disponible',
      text: 'No se encontró un código de etiqueta disponible para este recipiente.',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3085d6',
    });
  }

  // ====== Color visual del recipiente ======

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

  // ====== Nombre del paciente ======

  obtenerNombrePaciente(): string {
    const paciente = this.data.item.solicitud.paciente;

    return [
      paciente.apePatCliente,
      paciente.apeMatCliente,
      paciente.nombreCliente,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
  }
}
