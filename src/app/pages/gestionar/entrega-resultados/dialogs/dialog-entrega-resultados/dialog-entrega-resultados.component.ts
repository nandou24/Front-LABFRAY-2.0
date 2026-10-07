import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

import {
  IInformeEntregable,
  IItemInformeEntrega,
  IPruebaInformeEntrega,
  IReferenciaAplicadaEntrega,
} from '../../../../../models/Gestion/entregaResultadoLaboratorio.models';
import { EntregaResultadosService } from '../../../../../services/gestion/entregaResultados/entrega-resultados.service';
import { InformeLaboratorioPdfService } from '../../../../../services/utilitarios/pdf/laboratorio/informe-laboratorio-pdf.service';

export interface IDialogEntregaData {
  solicitudAtencionId: string;
}

@Component({
  selector: 'app-dialog-entrega-resultados',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './dialog-entrega-resultados.component.html',
  styleUrl: './dialog-entrega-resultados.component.scss',
})
export class DialogEntregaResultadosComponent implements OnInit {
  readonly data = inject<IDialogEntregaData>(MAT_DIALOG_DATA);

  private readonly _ref = inject(MatDialogRef<DialogEntregaResultadosComponent>);
  private readonly _service = inject(EntregaResultadosService);
  private readonly _pdf = inject(InformeLaboratorioPdfService);
  private readonly _snack = inject(MatSnackBar);
  private readonly _fb = inject(FormBuilder);

  cargando = false;
  procesando = false;
  generandoPdf = false;
  mostrarRegistroEntrega = false;
  informe: IInformeEntregable | null = null;
  seleccionados = new Set<string>();

  readonly incluirLogoImpresion = this._fb.nonNullable.control(true);

  readonly formEntrega = this._fb.nonNullable.group({
    receptorNombre: ['', [Validators.maxLength(180)]],
    medio: [
      'PRESENCIAL' as 'PRESENCIAL' | 'WHATSAPP' | 'CORREO' | 'OTRO',
    ],
    observacion: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  get resultadosSeleccionados(): IPruebaInformeEntrega[] {
    return (this.informe?.resultados || []).filter((resultado) =>
      this.seleccionados.has(resultado._id),
    );
  }

  get tipoEntregaPreparada(): 'PARCIAL' | 'FINAL' {
    return this.seleccionados.size > 0 &&
      this.seleccionados.size === this.informe?.resumen.totalPruebas
      ? 'FINAL'
      : 'PARCIAL';
  }

  get puedeGenerarInforme(): boolean {
    return !!this.informe && !this.cargando && !!this.seleccionados.size;
  }

  cambiarSeleccion(id: string, marcado: boolean): void {
    const siguiente = new Set(this.seleccionados);

    if (marcado) {
      siguiente.add(id);
    } else {
      siguiente.delete(id);
    }

    this.seleccionados = siguiente;
  }

  seleccionarTodas(): void {
    this.seleccionados = new Set(
      (this.informe?.resultados || []).map((resultado) => resultado._id),
    );
  }

  desmarcarTodas(): void {
    this.seleccionados = new Set<string>();
  }

  cerrar(): void {
    if (!this.procesando && !this.generandoPdf) {
      this._ref.close();
    }
  }

  cargar(): void {
    this.cargando = true;

    this._service
      .obtenerInforme(this.data.solicitudAtencionId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (informe) => {
          this.informe = informe;
          this.seleccionados = new Set(
            informe.resultados.map((resultado) => resultado._id),
          );

          const receptorActual = this.formEntrega.controls.receptorNombre.value;
          if (!receptorActual.trim()) {
            this.formEntrega.patchValue({
              receptorNombre: informe.solicitud.paciente.nombreCompleto || '',
            });
          }
        },
        error: (err) =>
          this._snack.open(
            err.error?.msg || 'No se pudo consultar el informe',
            'Cerrar',
            { duration: 4500 },
          ),
      });
  }

  // ====== Indicadores clínicos compactos ======
  indicadorDireccion(item: IItemInformeEntrega): 'ALTO' | 'BAJO' | '' {
    const estado = item.evaluacionReferencia?.estado || '';
    const aplicada = item.evaluacionReferencia?.referenciaAplicada ?? null;
    const descripcion = String(aplicada?.descripcion ?? '').trim().toUpperCase();

    // ====== Normal no lleva indicador ======
    if (/\b(NORMAL|DESEABLE)\b/.test(descripcion)) return '';

    if (estado === 'ALTO') return 'ALTO';
    if (estado === 'BAJO') return 'BAJO';

    // ====== Resolver desvío respecto de la banda normal ======
    const direccionPorNormal = this.direccionRespectoReferenciaNormal(item);
    if (direccionPorNormal) return direccionPorNormal;

    if (/\b(ALTO|ELEVADO|INTERMEDIO|L[IÍ]MITE ALTO|CR[IÍ]TICO)\b/.test(descripcion)) {
      return 'ALTO';
    }
    if (/\b(BAJO|DISMINUIDO|L[IÍ]MITE BAJO)\b/.test(descripcion)) return 'BAJO';

    return '';
  }

  private direccionRespectoReferenciaNormal(
    item: IItemInformeEntrega,
  ): 'ALTO' | 'BAJO' | '' {
    const valor = Number(item.valor);
    if (!Number.isFinite(valor)) return '';

    const normales = (item.referenciasConfiguradas || []).filter((referencia) =>
      /\b(NORMAL|DESEABLE)\b/.test(
        String(referencia.descripcion ?? '').trim().toUpperCase(),
      ),
    );

    for (const referencia of normales) {
      const direccion = this.compararConReferenciaNormal(valor, referencia);
      if (direccion) return direccion;
    }

    return '';
  }

  private compararConReferenciaNormal(
    valor: number,
    referencia: IReferenciaAplicadaEntrega,
  ): 'ALTO' | 'BAJO' | '' {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'RANGO') {
      const minimo = Number(referencia.valorMin);
      const maximo = Number(referencia.valorMax);
      if (Number.isFinite(minimo) && valor < minimo) return 'BAJO';
      if (Number.isFinite(maximo) && valor > maximo) return 'ALTO';
      return '';
    }

    const limite = Number(referencia.valorLimite);
    if (!Number.isFinite(limite)) return '';

    if (tipo === 'MENOR_QUE') return valor >= limite ? 'ALTO' : '';
    if (tipo === 'MENOR_IGUAL_QUE') return valor > limite ? 'ALTO' : '';
    if (tipo === 'MAYOR_QUE') return valor <= limite ? 'BAJO' : '';
    if (tipo === 'MAYOR_IGUAL_QUE') return valor < limite ? 'BAJO' : '';

    return '';
  }

