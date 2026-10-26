import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IProgramacionEmpresa } from '../../../../../../models/Gestion/programacionEmpresa.models';
import { ProgramacionEmpresaService } from '../../../../../../services/gestion/programacion/programacionEmpresas/programacion-empresa.service';
import { FotoPacienteMiniaturaComponent } from '../../../../../../shared/components/foto-paciente-miniatura/foto-paciente-miniatura.component';
import { DialogHistorialVinculacionComponent } from '../dialog-historial-vinculacion/dialog-historial-vinculacion.component';

interface CandidatoVinculacion {
  pacienteId: string;
  hc: string | null;
  tipoDoc: string | null;
  nroDoc: string | null;
  nombreCliente: string;
  apePatCliente: string;
  apeMatCliente: string;
  fechaNacimiento?: string | null;
  sexoCliente?: string | null;
  documentoExacto: boolean;
  nombresExactos: boolean;
  identificacionPendiente: boolean;
  vinculacionPermitida: boolean;
  tipoCoincidencia: string;
  fotoReferencia?: {programacionEmpresaId: string | null; solicitudAtencionId: string | null; fechaCaptura: string} | null;
}

type EstadoComparacion = 'coincide' | 'diferente' | 'sin-dato' | 'informativo' | 'faltante';
type Decision = 'MISMO' | 'DISTINTO' | 'PENDIENTE';
interface FilaComparacion {
  etiqueta: string;
  programacion: string;
  paciente: string;
  estado: EstadoComparacion;
  detalle: string;
}
interface CandidatoComparado extends CandidatoVinculacion {
  filas: FilaComparacion[];
}

@Component({
  selector: 'app-dialog-coincidencias-vinculacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatIconModule, MatRadioModule, MatCheckboxModule, MatInputModule,
    MatFormFieldModule, MatProgressSpinnerModule, FotoPacienteMiniaturaComponent],
  templateUrl: './dialog-coincidencias-vinculacion.component.html',
  styleUrl: './dialog-coincidencias-vinculacion.component.scss',
})
export class DialogCoincidenciasVinculacionComponent implements OnInit {
  readonly data = inject(MAT_DIALOG_DATA) as { programacion: IProgramacionEmpresa };
  private readonly dialogRef = inject(MatDialogRef<DialogCoincidenciasVinculacionComponent>);
  private readonly service = inject(ProgramacionEmpresaService);
  private readonly dialog = inject(MatDialog);

  readonly seleccion = new FormControl<string | null>(null);
  readonly decision = new FormControl<Decision | null>(null);
  readonly motivo = new FormControl('', [Validators.maxLength(300)]);
  readonly confirmacionExpresa = new FormControl(false, { nonNullable: true });
  porDocumento: CandidatoComparado[] = [];
  porNombres: CandidatoComparado[] = [];
  unicos: CandidatoComparado[] = [];
  vinculada = false;
  cargando = true;
  guardando = false;
  mensajeError = '';
  aviso = '';
  readonly idsPorDocumento = new Set<string>();
  readonly idsPorNombres = new Set<string>();

  get programacion(): IProgramacionEmpresa { return this.data.programacion; }
  get seleccionado(): CandidatoComparado | undefined {
    return this.unicos.find(c => c.pacienteId === this.seleccion.value);
  }
  get totalPacientesUnicos(): number { return this.unicos.length; }
  get puedeConfirmar(): boolean {
    if (this.cargando || this.guardando || this.vinculada || !this.seleccionado || !this.decision.value) return false;
    if (this.decision.value === 'MISMO') {
      if (!this.seleccionado.documentoExacto || this.seleccionado.identificacionPendiente || !this.seleccionado.hc) return false;
      if (!this.seleccionado.nombresExactos && !this.confirmacionExpresa.value) return false;
    }
    return this.motivo.valid && (this.motivo.value?.trim().length ?? 0) <= 300;
  }

  ngOnInit(): void {
    const id = this.programacion._id;
    if (!id) { this.cargando = false; this.mensajeError = 'Programación sin identificador.'; return; }
    this.service.consultarCoincidenciasVinculacion(id).subscribe({
      next: respuesta => {
        this.porDocumento = (respuesta.porDocumento ?? []).map(c => this.prepararComparacion(c));
        this.porNombres = (respuesta.porNombres ?? []).map(c => this.prepararComparacion(c));
        this.idsPorDocumento.clear(); this.idsPorNombres.clear();
        this.porDocumento.forEach(c => this.idsPorDocumento.add(c.pacienteId));
        this.porNombres.forEach(c => this.idsPorNombres.add(c.pacienteId));
        this.unicos = [...new Map([...this.porDocumento, ...this.porNombres]
          .map(c => [c.pacienteId, c] as const)).values()];
        this.vinculada = respuesta.vinculada;
        if (this.unicos.length === 1) {
          this.seleccion.setValue(this.unicos[0].pacienteId);
          if (this.unicos[0].vinculacionPermitida && !this.vinculada) this.decision.setValue('MISMO');
        }
        this.cargando = false;
      },
      error: e => { this.mensajeError = e.error?.msg || 'No se pudieron consultar las coincidencias.'; this.cargando = false; },
    });
  }

