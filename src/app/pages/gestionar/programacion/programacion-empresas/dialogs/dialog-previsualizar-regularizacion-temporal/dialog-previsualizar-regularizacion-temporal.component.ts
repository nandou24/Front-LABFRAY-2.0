import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';
import {
  CandidatoRegularizacionTemporal,
  PrevisualizacionRegularizacionTemporalResponse,
  RegularizarTemporalHCExistenteRequest,
  TipoDocumentoRegularizacion,
} from '../../../../../../models/Gestion/previsualizacionRegularizacionTemporal.models';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';

type FuenteCoincidencia = 'Documento actual' | 'Nombres y apellidos' | 'Historial documental';
type EstadoComparacion = 'IGUAL' | 'DIFERENTE' | 'SIN_DATO';

interface CandidatoAgrupado extends CandidatoRegularizacionTemporal {
  fuentes: FuenteCoincidencia[];
}
interface FilaIdentidad {
  campo: string;
  programado: string;
  maestro: string;
  estado: EstadoComparacion;
}

@Component({
  selector: 'app-dialog-previsualizar-regularizacion-temporal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatRadioModule, MatCheckboxModule],
  templateUrl: './dialog-previsualizar-regularizacion-temporal.component.html',
  styleUrl: './dialog-previsualizar-regularizacion-temporal.component.scss',
})
export class DialogPrevisualizarRegularizacionTemporalComponent implements OnInit, OnDestroy {
  readonly data = inject(MAT_DIALOG_DATA) as { programacion: IProgramacionEmpresa };
  private readonly dialogRef = inject(MatDialogRef<DialogPrevisualizarRegularizacionTemporalComponent>);
  private readonly service = inject(ProgramacionEmpresaService);
  private consulta?: Subscription;
  private cambios?: Subscription;
  private cambiosSeleccion?: Subscription;
  private regularizacion?: Subscription;