  indicadorIcono(item: IItemInformeEntrega): 'arrow_upward' | 'arrow_downward' | '' {
    const direccion = this.indicadorDireccion(item);

    if (direccion === 'ALTO') return 'arrow_upward';
    if (direccion === 'BAJO') return 'arrow_downward';

    return '';
  }

  fueraReferencia(item: IItemInformeEntrega): boolean {
    const estado = item.evaluacionReferencia?.estado || '';

    return (
      !!this.indicadorDireccion(item) ||
      ['FUERA_REFERENCIA', 'VALOR_NO_PERMITIDO'].includes(estado)
    );
  }

  referenciasItem(item: IItemInformeEntrega): string[] {
    const configuradas = item.referenciasConfiguradas || [];

    if (configuradas.length) {
      return configuradas
        .map((referencia) => this.formatearReferencia(referencia, true))
        .filter(Boolean);
    }

    const aplicada = item.evaluacionReferencia?.referenciaAplicada;
    if (!aplicada) return [];

    const texto = this.formatearReferencia(aplicada, true);
    return texto ? [texto] : [];
  }

  private formatearReferencia(
    referencia: IReferenciaAplicadaEntrega,
    incluirDescripcion: boolean,
  ): string {
    const descripcion = String(referencia.descripcion || '').trim();
    let valor = '';

    switch (referencia.tipoReferencia) {
      case 'RANGO':
        if (this.tieneNumero(referencia.valorMin) && this.tieneNumero(referencia.valorMax)) {
          valor = `${referencia.valorMin} - ${referencia.valorMax}`;
        }
        break;

      case 'MENOR_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `< ${referencia.valorLimite}`;
        break;

      case 'MENOR_IGUAL_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `≤ ${referencia.valorLimite}`;
        break;

      case 'MAYOR_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `> ${referencia.valorLimite}`;
        break;

      case 'MAYOR_IGUAL_QUE':
        if (this.tieneNumero(referencia.valorLimite)) valor = `≥ ${referencia.valorLimite}`;
        break;

      case 'VALORES_PERMITIDOS':
        valor = (referencia.valoresPermitidos || []).join(', ');
        break;

      case 'TEXTO':
        valor = String(referencia.textoReferencia || '').trim();
        break;
    }

    if (incluirDescripcion && descripcion && valor) return `${descripcion}: ${valor}`;
    return valor || descripcion;
  }