  nombrePaciente(c: CandidatoVinculacion): string {
    return [c.apePatCliente, c.apeMatCliente, c.nombreCliente].filter(Boolean).join(' ');
  }
  cambiarSeleccion(id: string | null): void {
    this.seleccion.setValue(id);
    this.decision.setValue(null);
    this.motivo.setValue('');
    this.confirmacionExpresa.setValue(false);
    this.mensajeError = '';
    this.aviso = '';
    const c = this.seleccionado;
    if (c?.vinculacionPermitida && !this.vinculada) this.decision.setValue('MISMO');
  }
  cambiarDecision(decision: Decision | null): void {
    this.decision.setValue(decision);
    this.confirmacionExpresa.setValue(false);
    this.motivo.setValue('');
    this.aviso = '';
  }

  private fechaTexto(valor: Date | string | null | undefined): string {
    if (!valor) return '';
    const iso = typeof valor === 'string' ? valor.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '';
    return `${String(fecha.getUTCDate()).padStart(2, '0')}/${String(fecha.getUTCMonth() + 1).padStart(2, '0')}/${fecha.getUTCFullYear()}`;
  }
  private normalizar(valor: string): string {
    return valor.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
  }
  private construirFila(etiqueta: string, a: string | null | undefined, b: string | null | undefined): FilaComparacion {
    const programacion = String(a ?? '').trim();
    const paciente = String(b ?? '').trim();
    if (!programacion || !paciente) {
      const faltaEnProgramacion = !programacion && !!paciente &&
        ['Nombres', 'Apellido paterno', 'Apellido materno'].includes(etiqueta);
      return { etiqueta, programacion:programacion || 'No informado', paciente:paciente || 'No registrado',
        estado: faltaEnProgramacion ? 'faltante' : 'sin-dato',
        detalle:faltaEnProgramacion ? `${etiqueta} faltante en la programación` : 'Sin datos para comparar' };
    }
    const coincide = this.normalizar(programacion) === this.normalizar(paciente);
    return { etiqueta, programacion, paciente,
      estado:coincide ? 'coincide' : 'diferente',
      detalle:coincide ? `${etiqueta} coincide` : `${etiqueta} diferente: revisar` };
  }
  private prepararComparacion(c: CandidatoVinculacion): CandidatoComparado {
    const p = this.programacion;
    const documentoP = p.nroDoc ? `${p.tipoDoc ?? ''} ${p.nroDoc}` : '';
    const documentoC = c.nroDoc ? `${c.tipoDoc ?? ''} ${c.nroDoc}` : '';
    return { ...c, filas: [
      { etiqueta:'Historia clínica', programacion:p.hc || 'Sin HC vinculada', paciente:c.hc || 'Sin HC',
        estado:c.hc ? 'informativo' : 'diferente', detalle:c.hc ? 'HC registrada' : 'Paciente sin HC' },
      this.construirFila('Documento', documentoP, documentoC),
      this.construirFila('Nombres', p.nombreCliente, c.nombreCliente),
      this.construirFila('Apellido paterno', p.apePatCliente, c.apePatCliente),
      this.construirFila('Apellido materno', p.apeMatCliente, c.apeMatCliente),
      this.construirFila('Fecha de nacimiento', this.fechaTexto(p.fechaNacimiento), this.fechaTexto(c.fechaNacimiento)),
      this.construirFila('Sexo', p.sexoCliente, c.sexoCliente),
    ] };
  }

  confirmarDecision(): void {
    const id = this.programacion._id;
    const c = this.seleccionado;
    const decision = this.decision.value;
    if (!id || !c || !decision || !this.puedeConfirmar) return;
    this.guardando = true;
    this.mensajeError = '';
    if (decision === 'MISMO') {
      const motivoDecision = this.motivo.value?.trim() ?? '';
      const revision = c.nombresExactos && !motivoDecision ? undefined : {
        confirmacionExpresa: this.confirmacionExpresa.value,
        motivoDecision,
      };
      this.service.vincularPacienteInicial(id, c.pacienteId, revision).subscribe({
        next: respuesta => { this.guardando = false; this.dialogRef.close({ ok:true, programacion:respuesta.programacion }); },
        error: e => { this.guardando = false; this.mensajeError = e.error?.msg || 'No se pudo vincular la HC.'; },
      });
    } else {
      this.service.registrarRevisionCoincidencia(id, {
        pacienteId:c.pacienteId, decision, motivo:this.motivo.value?.trim() || null,
      }).subscribe({
        next: r => { this.guardando = false; this.dialogRef.close({ ok:false, revisionRegistrada:true, mensaje:r.msg }); },
        error: e => { this.guardando = false; this.mensajeError = e.error?.msg || 'No se pudo registrar la decisión.'; },
      });
    }
  }

  verHistorial(): void {
    this.dialog.open(DialogHistorialVinculacionComponent, {
      width:'94vw', maxWidth:'900px', maxHeight:'90vh', autoFocus:false,
      data:{programacion:this.programacion},
    });
  }
  cerrar(): void { if (!this.guardando) this.dialogRef.close(); }
}