  readonly formulario = new FormGroup({
    tipoDoc: new FormControl<TipoDocumentoRegularizacion>('DNI', { nonNullable: true, validators: [Validators.required] }),
    nroDoc: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly seleccion = new FormControl<string | null>(null);
  readonly confirmacionExpresa = new FormControl(false, { nonNullable: true });
  readonly confirmacionDiscrepancia = new FormControl(false, { nonNullable: true });
  readonly motivoDecision = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] });
  readonly tipos: TipoDocumentoRegularizacion[] = ['DNI', 'CE', 'PASAPORTE'];
  cargando = false;
  guardando = false;
  mensajeGuardado = '';
  consultado = false;
  error = '';
  respuesta: PrevisualizacionRegularizacionTemporalResponse | null = null;
  candidatos: CandidatoAgrupado[] = [];

  get programacion(): IProgramacionEmpresa { return this.data.programacion; }
  get seleccionado(): CandidatoAgrupado | undefined {
    return this.candidatos.find(c => c.pacienteId === this.seleccion.value);
  }
  // ====== Igualar las reglas de identidad utilizadas en el Backend ======
  private normalizarNombre(valor: string | null | undefined): string {
    return String(valor ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  }

  get documentoCandidatoVigente(): boolean {
    const p = this.seleccionado;
    const doc = this.respuesta?.documento;
    if (!p || !doc) return false;
    return p.fuentes.includes('Documento actual') &&
      String(p.tipoDoc ?? '').trim().toUpperCase() === doc.tipoDoc &&
      String(p.nroDoc ?? '').trim().toUpperCase() === doc.nroDoc;
  }

  get identidadIncompatible(): boolean {
    const p = this.seleccionado;
    const q = this.respuesta?.programacion;
    if (!p || !q) return false;
    return this.normalizarNombre(p.nombreCliente) !== this.normalizarNombre(q.nombreCliente) &&
      this.normalizarNombre(p.apePatCliente) !== this.normalizarNombre(q.apePatCliente);
  }

  get tieneDiscrepancias(): boolean {
    const p = this.seleccionado;
    const q = this.respuesta?.programacion;
    if (!p || !q) return false;
    return this.normalizarNombre(p.nombreCliente) !== this.normalizarNombre(q.nombreCliente) ||
      this.normalizarNombre(p.apePatCliente) !== this.normalizarNombre(q.apePatCliente) ||
      (Boolean(this.normalizarNombre(q.apeMatCliente)) &&
        this.normalizarNombre(p.apeMatCliente) !== this.normalizarNombre(q.apeMatCliente));
  }

  get candidatoHabilitado(): boolean {
    const p = this.seleccionado;
    return Boolean(p && p.pacienteId && p.hc?.trim() && !p.identificacionPendiente &&
      this.documentoCandidatoVigente && !this.identidadIncompatible);
  }

  get puedeConfirmar(): boolean {
    const doc = this.respuesta?.documento;
    const actual = this.formulario.getRawValue();
    return Boolean(!this.guardando && !this.cargando && this.consultado && this.candidatoHabilitado &&
      this.formulario.valid && this.formatoValido && this.motivoDecision.valid &&
      doc?.tipoDoc === actual.tipoDoc && doc?.nroDoc === actual.nroDoc.trim().toUpperCase() &&
      this.confirmacionExpresa.value && (!this.tieneDiscrepancias || this.confirmacionDiscrepancia.value));
  }

  get formatoValido(): boolean {
    const { tipoDoc, nroDoc } = this.formulario.getRawValue();
    const valor = nroDoc.trim().toUpperCase();
    if (tipoDoc === 'DNI') return /^\d{8}$/.test(valor);
    if (tipoDoc === 'CE') return /^[A-Z0-9]{1,13}$/.test(valor);
    return /^[A-Z0-9]{1,16}$/.test(valor);
  }
  get mensajeFormato(): string {
    const tipo = this.formulario.controls.tipoDoc.value;
    if (tipo === 'DNI') return 'El DNI debe contener exactamente 8 dígitos.';
    if (tipo === 'CE') return 'El CE admite entre 1 y 13 letras o números.';
    return 'El pasaporte admite entre 1 y 16 letras o números.';
  }

  ngOnInit(): void {
    // ====== Descartar una búsqueda cuando cambia el documento ======
    this.cambios = this.formulario.valueChanges.subscribe(() => {
      this.consulta?.unsubscribe();
      this.cargando = false;
      this.consultado = false;
      this.error = '';
      this.respuesta = null;
      this.candidatos = [];
      this.seleccion.setValue(null);
      this.reiniciarConfirmaciones();
    });
    this.cambiosSeleccion = this.seleccion.valueChanges.subscribe(() => this.reiniciarConfirmaciones());
  }

  private reiniciarConfirmaciones(): void {
    this.confirmacionExpresa.setValue(false);
    this.confirmacionDiscrepancia.setValue(false);
    this.motivoDecision.setValue('');
    this.mensajeGuardado = '';
  }

  ngOnDestroy(): void {
    this.consulta?.unsubscribe();
    this.cambios?.unsubscribe();
    this.cambiosSeleccion?.unsubscribe();
    this.regularizacion?.unsubscribe();
  }

  consultar(): void {
    if (this.cargando || this.guardando || this.formulario.invalid || !this.formatoValido) {
      this.formulario.markAllAsTouched();
      return;
    }
    const id = this.programacion._id;
    if (!id) { this.error = 'Programación sin identificador.'; return; }
    const { tipoDoc, nroDoc } = this.formulario.getRawValue();
    this.cargando = true;
    this.consultado = false;
    this.error = '';
    this.respuesta = null;
    this.candidatos = [];
    this.seleccion.setValue(null);
    this.reiniciarConfirmaciones();
    this.consulta?.unsubscribe();
    this.consulta = this.service.previsualizarRegularizacionTemporal(id, {
      tipoDoc, nroDoc: nroDoc.trim().toUpperCase(),
    }).subscribe({
      next: respuesta => {
        this.cargando = false;
        if (!respuesta.ok || respuesta.soloLectura !== true || respuesta.programacion?._id !== id) {
          this.error = 'La respuesta no corresponde a una consulta segura de solo lectura.';
          return;
        }
        this.respuesta = respuesta;
        this.candidatos = this.agruparCandidatos(respuesta);
        this.consultado = true;
        if (this.candidatos.length === 1) this.seleccion.setValue(this.candidatos[0].pacienteId);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.error = typeof err.error?.msg === 'string'
          ? err.error.msg : 'No se pudo consultar el documento. Intenta nuevamente.';
      },
    });
  }

  private agruparCandidatos(respuesta: PrevisualizacionRegularizacionTemporalResponse): CandidatoAgrupado[] {
    const unicos = new Map<string, CandidatoAgrupado>();
    const agregar = (candidatos: CandidatoRegularizacionTemporal[], fuente: FuenteCoincidencia) => {
      for (const candidato of candidatos ?? []) {
        const existente = unicos.get(candidato.pacienteId);
        if (existente) {
          if (!existente.fuentes.includes(fuente)) existente.fuentes.push(fuente);
        } else {
          unicos.set(candidato.pacienteId, { ...candidato, fuentes: [fuente] });
        }
      }
    };
    agregar(respuesta.porDocumento, 'Documento actual');
    agregar(respuesta.porNombres, 'Nombres y apellidos');
    agregar(respuesta.porHistorialDocumento, 'Historial documental');
    return Array.from(unicos.values());
  }

  nombreCompleto(p: CandidatoRegularizacionTemporal): string {
    return [p.apePatCliente, p.apeMatCliente, p.nombreCliente].filter(Boolean).join(' ');
  }
  nombreProgramado(): string {
    const p = this.respuesta?.programacion ?? this.programacion;
    return [p.apePatCliente, p.apeMatCliente, p.nombreCliente].filter(Boolean).join(' ');
  }
  filasSeleccionado(): FilaIdentidad[] {
    const p = this.seleccionado;
    const q = this.respuesta?.programacion;
    if (!p || !q) return [];
    const doc = this.respuesta!.documento;
    return [
      this.fila('Tipo de documento', doc.tipoDoc, p.tipoDoc),
      this.fila('Nº documento', doc.nroDoc, p.nroDoc),
      this.fila('Nombres', q.nombreCliente, p.nombreCliente),
      this.fila('Apellido paterno', q.apePatCliente, p.apePatCliente),
      this.fila('Apellido materno', q.apeMatCliente, p.apeMatCliente),
      this.fila('Sexo', this.programacion.sexoCliente, p.sexoCliente),
      this.fila('Fecha de nacimiento', this.fechaVisible(this.programacion.fechaNacimiento), this.fechaVisible(p.fechaNacimiento)),
    ];
  }
  private fechaVisible(valor: string | Date | null | undefined): string {
    if (!valor) return '';
    const fecha = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    const iso = typeof valor === 'string' ? /^(\d{4})-(\d{2})-(\d{2})/.exec(valor) : null;
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}/${fecha.getUTCFullYear()}`;
  }

  private fila(campo: string, programado: string | null | undefined, maestro: string | null | undefined): FilaIdentidad {
    const a = (programado ?? '').trim();
    const b = (maestro ?? '').trim();
    const normalizar = (valor: string) => valor.trim().toUpperCase().replace(/\s+/g, ' ');
    return { campo, programado: a || 'No informado', maestro: b || 'No informado',
      estado: !a || !b ? 'SIN_DATO' : normalizar(a) === normalizar(b) ? 'IGUAL' : 'DIFERENTE' };
  }

  // ====== Revalidar en el Backend antes de confirmar la vinculación ======
  async confirmarRegularizacion(): Promise<void> {
    const elegido = this.seleccionado;
    if (!this.puedeConfirmar || !this.respuesta || !elegido) return;
    // ====== Capturar HC definitiva no nula antes de abrir el modal asíncrono ======
    const hcConfirmada = elegido.hc?.trim();
    if (!hcConfirmada) return;
    const id = this.programacion._id;
    if (!id) return;
    const documento = { ...this.respuesta.documento };
    const pacienteId = elegido.pacienteId;
    const motivoDecision = this.motivoDecision.value.trim();
    const confirmacionDiscrepancia = this.tieneDiscrepancias;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Confirmar identidad y HC definitiva',
      text: `Se vinculará ${this.nombreProgramado()} con la HC ${hcConfirmada} (${documento.tipoDoc} ${documento.nroDoc}). La programación y sus solicitudes dejarán de ser temporales. Esta acción quedará auditada.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, regularizar identidad',
      cancelButtonText: 'Volver a revisar',
      confirmButtonColor: '#0864c5',
      reverseButtons: true,
    });
    if (!confirmacion.isConfirmed || !this.puedeConfirmar ||
        this.seleccionado?.pacienteId !== pacienteId ||
        this.seleccionado?.hc?.trim() !== hcConfirmada) return;

    const datos: RegularizarTemporalHCExistenteRequest = {
      ...documento, pacienteId, hcConfirmada, confirmacionExpresa: true,
      confirmacionDiscrepancia: confirmacionDiscrepancia && this.confirmacionDiscrepancia.value,
      ...(motivoDecision ? { motivoDecision } : {}),
    };
    this.guardando = true;
    this.error = '';
    this.mensajeGuardado = '';
    this.regularizacion?.unsubscribe();
    this.regularizacion = this.service.regularizarTemporalHCExistente(id, datos).subscribe({
      next: respuesta => {
        if (!respuesta.ok || respuesta.codigo !== 'REGULARIZACION_COMPLETADA') {
          this.guardando = false;
          this.mensajeGuardado = 'La operación no confirmó la regularización.';
          return;
        }
        Swal.fire({
          icon: 'success', title: 'Identidad regularizada',
          text: `HC ${respuesta.programacion.hc} vinculada. Las solicitudes existentes se conservaron.`,
          confirmButtonText: 'Entendido',
        }).then(() => this.dialogRef.close({ actualizado: true, programacion: respuesta.programacion }));
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        const codigo = typeof err.error?.codigo === 'string' ? `${err.error.codigo}: ` : '';
        this.mensajeGuardado = codigo + (typeof err.error?.msg === 'string'
          ? err.error.msg : 'No se pudo completar la regularización. Los datos no deben haberse modificado.');
      },
    });
  }

  cerrar(): void {
    if (!this.guardando) this.dialogRef.close();
  }
}