  private tieneNumero(valor: number | null | undefined): valor is number {
    return valor !== null && valor !== undefined && Number.isFinite(Number(valor));
  }

  tieneCritica(item: IItemInformeEntrega): boolean {
    return (item.alertasDetectadas || []).some(
      (alerta) => alerta.nivelAlerta === 'CRITICA',
    );
  }

  // ====== Imprimir informe ======
  async imprimirInforme(): Promise<void> {
    if (!this.informe || !this.resultadosSeleccionados.length || this.generandoPdf) {
      return;
    }

    this.generandoPdf = true;

    try {
      await this._pdf.imprimir(
        this.informe,
        this.resultadosSeleccionados,
        this.incluirLogoImpresion.value,
      );
    } catch (error) {
      console.error('Error al generar informe de laboratorio:', error);
      this._snack.open('No se pudo generar el informe para impresión', 'Cerrar', {
        duration: 4500,
      });
    } finally {
      this.generandoPdf = false;
    }
  }

  // ====== Descargar PDF ======
  async descargarInforme(): Promise<void> {
    if (!this.informe || !this.resultadosSeleccionados.length || this.generandoPdf) {
      return;
    }

    this.generandoPdf = true;

    try {
      await this._pdf.descargar(
        this.informe,
        this.resultadosSeleccionados,
      );
    } catch (error) {
      console.error('Error al descargar informe de laboratorio:', error);
      this._snack.open('No se pudo generar el PDF', 'Cerrar', { duration: 4500 });
    } finally {
      this.generandoPdf = false;
    }
  }

  // ====== Registro administrativo opcional ======
  alternarRegistroEntrega(): void {
    this.mostrarRegistroEntrega = !this.mostrarRegistroEntrega;
  }

  medioTexto(
    medio: 'PRESENCIAL' | 'WHATSAPP' | 'CORREO' | 'OTRO',
  ): string {
    const etiquetas = {
      PRESENCIAL: 'Presencial',
      WHATSAPP: 'WhatsApp',
      CORREO: 'Correo',
      OTRO: 'Otro',
    } as const;

    return etiquetas[medio];
  }

  // ====== Registrar solo si Recepción desea dejar constancia ======
  async registrarEntrega(): Promise<void> {
    if (
      !this.informe ||
      this.procesando ||
      this.formEntrega.invalid ||
      !this.seleccionados.size
    ) {
      this.formEntrega.markAllAsTouched();
      return;
    }

    const { receptorNombre, medio, observacion } =
      this.formEntrega.getRawValue();

    const receptorFinal =
      receptorNombre.trim() || this.informe.solicitud.paciente.nombreCompleto;

    // ====== Evitar que Escape cierre el diálogo detrás del SweetAlert ======
    this._ref.disableClose = true;
    let confirmacion;

    try {
      confirmacion = await Swal.fire({
        icon: 'question',
        title: `Registrar entrega ${this.tipoEntregaPreparada.toLowerCase()}`,
        text: `Se dejará constancia de ${this.seleccionados.size} resultado(s) por ${this.medioTexto(medio)}.`,
        showCancelButton: true,
        confirmButtonText: 'Registrar entrega',
        cancelButtonText: 'Cancelar',
        allowEscapeKey: true,
        allowEnterKey: true,
      });
    } finally {
      this._ref.disableClose = false;
    }

    if (!confirmacion?.isConfirmed) return;

    this.procesando = true;

    this._service
      .registrarEntrega(this.informe.solicitud.solicitudAtencionId, {
        resultadosIds: [...this.seleccionados],
        receptorNombre: receptorFinal,
        medio,
        observacion: observacion.trim(),
      })
      .pipe(finalize(() => (this.procesando = false)))
      .subscribe({
        next: (resp) => {
          this._snack.open(
            `${resp.msg}. ${resp.pruebasEntregadas} prueba(s).`,
            'Cerrar',
            { duration: 4500 },
          );

          this.mostrarRegistroEntrega = false;
          this.cargar();
        },
        error: (err) =>
          this._snack.open(
            err.error?.msg || 'No se pudo registrar la entrega',
            'Cerrar',
            { duration: 5000 },
          ),
      });
  }
}
