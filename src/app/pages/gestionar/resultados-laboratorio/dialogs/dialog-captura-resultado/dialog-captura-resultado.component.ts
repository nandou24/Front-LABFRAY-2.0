import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnDestroy } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  distinctUntilChanged,
  firstValueFrom,
  merge,
  Observable,
  Subscription,
} from 'rxjs';
import Swal from 'sweetalert2';

import { IEstadoOperativoSolicitud } from '../../../../../models/Gestion/estadoOperativoSolicitud.models';
import {
  FormatoCapturaNumericaLaboratorio,
  IAlertaDetectada,
  IEvaluacionReferencia,
  IHabilitacionMuestraResultado,
  IReferenciaAplicada,
  IReferenciaResultadoSnapshot,
  IRegistrarResultadosMasivosResponse,
  IReglaAlertaSnapshot,
  IResultadoLaboratorio,
  IResultadoLaboratorioItem,
  ValorResultadoLaboratorio,
} from '../../../../../models/Gestion/resultadoLaboratorio.models';
import { ResultadoLaboratorioService } from '../../../../../services/gestion/resultadosLaboratorio/resultados-laboratorio.service';

export interface IPacienteRegistroResultadoDialog {
  nombreCompleto: string;
  documento: string;
  hc: string;
  sexoPaciente: string | null;
  fechaNacimientoPaciente: string | null;
}

export type ModoDialogResultado =
  | 'REGISTRO'
  | 'VALIDACION'
  | 'ANULACION'
  | 'CONSULTA';

export interface IRegistroResultadoDialogData {
  resultados: IResultadoLaboratorio[];
  indiceInicial: number;
  paciente: IPacienteRegistroResultadoDialog;
  fechaReferencia: string;
  soloLecturaForzada?: boolean;
  modo?: ModoDialogResultado;
  puedeRegistrar?: boolean;
  puedeValidar?: boolean;
  puedeAnular?: boolean;
}

export interface IRegistroResultadoDialogResult {
  huboCambios: true;
  resultadosActualizados: IResultadoLaboratorio[];
  estadoSolicitud: string;
  estadoOperativo: IEstadoOperativoSolicitud;
}

interface IHallazgoResultadoForm {
  hallazgo: FormControl<string>;
  formatoNumerico: FormControl<FormatoCapturaNumericaLaboratorio>;
  valor: FormControl<string | number | null>;
  valorDesde: FormControl<number | null>;
  valorHasta: FormControl<number | null>;
}

interface IItemResultadoForm {
  itemResultadoId: FormControl<string>;
  selectorResultado: FormControl<string>;
  selectorCualitativoNumerico: FormControl<string>;
  formatoNumerico: FormControl<FormatoCapturaNumericaLaboratorio>;
  valor: FormControl<string | number | null>;
  valorDesde: FormControl<number | null>;
  valorHasta: FormControl<number | null>;
  modoEstructurado: FormControl<string>;
  hallazgosEstructurados: FormArray<FormGroup<IHallazgoResultadoForm>>;
  observacionActiva: FormControl<boolean>;
  observacion: FormControl<string>;
}

interface IBorradorItemResultado {
  valor: ValorResultadoLaboratorio;
  observacionActiva: boolean;
  observacion: string;
}

interface IIntervaloNumericoLocal {
  minimo: number;
  maximo: number;
  incluyeMinimo: boolean;
  incluyeMaximo: boolean;
}

interface IEvaluacionLocalItem {
  valorNormalizado: Exclude<ValorResultadoLaboratorio, null>;
  evaluacionReferencia: IEvaluacionReferencia;
  alertasDetectadas: IAlertaDetectada[];
}

@Component({
  selector: 'app-dialog-captura-resultado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './dialog-captura-resultado.component.html',
  styleUrl: './dialog-captura-resultado.component.scss',
})
export class DialogCapturaResultadoComponent implements OnDestroy {
  readonly data = inject<IRegistroResultadoDialogData>(MAT_DIALOG_DATA);

  private readonly _dialogRef = inject(
    MatDialogRef<DialogCapturaResultadoComponent>,
  );

  private readonly _fb = inject(FormBuilder);

  private readonly _snackBar = inject(MatSnackBar);

  // ====== Teclado estándar en confirmaciones ======
  private readonly _swal = Swal.mixin({
    allowEnterKey: true,
    allowEscapeKey: true,
    keydownListenerCapture: true,
    didOpen: (popup) => {
      popup.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || event.shiftKey) {
          return;
        }

        const target = event.target as HTMLElement | null;

        if (target?.tagName === 'TEXTAREA') {
          event.preventDefault();
          Swal.clickConfirm();
        }
      });
    },
  });

  private readonly _resultadoLaboratorioService = inject(
    ResultadoLaboratorioService,
  );

  private readonly _suscripcionesEvaluacion: Subscription[] = [];

  private readonly _borradores = new Map<string, IBorradorItemResultado[]>();

  private readonly _previsualizaciones = new Map<
    string,
    IEvaluacionLocalItem
  >();

  private readonly _erroresPrevisualizacion = new Map<string, string>();

  private readonly _itemsModificados = new Set<string>();

  private readonly _resultadosActualizados = new Map<
    string,
    IResultadoLaboratorio
  >();

  readonly resultados = this.data.resultados.map((resultado) => ({
    ...resultado,
    resultadosItems: resultado.resultadosItems.map((item) => ({
      ...item,
      evaluacionReferencia: item.evaluacionReferencia
        ? { ...item.evaluacionReferencia }
        : item.evaluacionReferencia,
      alertasDetectadas: Array.isArray(item.alertasDetectadas)
        ? item.alertasDetectadas.map((alerta) => ({ ...alerta }))
        : [],
    })),
  }));

  indiceActual = Math.min(
    Math.max(Number(this.data.indiceInicial ?? 0), 0),
    Math.max(this.resultados.length - 1, 0),
  );

  itemActivoIndex: number | null = null;

  modoActual: ModoDialogResultado =
    this.data.modo ?? (this.data.soloLecturaForzada ? 'CONSULTA' : 'REGISTRO');

  readonly valorOtroResultado = '__OTRO_RESULTADO__';

  private readonly _seleccionRegistro = new Set<string>();

  private readonly _seleccionValidacion = new Set<string>(
    this.modoActual === 'VALIDACION' &&
    this.resultados[this.indiceActual]?.estadoResultado === 'COMPLETO'
      ? [this.resultados[this.indiceActual]._id]
      : [],
  );

  procesando = false;

  ultimoEstadoSolicitud: string | null = null;
  ultimoEstadoOperativo: IEstadoOperativoSolicitud | null = null;

  formResultado = this.crearFormularioActual();

  get resultadoActual(): IResultadoLaboratorio {
    return this.resultados[this.indiceActual];
  }

  get totalPruebas(): number {
    return this.resultados.length;
  }

  get numeroPruebaActual(): number {
    return this.indiceActual + 1;
  }

  get esModoRegistro(): boolean {
    return this.modoActual === 'REGISTRO';
  }

  get esModoValidacion(): boolean {
    return this.modoActual === 'VALIDACION';
  }

  get esModoAnulacion(): boolean {
    return this.modoActual === 'ANULACION';
  }

  get tituloDialogo(): string {
    if (this.esModoValidacion) {
      return 'Revisión y validación de resultados';
    }

    if (this.esModoAnulacion) {
      return 'Revisión para anulación';
    }

    if (this.esModoRegistro) {
      return 'Registro de resultados';
    }

    return 'Detalle de resultados';
  }

  get soloLectura(): boolean {
    if (this.data.soloLecturaForzada === true) {
      return true;
    }

    if (this.esModoAnulacion || this.modoActual === 'CONSULTA') {
      return true;
    }

    if (this.esModoValidacion) {
      return this.resultadoActual?.estadoResultado !== 'COMPLETO';
    }

    return !this.esResultadoEditable(this.resultadoActual);
  }

  // ====== Datos de autorización de la anulación ======
  get autorizacionAnulacionActual(): {
    usuario: string | null;
    rol: string | null;
    fecha: string | null;
  } {
    const datos = this.resultadoActual as IResultadoLaboratorio & {
      usuarioAutorizacionAnulacion?: string | null;
      rolAutorizacionAnulacion?: string | null;
      fechaAutorizacionAnulacion?: string | null;
    };

    return {
      usuario: datos.usuarioAutorizacionAnulacion ?? null,
      rol: datos.rolAutorizacionAnulacion ?? null,
      fecha: datos.fechaAutorizacionAnulacion ?? null,
    };
  }

  get habilitacionMuestraActual(): IHabilitacionMuestraResultado | null {
    return this.resultadoActual?.habilitacionMuestra ?? null;
  }

  get puedeEditarActual(): boolean {
    if (this.data.soloLecturaForzada === true) {
      return false;
    }

    if (this.esModoValidacion) {
      return (
        this.data.puedeValidar === true &&
        this.resultadoActual?.estadoResultado === 'COMPLETO' &&
        this.habilitacionMuestraActual?.habilitada !== false
      );
    }

    return (
      this.esModoRegistro &&
      this.data.puedeRegistrar !== false &&
      this.esResultadoEditable(this.resultadoActual) &&
      this.habilitacionMuestraActual?.habilitada !== false
    );
  }

  get puedeValidarActual(): boolean {
    return (
      this.esModoValidacion &&
      this.data.puedeValidar === true &&
      this.resultadoActual?.estadoResultado === 'COMPLETO'
    );
  }

  // ====== Selección para registro múltiple ======

  get cantidadCompletosRegistrables(): number {
    return this.resultados.filter((resultado, indice) =>
      this.puedeSeleccionarParaRegistro(resultado, indice),
    ).length;
  }

  get cantidadSeleccionadosRegistro(): number {
    return this.resultados.filter(
      (resultado, indice) =>
        this._seleccionRegistro.has(resultado._id) &&
        this.puedeSeleccionarParaRegistro(resultado, indice),
    ).length;
  }

  estaSeleccionadoParaRegistrar(resultado: IResultadoLaboratorio): boolean {
    return this._seleccionRegistro.has(resultado._id);
  }

  cambiarSeleccionRegistro(
    resultado: IResultadoLaboratorio,
    seleccionado: boolean,
  ): void {
    this.guardarBorradorActual();

    const indice = this.resultados.findIndex(
      (resultadoActual) => resultadoActual._id === resultado._id,
    );

    if (
      !seleccionado ||
      indice < 0 ||
      !this.puedeSeleccionarParaRegistro(resultado, indice)
    ) {
      this._seleccionRegistro.delete(resultado._id);
      return;
    }

    this._seleccionRegistro.add(resultado._id);
  }

  seleccionarTodosRegistrables(): void {
    this.guardarBorradorActual();

    this.resultados.forEach((resultado, indice) => {
      if (this.puedeSeleccionarParaRegistro(resultado, indice)) {
        this._seleccionRegistro.add(resultado._id);
      }
    });
  }

  puedeSeleccionarParaRegistro(
    resultado: IResultadoLaboratorio,
    indiceResultado?: number,
  ): boolean {
    if (
      !this.esModoRegistro ||
      this.data.soloLecturaForzada === true ||
      this.data.puedeRegistrar === false ||
      !this.esResultadoEditable(resultado) ||
      resultado.habilitacionMuestra?.habilitada === false
    ) {
      return false;
    }

    const indice =
      indiceResultado ??
      this.resultados.findIndex(
        (resultadoActual) => resultadoActual._id === resultado._id,
      );

    if (indice < 0) {
      return false;
    }

    const completa = resultado.resultadosItems.every((item, indiceItem) => {
      if (item.esOpcional === true) {
        return true;
      }

      return (
        this.obtenerValorEfectivoParaRegistro(resultado, indice, indiceItem) !==
        null
      );
    });

    return completa && this.tieneCambiosPendientesRegistro(resultado, indice);
  }

  private tieneCambiosPendientesRegistro(
    resultado: IResultadoLaboratorio,
    indiceResultado: number,
  ): boolean {
    if (indiceResultado !== this.indiceActual) {
      return this.construirItemsModificadosDesdeBorrador(resultado).length > 0;
    }

    return resultado.resultadosItems.some((item, indiceItem) => {
      const grupo = this.itemsForm.controls[indiceItem];

      if (!grupo) {
        return false;
      }

      try {
        const raw = grupo.getRawValue();
        const valor = this.normalizarValorFormulario(
          this.construirValorDesdeGrupo(grupo, item),
          item,
        );
        const valorOriginal = this.normalizarValorFormulario(item.valor, item);
        const observacion = this.esItemObservaciones(item)
          ? String(item.observacion ?? '').trim()
          : raw.observacionActiva
            ? raw.observacion.trim()
            : '';
        const observacionOriginal = String(item.observacion ?? '').trim();

        return (
          !this.sonValoresEquivalentes(valor, valorOriginal) ||
          observacion !== observacionOriginal ||
          (item.estado === 'PENDIENTE' && valor !== null)
        );
      } catch {
        return false;
      }
    });
  }

  private obtenerValorEfectivoParaRegistro(
    resultado: IResultadoLaboratorio,
    indiceResultado: number,
    indiceItem: number,
  ): ValorResultadoLaboratorio {
    const item = resultado.resultadosItems[indiceItem];

    if (!item) {
      return null;
    }

    if (indiceResultado === this.indiceActual) {
      const grupo = this.itemsForm.controls[indiceItem];

      if (!grupo) {
        return null;
      }

      try {
        return this.normalizarValorFormulario(
          this.construirValorDesdeGrupo(grupo, item),
          item,
        );
      } catch {
        return null;
      }
    }

    const borrador = this._borradores.get(resultado._id)?.[indiceItem];

    if (borrador) {
      return this.normalizarValorFormulario(borrador.valor, item);
    }

    return this.normalizarValorFormulario(item.valor, item);
  }

  get cantidadCompletosValidables(): number {
    return this.resultados.filter(
      (resultado) => resultado.estadoResultado === 'COMPLETO',
    ).length;
  }

  get cantidadSeleccionadosValidacion(): number {
    return this.resultados.filter(
      (resultado) =>
        resultado.estadoResultado === 'COMPLETO' &&
        this._seleccionValidacion.has(resultado._id),
    ).length;
  }

  estaSeleccionadoParaValidar(resultado: IResultadoLaboratorio): boolean {
    return this._seleccionValidacion.has(resultado._id);
  }

  cambiarSeleccionValidacion(
    resultado: IResultadoLaboratorio,
    seleccionado: boolean,
  ): void {
    if (resultado.estadoResultado !== 'COMPLETO') {
      this._seleccionValidacion.delete(resultado._id);
      return;
    }

    if (seleccionado) {
      this._seleccionValidacion.add(resultado._id);
    } else {
      this._seleccionValidacion.delete(resultado._id);
    }
  }

  seleccionarTodosValidables(): void {
    this.resultados
      .filter((resultado) => resultado.estadoResultado === 'COMPLETO')
      .forEach((resultado) => this._seleccionValidacion.add(resultado._id));
  }

  limpiarSeleccionValidacion(): void {
    this._seleccionValidacion.clear();
  }

  get puedeAnularActual(): boolean {
    return (
      this.data.puedeAnular === true &&
      this.resultadoActual?.estadoResultado !== 'ANULADO'
    );
  }

  get puedeReabrirActual(): boolean {
    return (
      this.data.puedeAnular === true &&
      this.resultadoActual?.estadoResultado === 'ANULADO'
    );
  }

  get itemsForm(): FormArray<FormGroup<IItemResultadoForm>> {
    return this.formResultado.controls.items;
  }

  // ====== Clase visual del estado ======
  claseEstadoResultado(estado: string | null | undefined): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-pendiente';
      case 'EN PROCESO':
        return 'estado-en-proceso';
      case 'COMPLETO':
        return 'estado-completo';
      case 'VALIDADO':
        return 'estado-validado';
      case 'LIBERADO':
        return 'estado-liberado';
      case 'ANULADO':
        return 'estado-anulado';
      default:
        return 'estado-neutro';
    }
  }

  // ====== Resaltar Item activo ======
  marcarItemActivo(index: number): void {
    this.itemActivoIndex = index;
  }

  ngOnDestroy(): void {
    this.limpiarSuscripcionesEvaluacion();
  }

  // ====== Atajos de navegación ======

  @HostListener('document:keydown', ['$event'])
  manejarTecla(event: KeyboardEvent): void {
    if (this.procesando) {
      return;
    }

    if (event.key === 'PageUp') {
      event.preventDefault();
      this.irAnterior();
      return;
    }

    if (event.key === 'PageDown') {
      event.preventDefault();
      this.irSiguiente();
    }
  }

  // ====== Navegación ======

  irAnterior(): void {
    this.navegarA(this.indiceActual - 1);
  }

  irSiguiente(): void {
    this.navegarA(this.indiceActual + 1);
  }

  private navegarA(indice: number): void {
    if (
      this.procesando ||
      indice < 0 ||
      indice >= this.resultados.length ||
      indice === this.indiceActual
    ) {
      return;
    }

    this.guardarBorradorActual();
    this.indiceActual = indice;
    this.formResultado = this.crearFormularioActual();
    this.itemActivoIndex = null;
  }

  // ====== Crear formulario ======

  private crearFormularioActual(): FormGroup<{
    items: FormArray<FormGroup<IItemResultadoForm>>;
  }> {
    this.limpiarSuscripcionesEvaluacion();
    this._previsualizaciones.clear();
    this._erroresPrevisualizacion.clear();
    this._itemsModificados.clear();

    const resultado = this.resultados[this.indiceActual];
    const borrador = this._borradores.get(resultado?._id ?? '');

    const form = this._fb.group({
      items: this._fb.array(
        (resultado?.resultadosItems ?? []).map((item, indice) =>
          this.crearItemForm(item, borrador?.[indice]),
        ),
      ),
    });

    const puedeEditar =
      this.data.soloLecturaForzada !== true &&
      resultado?.habilitacionMuestra?.habilitada !== false &&
      ((this.esModoRegistro &&
        this.data.puedeRegistrar !== false &&
        this.esResultadoEditable(resultado)) ||
        (this.esModoValidacion &&
          this.data.puedeValidar === true &&
          resultado?.estadoResultado === 'COMPLETO'));

    if (!puedeEditar) {
      form.disable({ emitEvent: false });
    } else {
      this.configurarEvaluacionTiempoReal(form);
    }

    return form;
  }

  private crearItemForm(
    item: IResultadoLaboratorioItem,
    borrador?: IBorradorItemResultado,
  ): FormGroup<IItemResultadoForm> {
    const valorInicial = borrador
      ? borrador.valor
      : this.obtenerValorInicialResultado(item);
    const numerico = this.descomponerValorNumericoFormulario(
      item,
      valorInicial,
    );
    const estructurado = this.descomponerValorEstructuradoFormulario(
      item,
      valorInicial,
    );
    const valorCampo: string | number | null =
      item.tipoResultado === 'NUMERICO'
        ? numerico.valor
        : typeof valorInicial === 'string' || typeof valorInicial === 'number'
          ? valorInicial
          : null;

    const observacionInicial = borrador
      ? borrador.observacion
      : (item.observacion ?? '');

    const observacionActivaInicial =
      !this.esItemObservaciones(item) &&
      (borrador
        ? borrador.observacionActiva
        : Boolean(String(observacionInicial).trim()));

    return this._fb.group<IItemResultadoForm>({
      itemResultadoId: this._fb.nonNullable.control(item._id),
      selectorResultado: this._fb.nonNullable.control(
        this.obtenerSeleccionInicialResultado(item, valorInicial),
      ),
      selectorCualitativoNumerico: this._fb.nonNullable.control(
        this.obtenerSeleccionCualitativaNumericaInicial(item, valorInicial),
      ),
      formatoNumerico: this._fb.nonNullable.control(numerico.formato),
      valor: this._fb.control<string | number | null>(valorCampo),
      valorDesde: this._fb.control<number | null>(numerico.desde),
      valorHasta: this._fb.control<number | null>(numerico.hasta),
      modoEstructurado: this._fb.nonNullable.control(estructurado.modo),
      hallazgosEstructurados: this._fb.array(
        estructurado.hallazgos.map((hallazgo) =>
          this.crearHallazgoEstructuradoForm(item, hallazgo),
        ),
      ),
      observacionActiva: this._fb.nonNullable.control(observacionActivaInicial),
      observacion: this._fb.nonNullable.control(observacionInicial),
    });
  }

  // ====== Item de observaciones ======

  esItemObservaciones(item: IResultadoLaboratorioItem): boolean {
    const nombre = String(item?.nombreInforme ?? '')
      .trim()
      .toUpperCase();

    return nombre === 'OBSERVACION' || nombre === 'OBSERVACIONES';
  }

  // ====== Referencia compartida del grupo ======

  comentarioReferenciaGrupo(item: IResultadoLaboratorioItem): string {
    return String(item?.comentarioReferenciaGrupo ?? '').trim();
  }

  esUltimoItemGrupo(indiceItem: number): boolean {
    const items = this.resultadoActual?.resultadosItems ?? [];
    const actual = items[indiceItem];

    if (!actual) return false;

    const siguiente = items[indiceItem + 1];
    return !siguiente || siguiente.indiceGrupo !== actual.indiceGrupo;
  }

  // ====== Valor inicial y opciones de captura ======

  private obtenerValorInicialResultado(
    item: IResultadoLaboratorioItem,
  ): ValorResultadoLaboratorio {
    if (item.valor !== null && item.valor !== undefined && item.valor !== '') {
      return item.valor;
    }

    const valorDefault =
      item.configuracionClinica?.valorPorDefectoResultado ?? null;

    if (valorDefault === null || valorDefault === undefined) {
      return null;
    }

    if (typeof valorDefault === 'string') {
      const texto = valorDefault.trim();
      return texto || null;
    }

    return valorDefault;
  }

  obtenerFormatosCapturaNumerica(
    item: IResultadoLaboratorioItem,
  ): FormatoCapturaNumericaLaboratorio[] {
    const configurados =
      item.configuracionClinica?.formatosCapturaNumerica ?? [];

    return configurados.length > 0 ? configurados : ['VALOR'];
  }

  etiquetaFormatoNumerico(formato: FormatoCapturaNumericaLaboratorio): string {
    const etiquetas: Record<FormatoCapturaNumericaLaboratorio, string> = {
      VALOR: 'Valor único',
      RANGO: 'Rango',
      MAYOR_QUE: 'Mayor que (>)',
      MAYOR_IGUAL_QUE: 'Mayor o igual que (>=)',
      MENOR_QUE: 'Menor que (<)',
      MENOR_IGUAL_QUE: 'Menor o igual que (<=)',
    };

    return etiquetas[formato];
  }

  simboloFormatoNumerico(formato: FormatoCapturaNumericaLaboratorio): string {
    const simbolos: Partial<Record<FormatoCapturaNumericaLaboratorio, string>> =
      {
        MAYOR_QUE: '>',
        MAYOR_IGUAL_QUE: '>=',
        MENOR_QUE: '<',
        MENOR_IGUAL_QUE: '<=',
      };

    return simbolos[formato] ?? '';
  }

  esFormatoNumericoRango(grupo: FormGroup<IItemResultadoForm>): boolean {
    return grupo.controls.formatoNumerico.value === 'RANGO';
  }

  esNumericoSoloEnteros(item: IResultadoLaboratorioItem): boolean {
    return item.configuracionClinica?.precisionNumerica === 'ENTERO';
  }

  esHallazgoNumericoSoloEnteros(item: IResultadoLaboratorioItem): boolean {
    return (
      item.configuracionClinica?.configuracionEstructurada?.cuantificacion
        ?.precisionNumerica === 'ENTERO'
    );
  }

  pasoNumerico(
    item: IResultadoLaboratorioItem,
    estructurado = false,
  ): number | string {
    const soloEnteros = estructurado
      ? this.esHallazgoNumericoSoloEnteros(item)
      : this.esNumericoSoloEnteros(item);

    return soloEnteros ? 1 : 'any';
  }

  bloquearSeparadorDecimal(event: KeyboardEvent, soloEnteros: boolean): void {
    if (!soloEnteros) return;

    if (['.', ',', 'Decimal'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private validarPrecisionNumericaLocal(
    numero: number,
    item: IResultadoLaboratorioItem,
    estructurado = false,
  ): void {
    const soloEnteros = estructurado
      ? this.esHallazgoNumericoSoloEnteros(item)
      : this.esNumericoSoloEnteros(item);

    if (soloEnteros && !Number.isInteger(numero)) {
      throw new Error('Este Item solo permite valores enteros.');
    }
  }

  private descomponerValorNumericoFormulario(
    item: IResultadoLaboratorioItem,
    valor: ValorResultadoLaboratorio,
  ): {
    formato: FormatoCapturaNumericaLaboratorio;
    valor: number | null;
    desde: number | null;
    hasta: number | null;
  } {
    const permitidos = this.obtenerFormatosCapturaNumerica(item);
    const formatoDefault =
      item.configuracionClinica?.formatoCapturaNumericaDefault ??
      permitidos[0] ??
      'VALOR';

    if (item.tipoResultado !== 'NUMERICO') {
      return {
        formato: 'VALOR',
        valor: null,
        desde: null,
        hasta: null,
      };
    }

    if (typeof valor === 'number') {
      return {
        formato: 'VALOR',
        valor,
        desde: null,
        hasta: null,
      };
    }

    if (valor && typeof valor === 'object') {
      if (valor.tipo === 'CUALITATIVO') {
        return {
          formato: permitidos.includes(formatoDefault)
            ? formatoDefault
            : permitidos[0],
          valor: null,
          desde: null,
          hasta: null,
        };
      }

      if (valor.tipo === 'RANGO') {
        return {
          formato: 'RANGO',
          valor: null,
          desde: Number(valor.desde),
          hasta: Number(valor.hasta),
        };
      }

      if ('valor' in valor) {
        return {
          formato: valor.tipo,
          valor: Number(valor.valor),
          desde: null,
          hasta: null,
        };
      }
    }

    return {
      formato: permitidos.includes(formatoDefault)
        ? formatoDefault
        : permitidos[0],
      valor: null,
      desde: null,
      hasta: null,
    };
  }

  // ====== Alternativas cualitativas de Items numéricos ======

  obtenerValoresCualitativosNumericos(
    item: IResultadoLaboratorioItem,
  ): string[] {
    return item.configuracionClinica?.valoresCualitativosAlternativos ?? [];
  }

  tieneAlternativasCualitativasNumericas(
    item: IResultadoLaboratorioItem,
  ): boolean {
    return (
      item.tipoResultado === 'NUMERICO' &&
      this.obtenerValoresCualitativosNumericos(item).length > 0
    );
  }

  private obtenerSeleccionCualitativaNumericaInicial(
    item: IResultadoLaboratorioItem,
    valor: ValorResultadoLaboratorio,
  ): string {
    if (
      item.tipoResultado !== 'NUMERICO' ||
      !valor ||
      typeof valor !== 'object' ||
      Array.isArray(valor) ||
      valor.tipo !== 'CUALITATIVO'
    ) {
      return '';
    }

    return String(valor.valor ?? '').trim();
  }

  // ====== Resultado estructurado / hallazgos ======

  private obtenerConfiguracionEstructurada(item: IResultadoLaboratorioItem) {
    return item.configuracionClinica?.configuracionEstructurada ?? null;
  }

  esResultadoEstructurado(item: IResultadoLaboratorioItem): boolean {
    return item.tipoResultado === 'ESTRUCTURADO';
  }

  esCuantificacionEstructuradaNumerica(
    item: IResultadoLaboratorioItem,
  ): boolean {
    return (
      this.obtenerConfiguracionEstructurada(item)?.cuantificacion?.tipo ===
      'NUMERICA'
    );
  }

  obtenerHallazgosPermitidos(item: IResultadoLaboratorioItem): string[] {
    return this.obtenerConfiguracionEstructurada(item)?.hallazgos ?? [];
  }

  obtenerOpcionesCuantificacionEstructurada(
    item: IResultadoLaboratorioItem,
  ): string[] {
    return (
      this.obtenerConfiguracionEstructurada(item)?.cuantificacion?.opciones ??
      []
    );
  }

  obtenerFormatosHallazgoNumerico(
    item: IResultadoLaboratorioItem,
  ): FormatoCapturaNumericaLaboratorio[] {
    const formatos =
      this.obtenerConfiguracionEstructurada(item)?.cuantificacion
        ?.formatosCapturaNumerica ?? [];
    return formatos.length ? formatos : ['VALOR'];
  }

  private descomponerValorEstructuradoFormulario(
    item: IResultadoLaboratorioItem,
    valor: ValorResultadoLaboratorio,
  ): { modo: string; hallazgos: any[] } {
    if (
      item.tipoResultado !== 'ESTRUCTURADO' ||
      !valor ||
      typeof valor !== 'object' ||
      Array.isArray(valor) ||
      valor.tipo !== 'HALLAZGOS'
    ) {
      return { modo: '', hallazgos: [] };
    }

    return {
      modo: valor.modo ?? '',
      hallazgos: Array.isArray(valor.hallazgos) ? valor.hallazgos : [],
    };
  }

  private crearHallazgoEstructuradoForm(
    item: IResultadoLaboratorioItem,
    entrada: any = {},
  ): FormGroup<IHallazgoResultadoForm> {
    const configuracion = this.obtenerConfiguracionEstructurada(item);
    const formatoDefault =
      configuracion?.cuantificacion?.formatoCapturaNumericaDefault ?? 'VALOR';

    let formato = formatoDefault;
    let valor: string | number | null = null;
    let desde: number | null = null;
    let hasta: number | null = null;

    const valorEntrada = entrada?.valor;

    if (configuracion?.cuantificacion?.tipo === 'CATEGORICA') {
      valor =
        valorEntrada && typeof valorEntrada === 'object'
          ? String(valorEntrada.valor ?? '')
          : String(valorEntrada ?? '');
    } else if (typeof valorEntrada === 'number') {
      formato = 'VALOR';
      valor = valorEntrada;
    } else if (valorEntrada && typeof valorEntrada === 'object') {
      if (valorEntrada.tipo === 'RANGO') {
        formato = 'RANGO';
        desde = Number.isFinite(Number(valorEntrada.desde))
          ? Number(valorEntrada.desde)
          : null;
        hasta = Number.isFinite(Number(valorEntrada.hasta))
          ? Number(valorEntrada.hasta)
          : null;
      } else if ('valor' in valorEntrada) {
        formato = valorEntrada.tipo ?? formatoDefault;
        valor = Number.isFinite(Number(valorEntrada.valor))
          ? Number(valorEntrada.valor)
          : null;
      }
    }

    return this._fb.group<IHallazgoResultadoForm>({
      hallazgo: this._fb.nonNullable.control(String(entrada?.hallazgo ?? '')),
      formatoNumerico: this._fb.nonNullable.control(formato),
      valor: this._fb.control<string | number | null>(valor),
      valorDesde: this._fb.control<number | null>(desde),
      valorHasta: this._fb.control<number | null>(hasta),
    });
  }

  agregarHallazgoEstructuradoResultado(indiceItem: number): void {
    const item = this.resultadoActual.resultadosItems[indiceItem];
    const grupo = this.itemsForm.at(indiceItem);
    const configuracion = this.obtenerConfiguracionEstructurada(item);

    if (
      configuracion?.permiteMultiples === false &&
      grupo.controls.hallazgosEstructurados.length > 0
    ) {
      return;
    }

    grupo.controls.hallazgosEstructurados.push(
      this.crearHallazgoEstructuradoForm(item),
    );
  }

  eliminarHallazgoEstructuradoResultado(
    indiceItem: number,
    indiceHallazgo: number,
  ): void {
    this.itemsForm
      .at(indiceItem)
      .controls.hallazgosEstructurados.removeAt(indiceHallazgo);
  }

  esHallazgoNumericoRango(
    grupoHallazgo: FormGroup<IHallazgoResultadoForm>,
  ): boolean {
    return grupoHallazgo.controls.formatoNumerico.value === 'RANGO';
  }

  valorAusenciaEstructurada(item: IResultadoLaboratorioItem): string {
    return (
      this.obtenerConfiguracionEstructurada(item)?.valorAusencia ||
      'NO SE OBSERVAN'
    );
  }

  usaSelectorResultado(item: IResultadoLaboratorioItem): boolean {
    return (
      item.tipoResultado === 'CATEGORICO' &&
      (item.configuracionClinica?.opcionesResultado?.length ?? 0) > 0
    );
  }

  obtenerOpcionesResultado(item: IResultadoLaboratorioItem): string[] {
    return item.configuracionClinica?.opcionesResultado ?? [];
  }

  permiteOtroResultado(item: IResultadoLaboratorioItem): boolean {
    return item.configuracionClinica?.permiteValorNoListado === true;
  }

  mostrarIngresoManualResultado(
    item: IResultadoLaboratorioItem,
    grupo: FormGroup<IItemResultadoForm>,
  ): boolean {
    return (
      this.usaSelectorResultado(item) &&
      grupo.controls.selectorResultado.value === this.valorOtroResultado
    );
  }

  private obtenerSeleccionInicialResultado(
    item: IResultadoLaboratorioItem,
    valor: ValorResultadoLaboratorio,
  ): string {
    if (!this.usaSelectorResultado(item)) {
      return '';
    }

    const texto = String(valor ?? '').trim();

    if (!texto) {
      return '';
    }

    const encontrada = this.obtenerOpcionesResultado(item).find(
      (opcion) => String(opcion).trim().toUpperCase() === texto.toUpperCase(),
    );

    if (encontrada !== undefined) {
      return encontrada;
    }

    return this.permiteOtroResultado(item) ? this.valorOtroResultado : '';
  }

  // ====== Evaluación clínica local en tiempo real ======

  private configurarEvaluacionTiempoReal(
    form: FormGroup<{
      items: FormArray<FormGroup<IItemResultadoForm>>;
    }>,
  ): void {
    const resultado = this.resultadoActual;

    form.controls.items.controls.forEach((grupo, indice) => {
      const item = resultado.resultadosItems[indice];

      if (this.usaSelectorResultado(item)) {
        const suscripcionSelector =
          grupo.controls.selectorResultado.valueChanges
            .pipe(distinctUntilChanged())
            .subscribe((seleccion) => {
              if (seleccion === this.valorOtroResultado) {
                const valorActual = String(
                  grupo.controls.valor.value ?? '',
                ).trim();
                const correspondeALista = this.obtenerOpcionesResultado(
                  item,
                ).some(
                  (opcion) =>
                    String(opcion).trim().toUpperCase() ===
                    valorActual.toUpperCase(),
                );

                if (correspondeALista) {
                  grupo.controls.valor.setValue('', { emitEvent: true });
                }

                return;
              }

              grupo.controls.valor.setValue(seleccion || '', {
                emitEvent: true,
              });
            });

        this._suscripcionesEvaluacion.push(suscripcionSelector);
      }

      const cambiosResultado$: Observable<unknown> =
        item.tipoResultado === 'ESTRUCTURADO'
          ? grupo.valueChanges
          : item.tipoResultado === 'NUMERICO'
            ? merge(
                grupo.controls.selectorCualitativoNumerico.valueChanges,
                grupo.controls.formatoNumerico.valueChanges,
                grupo.controls.valor.valueChanges,
                grupo.controls.valorDesde.valueChanges,
                grupo.controls.valorHasta.valueChanges,
              )
            : grupo.controls.valor.valueChanges;

      const procesarCambio = (): void => {
        this._erroresPrevisualizacion.delete(item._id);

        try {
          const valor = this.construirValorDesdeGrupo(grupo, item);
          const valorOriginal = this.normalizarValorFormulario(
            item.valor,
            item,
          );

          if (this.sonValoresEquivalentes(valor, valorOriginal)) {
            this._itemsModificados.delete(item._id);
            this._previsualizaciones.delete(item._id);
            return;
          }

          this._itemsModificados.add(item._id);

          if (valor === null) {
            this._previsualizaciones.delete(item._id);
            return;
          }

          const previsualizacion = this.evaluarItemLocal(item, valor);
          this._previsualizaciones.set(item._id, previsualizacion);
        } catch (error: any) {
          this._previsualizaciones.delete(item._id);
          this._erroresPrevisualizacion.set(
            item._id,
            error?.message ||
              'No se pudo evaluar la configuración clínica histórica del Item.',
          );
        }
      };

      // ====== Evaluar estado inicial y cambios posteriores ======
      procesarCambio();

      const suscripcion = cambiosResultado$.subscribe(() => procesarCambio());

      this._suscripcionesEvaluacion.push(suscripcion);
    });
  }

  obtenerErrorEvaluacion(item: IResultadoLaboratorioItem): string | null {
    return this._erroresPrevisualizacion.get(item._id) ?? null;
  }

  obtenerEvaluacionVisible(
    item: IResultadoLaboratorioItem,
  ): IEvaluacionReferencia | null {
    if (this._itemsModificados.has(item._id)) {
      return (
        this._previsualizaciones.get(item._id)?.evaluacionReferencia ?? null
      );
    }

    if (
      !item.evaluacionReferencia ||
      item.evaluacionReferencia.estado === 'PENDIENTE'
    ) {
      return null;
    }

    return item.evaluacionReferencia;
  }

  obtenerAlertasVisibles(item: IResultadoLaboratorioItem): IAlertaDetectada[] {
    if (this._itemsModificados.has(item._id)) {
      return this._previsualizaciones.get(item._id)?.alertasDetectadas ?? [];
    }

    return item.alertasDetectadas ?? [];
  }

  // ====== Evaluar Item desde snapshot precargado ======

  private evaluarItemLocal(
    item: IResultadoLaboratorioItem,
    valor: Exclude<ValorResultadoLaboratorio, null>,
  ): IEvaluacionLocalItem {
    const configuracion = item.configuracionClinica;

    if (!configuracion) {
      throw new Error(
        'La configuración clínica histórica del Item no está disponible para evaluación local.',
      );
    }

    if (configuracion.tipoResultado !== item.tipoResultado) {
      throw new Error(
        'El tipo de resultado no coincide con la configuración clínica histórica.',
      );
    }

    const valorNormalizado = this.normalizarValorClinico(item, valor);

    if (item.tipoResultado === 'ESTRUCTURADO') {
      const configuracionEstructurada = configuracion.configuracionEstructurada;
      const hallazgosNormales = Array.isArray(
        configuracionEstructurada?.hallazgosNormales,
      )
        ? configuracionEstructurada.hallazgosNormales
            .map((hallazgo) => String(hallazgo ?? '').trim().toUpperCase())
            .filter(Boolean)
        : [];
      const ausenciaEsReferencia =
        configuracionEstructurada?.ausenciaEsReferencia === true;

      if (!ausenciaEsReferencia && hallazgosNormales.length === 0) {
        return {
          valorNormalizado,
          evaluacionReferencia: {
            estado: 'NO_APLICA',
            referenciaAplicada: null,
            mensaje: 'No existe una referencia estructurada configurada',
          },
          alertasDetectadas: [],
        };
      }

      const modo =
        valorNormalizado &&
        typeof valorNormalizado === 'object' &&
        !Array.isArray(valorNormalizado) &&
        'modo' in valorNormalizado
          ? String(valorNormalizado.modo ?? '')
              .trim()
              .toUpperCase()
          : '';
      const valorEsperado = String(
        configuracionEstructurada?.valorAusencia || 'NO SE OBSERVAN',
      ).trim();

      if (modo === 'AUSENCIA') {
        return {
          valorNormalizado,
          evaluacionReferencia: {
            estado: ausenciaEsReferencia
              ? 'VALOR_PERMITIDO'
              : 'VALOR_NO_PERMITIDO',
            referenciaAplicada: null,
            mensaje: ausenciaEsReferencia
              ? `Resultado estructurado dentro del valor esperado: ${valorEsperado}`
              : `El resultado de ausencia no está configurado como valor esperado: ${valorEsperado}`,
          },
          alertasDetectadas: [],
        };
      }

      const hallazgos =
        valorNormalizado &&
        typeof valorNormalizado === 'object' &&
        !Array.isArray(valorNormalizado) &&
        'hallazgos' in valorNormalizado &&
        Array.isArray(valorNormalizado.hallazgos)
          ? valorNormalizado.hallazgos
          : [];
      const fueraReferencia = hallazgos
        .map((hallazgo) => String(hallazgo?.hallazgo ?? '').trim())
        .filter(Boolean)
        .filter(
          (hallazgo) => !hallazgosNormales.includes(hallazgo.toUpperCase()),
        );

      return {
        valorNormalizado,
        evaluacionReferencia: {
          estado:
            fueraReferencia.length === 0 && hallazgos.length > 0
              ? 'VALOR_PERMITIDO'
              : 'VALOR_NO_PERMITIDO',
          referenciaAplicada: null,
          mensaje:
            fueraReferencia.length === 0 && hallazgos.length > 0
              ? 'Los hallazgos registrados están considerados dentro de los valores esperados'
              : fueraReferencia.length
                ? `Hallazgos fuera del valor esperado: ${fueraReferencia.join(', ')}`
                : `Se registraron hallazgos. Valor esperado: ${valorEsperado}`,
        },
        alertasDetectadas: [],
      };
    }

    if (
      item.tipoResultado === 'NUMERICO' &&
      valorNormalizado &&
      typeof valorNormalizado === 'object' &&
      !Array.isArray(valorNormalizado) &&
      valorNormalizado.tipo === 'CUALITATIVO'
    ) {
      const referencias = configuracion.valoresCualitativosReferencia ?? [];
      const valorTexto = String(valorNormalizado.valor ?? '')
        .trim()
        .toUpperCase();
      const coincide = referencias.some(
        (referencia) => String(referencia).trim().toUpperCase() === valorTexto,
      );

      return {
        valorNormalizado,
        evaluacionReferencia: {
          estado: referencias.length
            ? coincide
              ? 'VALOR_PERMITIDO'
              : 'VALOR_NO_PERMITIDO'
            : 'NO_APLICA',
          referenciaAplicada: null,
          mensaje: referencias.length
            ? coincide
              ? 'Resultado cualitativo dentro de la referencia clínica'
              : 'Resultado cualitativo fuera de la referencia clínica'
            : 'No existe una referencia cualitativa configurada',
        },
        alertasDetectadas: [],
      };
    }

    const evaluacionReferencia = this.evaluarReferenciaLocal(
      configuracion.referenciasResultado ?? [],
      valorNormalizado,
    );

    const alertasDetectadas = this.detectarAlertasLocal(
      item,
      configuracion.reglasAlerta ?? [],
      valorNormalizado,
    );

    return {
      valorNormalizado,
      evaluacionReferencia,
      alertasDetectadas,
    };
  }

  // ====== Construir valor desde formulario ======

  private construirValorDesdeGrupo(
    grupo: FormGroup<IItemResultadoForm>,
    item: IResultadoLaboratorioItem,
  ): ValorResultadoLaboratorio {
    if (item.tipoResultado === 'ESTRUCTURADO') {
      const modo = grupo.controls.modoEstructurado.value;

      if (!modo) return null;

      if (modo === 'AUSENCIA') {
        return {
          tipo: 'HALLAZGOS',
          modo: 'AUSENCIA',
          valorAusencia: this.valorAusenciaEstructurada(item),
          hallazgos: [],
        };
      }

      if (modo !== 'DETALLE') {
        throw new Error('Seleccione el modo del resultado estructurado.');
      }

      const hallazgos = grupo.controls.hallazgosEstructurados.controls.map(
        (hallazgoGrupo) =>
          this.construirValorHallazgoEstructurado(item, hallazgoGrupo),
      );

      if (!hallazgos.length) {
        throw new Error('Debe registrar al menos un hallazgo.');
      }

      const clavesHallazgo = hallazgos.map((entrada) =>
        String(entrada.hallazgo).trim().toUpperCase(),
      );
      if (new Set(clavesHallazgo).size !== clavesHallazgo.length) {
        throw new Error('No puede registrar el mismo hallazgo más de una vez.');
      }

      return {
        tipo: 'HALLAZGOS',
        modo: 'DETALLE',
        hallazgos,
      };
    }

    if (item.tipoResultado !== 'NUMERICO') {
      return this.normalizarValorFormulario(grupo.controls.valor.value, item);
    }

    const cualitativo = grupo.controls.selectorCualitativoNumerico.value;
    if (cualitativo) {
      return {
        tipo: 'CUALITATIVO',
        valor: cualitativo,
      };
    }

    const formato = grupo.controls.formatoNumerico.value;
    const permitidos = this.obtenerFormatosCapturaNumerica(item);

    if (!permitidos.includes(formato)) {
      throw new Error(
        'El formato numérico seleccionado no está permitido para este Item.',
      );
    }

    if (formato === 'RANGO') {
      const desdeRaw = grupo.controls.valorDesde.value;
      const hastaRaw = grupo.controls.valorHasta.value;
      const vacioDesde = desdeRaw === null || desdeRaw === undefined;
      const vacioHasta = hastaRaw === null || hastaRaw === undefined;

      if (vacioDesde && vacioHasta) {
        return null;
      }

      if (vacioDesde || vacioHasta) {
        throw new Error('Debe indicar ambos extremos del rango numérico.');
      }

      const desde = Number(desdeRaw);
      const hasta = Number(hastaRaw);

      if (!Number.isFinite(desde) || !Number.isFinite(hasta)) {
        throw new Error('Los extremos del rango deben ser numéricos.');
      }

      this.validarPrecisionNumericaLocal(desde, item);
      this.validarPrecisionNumericaLocal(hasta, item);

      if (desde > hasta) {
        throw new Error(
          'El valor inicial no puede ser mayor que el valor final.',
        );
      }

      return {
        tipo: 'RANGO',
        desde,
        hasta,
      };
    }

    const valorRaw = grupo.controls.valor.value;

    if (valorRaw === null || valorRaw === undefined || valorRaw === '') {
      return null;
    }

    const numero = Number(valorRaw);

    if (!Number.isFinite(numero)) {
      throw new Error('El resultado debe ser un valor numérico válido.');
    }

    this.validarPrecisionNumericaLocal(numero, item);

    if (formato === 'VALOR') {
      return numero;
    }

    return {
      tipo: formato,
      valor: numero,
    };
  }

  private construirValorHallazgoEstructurado(
    item: IResultadoLaboratorioItem,
    grupo: FormGroup<IHallazgoResultadoForm>,
  ): any {
    const hallazgo = String(grupo.controls.hallazgo.value ?? '').trim();
    const configuracion = this.obtenerConfiguracionEstructurada(item);

    if (!hallazgo) {
      throw new Error('Seleccione el tipo de hallazgo.');
    }

    if (configuracion?.cuantificacion?.tipo === 'CATEGORICA') {
      const valor = String(grupo.controls.valor.value ?? '').trim();
      if (!valor) {
        throw new Error(`Seleccione la cuantificación de ${hallazgo}.`);
      }
      return {
        hallazgo,
        valor: { tipo: 'CATEGORICO', valor },
      };
    }

    const formato = grupo.controls.formatoNumerico.value;
    const permitidos = this.obtenerFormatosHallazgoNumerico(item);

    if (!permitidos.includes(formato)) {
      throw new Error(`El formato de ${hallazgo} no está permitido.`);
    }

    if (formato === 'RANGO') {
      const desde = grupo.controls.valorDesde.value;
      const hasta = grupo.controls.valorHasta.value;

      if (desde === null || hasta === null) {
        throw new Error(`Complete ambos extremos del rango de ${hallazgo}.`);
      }

      const numeroDesde = Number(desde);
      const numeroHasta = Number(hasta);

      if (!Number.isFinite(numeroDesde) || !Number.isFinite(numeroHasta)) {
        throw new Error(`El rango de ${hallazgo} debe ser numérico.`);
      }

      this.validarPrecisionNumericaLocal(numeroDesde, item, true);
      this.validarPrecisionNumericaLocal(numeroHasta, item, true);

      if (numeroDesde > numeroHasta) {
        throw new Error(
          `El valor inicial de ${hallazgo} no puede ser mayor que el valor final.`,
        );
      }

      return {
        hallazgo,
        valor: { tipo: 'RANGO', desde: numeroDesde, hasta: numeroHasta },
      };
    }

    const valor = grupo.controls.valor.value;
    if (valor === null || valor === undefined || valor === '') {
      throw new Error(`Ingrese el valor de ${hallazgo}.`);
    }

    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      throw new Error(`El valor de ${hallazgo} debe ser numérico.`);
    }

    this.validarPrecisionNumericaLocal(numero, item, true);

    if (formato === 'VALOR') {
      return { hallazgo, valor: numero };
    }

    return {
      hallazgo,
      valor: { tipo: formato, valor: numero },
    };
  }

  // ====== Normalizar valor clínico ======

  private normalizarValorClinico(
    item: IResultadoLaboratorioItem,
    valor: Exclude<ValorResultadoLaboratorio, null>,
  ): Exclude<ValorResultadoLaboratorio, null> {
    const configuracion = item.configuracionClinica;

    if (item.tipoResultado === 'NUMERICO') {
      const normalizado = this.normalizarValorFormulario(valor, item);

      if (normalizado === null) {
        throw new Error('El resultado debe ser un valor numérico válido.');
      }

      return normalizado;
    }

    if (item.tipoResultado === 'ESTRUCTURADO') {
      const normalizado = this.normalizarValorFormulario(valor, item);
      if (normalizado === null) {
        throw new Error('El resultado estructurado no es válido.');
      }
      return normalizado;
    }

    const texto = String(valor ?? '').trim();

    if (!texto) {
      throw new Error('El resultado no puede estar vacío.');
    }

    if (item.tipoResultado === 'CATEGORICO') {
      const opciones = configuracion?.opcionesResultado ?? [];

      const opcionEncontrada = opciones.find(
        (opcion) => String(opcion).trim().toUpperCase() === texto.toUpperCase(),
      );

      if (opcionEncontrada !== undefined) {
        return opcionEncontrada;
      }

      if (configuracion?.permiteValorNoListado !== true) {
        throw new Error(
          opciones.length > 0
            ? `El valor debe ser una de las opciones permitidas: ${opciones.join(', ')}.`
            : 'El Item no permite valores fuera de la configuración.',
        );
      }
    }

    return texto;
  }

  // ====== Normalizar sexo clínico ======

  private normalizarSexoClinico(
    sexo: string | null | undefined,
  ): 'MASCULINO' | 'FEMENINO' | null {
    const valor = String(sexo ?? '')
      .trim()
      .toUpperCase();

    if (['MASCULINO', 'M', 'HOMBRE'].includes(valor)) {
      return 'MASCULINO';
    }

    if (['FEMENINO', 'F', 'MUJER'].includes(valor)) {
      return 'FEMENINO';
    }

    return null;
  }

  // ====== Calcular edad clínica ======

  private calcularEdadClinica(
    unidadEdad: 'DIAS' | 'MESES' | 'ANIOS',
  ): number | null {
    const fechaNacimiento = this.data.paciente.fechaNacimientoPaciente;
    const fechaReferencia = this.data.fechaReferencia;

    if (!fechaNacimiento || !fechaReferencia) {
      return null;
    }

    const nacimiento = new Date(fechaNacimiento);
    const referencia = new Date(fechaReferencia);

    if (
      Number.isNaN(nacimiento.getTime()) ||
      Number.isNaN(referencia.getTime())
    ) {
      return null;
    }

    const nacimientoUTC = Date.UTC(
      nacimiento.getUTCFullYear(),
      nacimiento.getUTCMonth(),
      nacimiento.getUTCDate(),
    );

    const referenciaUTC = Date.UTC(
      referencia.getUTCFullYear(),
      referencia.getUTCMonth(),
      referencia.getUTCDate(),
    );

    if (referenciaUTC < nacimientoUTC) {
      return null;
    }

    if (unidadEdad === 'DIAS') {
      const milisegundosDia = 24 * 60 * 60 * 1000;

      return Math.floor((referenciaUTC - nacimientoUTC) / milisegundosDia);
    }

    const anioNacimiento = nacimiento.getUTCFullYear();
    const mesNacimiento = nacimiento.getUTCMonth();
    const diaNacimiento = nacimiento.getUTCDate();

    const anioReferencia = referencia.getUTCFullYear();
    const mesReferencia = referencia.getUTCMonth();
    const diaReferencia = referencia.getUTCDate();

    if (unidadEdad === 'MESES') {
      let meses =
        (anioReferencia - anioNacimiento) * 12 +
        (mesReferencia - mesNacimiento);

      if (diaReferencia < diaNacimiento) {
        meses -= 1;
      }

      return Math.max(0, meses);
    }

    let anios = anioReferencia - anioNacimiento;

    const aunNoCumple =
      mesReferencia < mesNacimiento ||
      (mesReferencia === mesNacimiento && diaReferencia < diaNacimiento);

    if (aunNoCumple) {
      anios -= 1;
    }

    return Math.max(0, anios);
  }

  // ====== Validar contexto demográfico ======

  private configuracionAplicaPaciente(
    configuracion: IReferenciaResultadoSnapshot | IReglaAlertaSnapshot,
  ): boolean {
    if (configuracion.activo === false) {
      return false;
    }

    const sexoPaciente = this.normalizarSexoClinico(
      this.data.paciente.sexoPaciente,
    );

    const sexoReferencia = configuracion.sexo ?? 'TODOS';

    if (
      sexoReferencia !== 'TODOS' &&
      (!sexoPaciente || sexoReferencia !== sexoPaciente)
    ) {
      return false;
    }

    const tieneEdadMin =
      configuracion.edadMin !== null && configuracion.edadMin !== undefined;

    const tieneEdadMax =
      configuracion.edadMax !== null && configuracion.edadMax !== undefined;

    if (tieneEdadMin || tieneEdadMax) {
      const edad = this.calcularEdadClinica(
        configuracion.unidadEdad ?? 'ANIOS',
      );

      if (edad === null) {
        return false;
      }

      if (tieneEdadMin && edad < Number(configuracion.edadMin)) {
        return false;
      }

      if (tieneEdadMax && edad > Number(configuracion.edadMax)) {
        return false;
      }
    }

    return true;
  }

  // ====== Obtener referencias aplicables ======

  private obtenerReferenciasDemograficas(
    referencias: IReferenciaResultadoSnapshot[],
  ): IReferenciaResultadoSnapshot[] {
    let candidatas = referencias.filter((referencia) =>
      this.configuracionAplicaPaciente(referencia),
    );

    if (candidatas.length === 0) {
      return [];
    }

    const especificasSexo = candidatas.filter(
      (referencia) => (referencia.sexo ?? 'TODOS') !== 'TODOS',
    );

    if (especificasSexo.length > 0) {
      candidatas = especificasSexo;
    }

    const especificasEdad = candidatas.filter(
      (referencia) =>
        referencia.edadMin !== null || referencia.edadMax !== null,
    );

    if (especificasEdad.length > 0) {
      candidatas = especificasEdad;
    }

    return candidatas;
  }

  // ====== Convertir resultado numérico a intervalo ======

  private obtenerIntervaloResultadoNumerico(
    valor: Exclude<ValorResultadoLaboratorio, null>,
  ): IIntervaloNumericoLocal | null {
    if (typeof valor !== 'object') {
      const numero = Number(valor);
      if (!Number.isFinite(numero)) return null;
      return {
        minimo: numero,
        maximo: numero,
        incluyeMinimo: true,
        incluyeMaximo: true,
      };
    }

    if (valor.tipo === 'CUALITATIVO' || valor.tipo === 'HALLAZGOS') {
      return null;
    }

    if (valor.tipo === 'RANGO') {
      const desde = Number(valor.desde);
      const hasta = Number(valor.hasta);
      if (!Number.isFinite(desde) || !Number.isFinite(hasta) || desde > hasta) {
        return null;
      }
      return {
        minimo: desde,
        maximo: hasta,
        incluyeMinimo: true,
        incluyeMaximo: true,
      };
    }

    const limite = Number(valor.valor);
    if (!Number.isFinite(limite)) return null;

    if (valor.tipo === 'MAYOR_QUE') {
      return {
        minimo: limite,
        maximo: Number.POSITIVE_INFINITY,
        incluyeMinimo: false,
        incluyeMaximo: false,
      };
    }
    if (valor.tipo === 'MAYOR_IGUAL_QUE') {
      return {
        minimo: limite,
        maximo: Number.POSITIVE_INFINITY,
        incluyeMinimo: true,
        incluyeMaximo: false,
      };
    }
    if (valor.tipo === 'MENOR_QUE') {
      return {
        minimo: Number.NEGATIVE_INFINITY,
        maximo: limite,
        incluyeMinimo: false,
        incluyeMaximo: false,
      };
    }
    if (valor.tipo === 'MENOR_IGUAL_QUE') {
      return {
        minimo: Number.NEGATIVE_INFINITY,
        maximo: limite,
        incluyeMinimo: false,
        incluyeMaximo: true,
      };
    }

    return null;
  }

  private obtenerIntervaloReferenciaNumerica(
    referencia: IReferenciaResultadoSnapshot,
  ): IIntervaloNumericoLocal | null {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'RANGO') {
      const minimo = Number(referencia.valorMin);
      const maximo = Number(referencia.valorMax);
      if (
        !Number.isFinite(minimo) ||
        !Number.isFinite(maximo) ||
        minimo > maximo
      ) {
        return null;
      }
      return {
        minimo,
        maximo,
        incluyeMinimo: true,
        incluyeMaximo: true,
      };
    }

    const limite = Number(referencia.valorLimite);
    if (!Number.isFinite(limite)) return null;

    if (tipo === 'MENOR_QUE') {
      return {
        minimo: Number.NEGATIVE_INFINITY,
        maximo: limite,
        incluyeMinimo: false,
        incluyeMaximo: false,
      };
    }
    if (tipo === 'MENOR_IGUAL_QUE') {
      return {
        minimo: Number.NEGATIVE_INFINITY,
        maximo: limite,
        incluyeMinimo: false,
        incluyeMaximo: true,
      };
    }
    if (tipo === 'MAYOR_QUE') {
      return {
        minimo: limite,
        maximo: Number.POSITIVE_INFINITY,
        incluyeMinimo: false,
        incluyeMaximo: false,
      };
    }
    if (tipo === 'MAYOR_IGUAL_QUE') {
      return {
        minimo: limite,
        maximo: Number.POSITIVE_INFINITY,
        incluyeMinimo: true,
        incluyeMaximo: false,
      };
    }

    return null;
  }

  private intervaloContenido(
    resultado: IIntervaloNumericoLocal | null,
    referencia: IIntervaloNumericoLocal | null,
  ): boolean {
    if (!resultado || !referencia) return false;

    const cumpleMinimo =
      resultado.minimo > referencia.minimo ||
      (resultado.minimo === referencia.minimo &&
        (!resultado.incluyeMinimo || referencia.incluyeMinimo));
    const cumpleMaximo =
      resultado.maximo < referencia.maximo ||
      (resultado.maximo === referencia.maximo &&
        (!resultado.incluyeMaximo || referencia.incluyeMaximo));

    return cumpleMinimo && cumpleMaximo;
  }

  private direccionFueraIntervalo(
    resultado: IIntervaloNumericoLocal | null,
    referencia: IIntervaloNumericoLocal | null,
  ): IEvaluacionReferencia['estado'] {
    if (!resultado || !referencia) return 'FUERA_REFERENCIA';

    const violaMinimo = !(
      resultado.minimo > referencia.minimo ||
      (resultado.minimo === referencia.minimo &&
        (!resultado.incluyeMinimo || referencia.incluyeMinimo))
    );
    const violaMaximo = !(
      resultado.maximo < referencia.maximo ||
      (resultado.maximo === referencia.maximo &&
        (!resultado.incluyeMaximo || referencia.incluyeMaximo))
    );

    if (violaMinimo && !violaMaximo) return 'BAJO';
    if (violaMaximo && !violaMinimo) return 'ALTO';
    return 'FUERA_REFERENCIA';
  }

  private intervaloContieneValor(
    intervalo: IIntervaloNumericoLocal | null,
    valor: number,
  ): boolean {
    if (!intervalo || !Number.isFinite(valor)) return false;

    const cumpleMinimo =
      valor > intervalo.minimo ||
      (valor === intervalo.minimo && intervalo.incluyeMinimo);
    const cumpleMaximo =
      valor < intervalo.maximo ||
      (valor === intervalo.maximo && intervalo.incluyeMaximo);

    return cumpleMinimo && cumpleMaximo;
  }

  // ====== Comparar valor con referencia ======

  private valorCumpleReferencia(
    valor: Exclude<ValorResultadoLaboratorio, null>,
    referencia: IReferenciaResultadoSnapshot,
  ): boolean {
    const tipo = referencia.tipoReferencia;

    if (
      [
        'RANGO',
        'MENOR_QUE',
        'MENOR_IGUAL_QUE',
        'MAYOR_QUE',
        'MAYOR_IGUAL_QUE',
      ].includes(tipo)
    ) {
      return this.intervaloContenido(
        this.obtenerIntervaloResultadoNumerico(valor),
        this.obtenerIntervaloReferenciaNumerica(referencia),
      );
    }

    if (tipo === 'VALORES_PERMITIDOS') {
      const comparacion = this.normalizarTextoComparacion(valor);
      return (referencia.valoresPermitidos ?? []).some(
        (permitido) =>
          this.normalizarTextoComparacion(permitido) === comparacion,
      );
    }

    if (tipo === 'TEXTO') {
      const textoReferencia = this.normalizarTextoComparacion(
        referencia.textoReferencia,
      );
      return (
        Boolean(textoReferencia) &&
        this.normalizarTextoComparacion(valor) === textoReferencia
      );
    }

    return false;
  }

  // ====== Construir referencia aplicada ======

  private construirReferenciaAplicada(
    referencia: IReferenciaResultadoSnapshot,
  ): IReferenciaAplicada {
    return {
      descripcion: referencia.descripcion ?? '',
      sexo: referencia.sexo ?? 'TODOS',
      edadMin: referencia.edadMin ?? null,
      edadMax: referencia.edadMax ?? null,
      unidadEdad: referencia.unidadEdad ?? 'ANIOS',
      tipoReferencia: referencia.tipoReferencia,
      valorMin: referencia.valorMin ?? null,
      valorMax: referencia.valorMax ?? null,
      valorLimite: referencia.valorLimite ?? null,
      valoresPermitidos: [...(referencia.valoresPermitidos ?? [])],
      textoReferencia: referencia.textoReferencia ?? '',
    };
  }

  // ====== Clasificar valor fuera de referencia ======

  private evaluarFueraReferenciaUnica(
    valor: Exclude<ValorResultadoLaboratorio, null>,
    referencia: IReferenciaResultadoSnapshot,
  ): IEvaluacionReferencia['estado'] {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'VALORES_PERMITIDOS') return 'VALOR_NO_PERMITIDO';
    if (tipo === 'TEXTO') return 'FUERA_REFERENCIA';

    return this.direccionFueraIntervalo(
      this.obtenerIntervaloResultadoNumerico(valor),
      this.obtenerIntervaloReferenciaNumerica(referencia),
    );
  }

  // ====== Evaluar referencia ======

  private evaluarReferenciaLocal(
    referencias: IReferenciaResultadoSnapshot[],
    valor: Exclude<ValorResultadoLaboratorio, null>,
  ): IEvaluacionReferencia {
    const aplicables = this.obtenerReferenciasDemograficas(referencias);

    if (aplicables.length === 0) {
      return {
        estado: 'NO_APLICA',
        referenciaAplicada: null,
        mensaje: 'No existe una referencia clínica aplicable al paciente',
      };
    }

    const coincidencias = aplicables.filter((referencia) =>
      this.valorCumpleReferencia(valor, referencia),
    );

    if (coincidencias.length === 1) {
      const referencia = coincidencias[0];

      return {
        estado:
          referencia.tipoReferencia === 'VALORES_PERMITIDOS'
            ? 'VALOR_PERMITIDO'
            : 'DENTRO_REFERENCIA',
        referenciaAplicada: this.construirReferenciaAplicada(referencia),
        mensaje: referencia.descripcion
          ? `Resultado clasificado como: ${referencia.descripcion}`
          : 'Resultado dentro de la referencia clínica',
      };
    }

    if (coincidencias.length > 1) {
      return {
        estado: 'PENDIENTE',
        referenciaAplicada: null,
        mensaje:
          'El resultado coincide con más de una referencia clínica; revise la configuración histórica del Item',
      };
    }

    if (aplicables.length === 1) {
      const referencia = aplicables[0];
      const estado = this.evaluarFueraReferenciaUnica(valor, referencia);

      return {
        estado,
        referenciaAplicada: this.construirReferenciaAplicada(referencia),
        mensaje:
          estado === 'BAJO'
            ? 'Resultado por debajo de la referencia'
            : estado === 'ALTO'
              ? 'Resultado por encima de la referencia'
              : estado === 'VALOR_NO_PERMITIDO'
                ? 'El resultado no corresponde a los valores permitidos'
                : 'Resultado fuera de la referencia clínica',
      };
    }

    return {
      estado: 'FUERA_REFERENCIA',
      referenciaAplicada: null,
      mensaje:
        'El resultado no coincide con ninguna referencia clínica configurada',
    };
  }

  // ====== Obtener reglas de alerta aplicables ======

  private obtenerReglasAlertaAplicables(
    reglas: IReglaAlertaSnapshot[],
  ): IReglaAlertaSnapshot[] {
    return reglas.filter((regla) => this.configuracionAplicaPaciente(regla));
  }

  // ====== Evaluar regla de alerta ======

  private cumpleCondicionAlerta(
    item: IResultadoLaboratorioItem,
    valor: Exclude<ValorResultadoLaboratorio, null>,
    regla: IReglaAlertaSnapshot,
  ): boolean {
    if (
      item.tipoResultado === 'ESTRUCTURADO' ||
      (item.tipoResultado === 'NUMERICO' &&
        typeof valor === 'object' &&
        !Array.isArray(valor) &&
        valor.tipo === 'CUALITATIVO')
    ) {
      return false;
    }

    const condicionesNumericas = [
      'MENOR_QUE',
      'MENOR_IGUAL_QUE',
      'MAYOR_QUE',
      'MAYOR_IGUAL_QUE',
      'FUERA_DE_RANGO',
    ];

    if (condicionesNumericas.includes(regla.condicion)) {
      if (item.tipoResultado !== 'NUMERICO') {
        throw new Error(
          `La regla de alerta ${regla.descripcion || regla.condicion} requiere un resultado NUMERICO.`,
        );
      }

      const intervalo = this.obtenerIntervaloResultadoNumerico(valor);
      const valor1 = Number(regla.valor1);

      if (!intervalo || !Number.isFinite(valor1)) {
        throw new Error(
          `La regla de alerta ${regla.descripcion || regla.condicion} no posee un valor numérico válido.`,
        );
      }

      if (regla.condicion === 'MENOR_QUE') {
        return intervalo.minimo < valor1;
      }
      if (regla.condicion === 'MENOR_IGUAL_QUE') {
        return intervalo.minimo <= valor1;
      }
      if (regla.condicion === 'MAYOR_QUE') {
        return intervalo.maximo > valor1;
      }
      if (regla.condicion === 'MAYOR_IGUAL_QUE') {
        return intervalo.maximo >= valor1;
      }

      const valor2 = Number(regla.valor2);
      if (!Number.isFinite(valor2) || valor1 > valor2) {
        throw new Error(
          `La regla de alerta ${regla.descripcion || regla.condicion} posee un rango inválido.`,
        );
      }

      return intervalo.minimo < valor1 || intervalo.maximo > valor2;
    }

    if (regla.condicion === 'IGUAL_A' || regla.condicion === 'DISTINTO_DE') {
      let iguales: boolean;

      if (item.tipoResultado === 'NUMERICO') {
        const intervalo = this.obtenerIntervaloResultadoNumerico(valor);
        const valorRegla = Number(regla.valor1);
        if (!intervalo || !Number.isFinite(valorRegla)) {
          throw new Error(
            `La regla de alerta ${regla.descripcion || regla.condicion} no posee un valor numérico válido.`,
          );
        }
        iguales = this.intervaloContieneValor(intervalo, valorRegla);
      } else {
        iguales =
          this.normalizarTextoComparacion(valor) ===
          this.normalizarTextoComparacion(regla.valor1);
      }

      return regla.condicion === 'IGUAL_A' ? iguales : !iguales;
    }

    return false;
  }

  // ====== Detectar alertas ======

  private detectarAlertasLocal(
    item: IResultadoLaboratorioItem,
    reglas: IReglaAlertaSnapshot[],
    valor: Exclude<ValorResultadoLaboratorio, null>,
  ): IAlertaDetectada[] {
    const alertas: IAlertaDetectada[] = [];

    for (const regla of this.obtenerReglasAlertaAplicables(reglas)) {
      if (!this.cumpleCondicionAlerta(item, valor, regla)) {
        continue;
      }

      alertas.push({
        descripcion: regla.descripcion ?? '',
        condicion: regla.condicion,
        valor1: regla.valor1 ?? null,
        valor2: regla.valor2 ?? null,
        nivelAlerta: regla.nivelAlerta ?? 'ADVERTENCIA',
        mensaje: regla.mensaje ?? '',
        fechaDeteccion: new Date().toISOString(),
      });
    }

    return alertas;
  }

  // ====== Normalizar texto ======

  private normalizarTextoComparacion(valor: unknown): string {
    return String(valor ?? '')
      .trim()
      .toUpperCase();
  }

  // ====== Guardar prueba actual ======

  async guardar(): Promise<void> {
    if (this.procesando || !this.puedeEditarActual) {
      return;
    }

    const resultado = this.resultadoActual;

    let items;

    try {
      items = this.itemsForm.controls
        .map((grupo, indice) => {
          const itemOrigen = resultado.resultadosItems[indice];
          const raw = grupo.getRawValue();
          const valor = this.construirValorDesdeGrupo(grupo, itemOrigen);

          const observacion = this.esItemObservaciones(itemOrigen)
            ? String(itemOrigen.observacion ?? '').trim()
            : raw.observacionActiva
              ? raw.observacion.trim()
              : '';
          const valorOriginal = this.normalizarValorFormulario(
            itemOrigen.valor,
            itemOrigen,
          );
          const observacionOriginal = String(
            itemOrigen.observacion ?? '',
          ).trim();

          const cambioValor = !this.sonValoresEquivalentes(
            valor,
            valorOriginal,
          );
          const cambioObservacion = observacion !== observacionOriginal;
          const pendienteConValor =
            itemOrigen.estado === 'PENDIENTE' && valor !== null;

          if (!cambioValor && !cambioObservacion && !pendienteConValor) {
            return null;
          }

          if (valor === null) {
            return null;
          }

          return {
            itemResultadoId: raw.itemResultadoId,
            valor,
            observacion,
          };
        })
        .filter(
          (
            item,
          ): item is {
            itemResultadoId: string;
            valor: Exclude<ValorResultadoLaboratorio, null>;
            observacion: string;
          } => item !== null,
        );
    } catch (error: any) {
      await this._swal.fire({
        icon: 'warning',
        title: 'Resultado incompleto',
        text: error?.message || 'Revise los valores numéricos ingresados.',
        confirmButtonText: 'Cerrar',
      });
      return;
    }

    if (items.length === 0) {
      await this._swal.fire({
        icon: 'info',
        title: 'Sin cambios',
        text: 'No hay cambios para guardar en esta prueba.',
        confirmButtonText: 'Cerrar',
      });
      return;
    }

    this.procesando = true;

    const solicitudRegistro$ = this.esModoValidacion
      ? this._resultadoLaboratorioService.revisarResultadoAntesValidacion(
          resultado._id,
          { items },
        )
      : this._resultadoLaboratorioService.registrarResultadosMasivos(
          resultado._id,
          { items },
        );

    solicitudRegistro$.subscribe({
      next: async (response) => {
        const resultadoActualizado = this.construirResultadoActualizado(
          resultado,
          response,
        );

        this.resultados[this.indiceActual] = resultadoActualizado;
        this._resultadosActualizados.set(
          resultadoActualizado._id,
          resultadoActualizado,
        );
        this.ultimoEstadoSolicitud = response.estadoSolicitud;
        this.ultimoEstadoOperativo = response.estadoOperativo;
        this._borradores.delete(resultadoActualizado._id);
        this.procesando = false;

        await this._swal.fire({
          icon: 'success',
          title: this.esModoValidacion
            ? 'Cambios guardados'
            : response.estadoResultado === 'COMPLETO'
              ? 'Prueba completa'
              : 'Resultados registrados',
          text: this.esModoValidacion
            ? 'Los cambios del informe fueron guardados para validación.'
            : response.estadoResultado === 'COMPLETO'
              ? 'Los resultados fueron registrados correctamente. La prueba ya puede validarse.'
              : 'Los resultados fueron registrados correctamente.',
          confirmButtonText: 'Continuar',
        });

        if (this.esModoRegistro) {
          const salida: IRegistroResultadoDialogResult = {
            huboCambios: true,
            resultadosActualizados: Array.from(
              this._resultadosActualizados.values(),
            ),
            estadoSolicitud: response.estadoSolicitud,
            estadoOperativo: response.estadoOperativo,
          };

          this._dialogRef.close(salida);
          return;
        }

        this.formResultado = this.crearFormularioActual();
      },
      error: async (error) => {
        this.procesando = false;

        console.error('Error al guardar resultados:', error);

        await this._swal.fire({
          icon: 'error',
          title: this.esModoValidacion
            ? 'No se pudo actualizar el informe'
            : 'No se pudieron registrar los resultados',
          text:
            error?.error?.msg ||
            (this.esModoValidacion
              ? 'Ocurrió un error al actualizar el informe durante la validación.'
              : 'Ocurrió un error al registrar los resultados de laboratorio.'),
          confirmButtonText: 'Cerrar',
        });
      },
    });
  }

  // ====== Registrar pruebas seleccionadas ======

  async registrarSeleccionadas(): Promise<void> {
    if (
      !this.esModoRegistro ||
      this.data.puedeRegistrar === false ||
      this.cantidadSeleccionadosRegistro === 0 ||
      this.procesando
    ) {
      return;
    }

    this.guardarBorradorActual();

    const operaciones = this.resultados
      .map((resultado, indice) => ({
        resultado,
        indice,
        items: this.construirItemsModificadosDesdeBorrador(resultado),
      }))
      .filter(
        ({ resultado, indice, items }) =>
          this._seleccionRegistro.has(resultado._id) &&
          this.puedeSeleccionarParaRegistro(resultado, indice) &&
          items.length > 0,
      );

    if (operaciones.length === 0) {
      await this._swal.fire({
        icon: 'info',
        title: 'Sin cambios por registrar',
        text: 'Las pruebas seleccionadas no contienen cambios pendientes de registro.',
        confirmButtonText: 'Cerrar',
      });
      return;
    }

    this.procesando = true;
    let registradas = 0;

    try {
      for (const operacion of operaciones) {
        const response = await firstValueFrom(
          this._resultadoLaboratorioService.registrarResultadosMasivos(
            operacion.resultado._id,
            { items: operacion.items },
          ),
        );

        const actualizado = this.construirResultadoActualizado(
          this.resultados[operacion.indice],
          response,
        );

        this.resultados[operacion.indice] = actualizado;
        this._resultadosActualizados.set(actualizado._id, actualizado);
        this._borradores.delete(actualizado._id);
        this._seleccionRegistro.delete(actualizado._id);
        this.ultimoEstadoSolicitud = response.estadoSolicitud;
        this.ultimoEstadoOperativo = response.estadoOperativo;
        registradas += 1;
      }

      this.formResultado = this.crearFormularioActual();

      await this._swal.fire({
        icon: 'success',
        title: 'Pruebas registradas',
        text: `${registradas} prueba(s) fueron registradas correctamente. Puede continuar con las pruebas pendientes o cerrar.`,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      this.formResultado = this.crearFormularioActual();

      const detalleError =
        error?.error?.msg ||
        'Ocurrió un error al registrar las pruebas seleccionadas.';

      await this._swal.fire({
        icon: 'error',
        title: 'No se pudieron registrar todas las pruebas',
        text:
          registradas > 0
            ? `${registradas} prueba(s) se registraron antes de producirse el error. El proceso se detuvo: ${detalleError}`
            : detalleError,
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Cambios de un resultado durante validación ======

  private construirItemsModificadosDesdeBorrador(
    resultado: IResultadoLaboratorio,
  ): Array<{
    itemResultadoId: string;
    valor: Exclude<ValorResultadoLaboratorio, null>;
    observacion: string;
  }> {
    const borrador = this._borradores.get(resultado._id);

    if (!borrador) {
      return [];
    }

    return resultado.resultadosItems
      .map((item, indice) => {
        const itemBorrador = borrador[indice];

        if (!itemBorrador) {
          return null;
        }

        const valor = this.normalizarValorFormulario(itemBorrador.valor, item);
        const valorOriginal = this.normalizarValorFormulario(item.valor, item);
        const observacion = String(itemBorrador.observacion ?? '').trim();
        const observacionOriginal = String(item.observacion ?? '').trim();

        if (
          valor === null ||
          (this.sonValoresEquivalentes(valor, valorOriginal) &&
            observacion === observacionOriginal)
        ) {
          return null;
        }

        return {
          itemResultadoId: item._id,
          valor,
          observacion,
        };
      })
      .filter(
        (
          item,
        ): item is {
          itemResultadoId: string;
          valor: Exclude<ValorResultadoLaboratorio, null>;
          observacion: string;
        } => item !== null,
      );
  }

  private async guardarCambiosValidacionIndice(indice: number): Promise<void> {
    const resultado = this.resultados[indice];

    if (!resultado || resultado.estadoResultado !== 'COMPLETO') {
      return;
    }

    const items = this.construirItemsModificadosDesdeBorrador(resultado);

    if (items.length === 0) {
      return;
    }

    const response = await firstValueFrom(
      this._resultadoLaboratorioService.revisarResultadoAntesValidacion(
        resultado._id,
        { items },
      ),
    );

    const actualizado = this.construirResultadoActualizado(resultado, response);
    this.resultados[indice] = actualizado;
    this._resultadosActualizados.set(actualizado._id, actualizado);
    this._borradores.delete(actualizado._id);
    this.ultimoEstadoSolicitud = response.estadoSolicitud;
    this.ultimoEstadoOperativo = response.estadoOperativo;
  }

  private fusionarResultadoCompleto(
    origen: IResultadoLaboratorio,
    actualizado: IResultadoLaboratorio,
  ): IResultadoLaboratorio {
    const itemsOrigen = new Map(
      origen.resultadosItems.map((item) => [item._id, item]),
    );

    return {
      ...origen,
      ...actualizado,
      habilitacionMuestra:
        actualizado.habilitacionMuestra ?? origen.habilitacionMuestra,
      resultadosItems: actualizado.resultadosItems.map((item) => ({
        ...itemsOrigen.get(item._id),
        ...item,
        configuracionClinica:
          item.configuracionClinica ??
          itemsOrigen.get(item._id)?.configuracionClinica,
      })),
    };
  }

  private obtenerCriticasResultado(resultado: IResultadoLaboratorio): number {
    return resultado.resultadosItems.reduce(
      (total, item) =>
        total +
        (item.alertasDetectadas ?? []).filter(
          (alerta) => alerta.nivelAlerta === 'CRITICA',
        ).length,
      0,
    );
  }

  private async confirmarValidacion(
    resultados: IResultadoLaboratorio[],
  ): Promise<{
    confirmado: boolean;
    observacionValidacion: string;
    confirmarAlertasCriticas: boolean;
  }> {
    const totalCriticas = resultados.reduce(
      (total, resultado) => total + this.obtenerCriticasResultado(resultado),
      0,
    );

    const nombres = resultados
      .map(
        (resultado) =>
          `${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}`,
      )
      .join('<br>');

    const confirmacion = await this._swal.fire({
      icon: totalCriticas > 0 ? 'warning' : 'question',
      title:
        resultados.length > 1
          ? `Validar ${resultados.length} resultados`
          : totalCriticas > 0
            ? 'Resultado con alerta crítica'
            : 'Validar resultado',
      html: `
        <div style="text-align:left">
          <p>${nombres}</p>
          ${
            totalCriticas > 0
              ? `<p>Se detectaron <strong>${totalCriticas}</strong> alerta(s) CRÍTICA(s). Revise los valores antes de validar.</p>`
              : '<p>Confirme la revisión clínica del informe.</p>'
          }
          <textarea id="observacion-validacion-dialog" class="swal2-textarea" placeholder="Observación de validación (opcional)"></textarea>
          ${
            totalCriticas > 0
              ? `<label style="display:flex; gap:8px; align-items:flex-start; margin-top:12px"><input id="confirmar-criticas-dialog" type="checkbox" style="margin-top:4px" /><span>Confirmo que revisé las alertas críticas y los valores ingresados.</span></label>`
              : ''
          }
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText:
        resultados.length > 1 ? 'Validar resultados' : 'Validar resultado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7e22ce',
      preConfirm: () => {
        const observacion = document.querySelector<HTMLTextAreaElement>(
          '#observacion-validacion-dialog',
        );
        const confirmacionCritica = document.querySelector<HTMLInputElement>(
          '#confirmar-criticas-dialog',
        );

        if (totalCriticas > 0 && !confirmacionCritica?.checked) {
          Swal.showValidationMessage(
            'Debe confirmar explícitamente la revisión de las alertas críticas.',
          );
          return false;
        }

        return {
          observacionValidacion: observacion?.value?.trim() ?? '',
          confirmarAlertasCriticas: totalCriticas > 0,
        };
      },
    });

    if (!confirmacion.isConfirmed || !confirmacion.value) {
      return {
        confirmado: false,
        observacionValidacion: '',
        confirmarAlertasCriticas: false,
      };
    }

    return {
      confirmado: true,
      ...confirmacion.value,
    };
  }

  // ====== Validar prueba actual ======

  async validarPruebaActual(): Promise<void> {
    if (!this.puedeValidarActual || this.procesando) {
      return;
    }

    this.guardarBorradorActual();
    this.procesando = true;

    try {
      await this.guardarCambiosValidacionIndice(this.indiceActual);
      const resultado = this.resultadoActual;
      const confirmacion = await this.confirmarValidacion([resultado]);

      if (!confirmacion.confirmado) {
        return;
      }

      const response = await firstValueFrom(
        this._resultadoLaboratorioService.validarResultado(resultado._id, {
          observacionValidacion: confirmacion.observacionValidacion,
          confirmarAlertasCriticas: confirmacion.confirmarAlertasCriticas,
        }),
      );

      const actualizado = this.fusionarResultadoCompleto(
        resultado,
        response.resultado,
      );

      this.resultados[this.indiceActual] = actualizado;
      this._resultadosActualizados.set(actualizado._id, actualizado);
      this._seleccionValidacion.delete(actualizado._id);
      this.ultimoEstadoSolicitud = response.estadoSolicitud;
      this.ultimoEstadoOperativo = response.estadoOperativo;
      this._borradores.delete(actualizado._id);
      this.formResultado = this.crearFormularioActual();

      await this._swal.fire({
        icon: response.resumenAlertas.criticas > 0 ? 'warning' : 'success',
        title: 'Resultado validado',
        text: response.msg,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#7e22ce',
      });

      const salida: IRegistroResultadoDialogResult = {
        huboCambios: true,
        resultadosActualizados: Array.from(
          this._resultadosActualizados.values(),
        ),
        estadoSolicitud: response.estadoSolicitud,
        estadoOperativo: response.estadoOperativo,
      };

      this._dialogRef.close(salida);
    } catch (error: any) {
      await this._swal.fire({
        icon: 'error',
        title: 'No se pudo validar el resultado',
        text:
          error?.error?.msg ||
          'Ocurrió un error al revisar o validar el resultado.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Validar pruebas seleccionadas ======

  async validarSeleccionadas(): Promise<void> {
    if (
      !this.esModoValidacion ||
      this.data.puedeValidar !== true ||
      this.cantidadSeleccionadosValidacion === 0 ||
      this.procesando
    ) {
      return;
    }

    this.guardarBorradorActual();
    this.procesando = true;

    try {
      const idsSeleccionados = new Set(this._seleccionValidacion);

      for (let indice = 0; indice < this.resultados.length; indice += 1) {
        const resultado = this.resultados[indice];

        if (
          resultado.estadoResultado === 'COMPLETO' &&
          idsSeleccionados.has(resultado._id)
        ) {
          await this.guardarCambiosValidacionIndice(indice);
        }
      }

      const candidatos = this.resultados.filter(
        (resultado) =>
          resultado.estadoResultado === 'COMPLETO' &&
          idsSeleccionados.has(resultado._id),
      );

      if (candidatos.length === 0) {
        this._snackBar.open(
          'No quedan resultados seleccionados por validar.',
          'Cerrar',
          {
            duration: 2200,
          },
        );
        return;
      }

      const confirmacion = await this.confirmarValidacion(candidatos);

      if (!confirmacion.confirmado) {
        return;
      }

      const response = await firstValueFrom(
        this._resultadoLaboratorioService.validarResultadosMasivamente({
          resultadoIds: candidatos.map((resultado) => resultado._id),
          observacionValidacion: confirmacion.observacionValidacion,
          confirmarAlertasCriticas: confirmacion.confirmarAlertasCriticas,
        }),
      );

      response.resultados.forEach((resultadoBackend) => {
        const indice = this.resultados.findIndex(
          (resultado) => resultado._id === resultadoBackend._id,
        );

        if (indice < 0) {
          return;
        }

        const actualizado = this.fusionarResultadoCompleto(
          this.resultados[indice],
          resultadoBackend,
        );
        this.resultados[indice] = actualizado;
        this._resultadosActualizados.set(actualizado._id, actualizado);
        this._borradores.delete(actualizado._id);
        this._seleccionValidacion.delete(actualizado._id);
      });

      this.ultimoEstadoSolicitud = response.estadoSolicitud;
      this.ultimoEstadoOperativo = response.estadoOperativo;
      this.formResultado = this.crearFormularioActual();

      await this._swal.fire({
        icon: response.resumenAlertas.criticas > 0 ? 'warning' : 'success',
        title: 'Resultados validados',
        text: response.msg,
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#7e22ce',
      });

      const salida: IRegistroResultadoDialogResult = {
        huboCambios: true,
        resultadosActualizados: Array.from(
          this._resultadosActualizados.values(),
        ),
        estadoSolicitud: response.estadoSolicitud,
        estadoOperativo: response.estadoOperativo,
      };

      this._dialogRef.close(salida);
    } catch (error: any) {
      await this._swal.fire({
        icon: 'error',
        title: 'No se pudieron validar los resultados',
        text:
          error?.error?.msg || 'Ocurrió un error durante la validación masiva.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Anular resultado desde la revisión ======

  async anularPruebaActual(): Promise<void> {
    const resultado = this.resultadoActual;

    if (!this.puedeAnularActual || this.procesando) {
      return;
    }

    const requiereSegundoUsuario = resultado.estadoResultado === 'LIBERADO';
    let motivoAnulacion = '';
    let nombreUsuarioAutorizador: string | undefined;
    let passwordAutorizador: string | undefined;

    if (requiereSegundoUsuario) {
      const confirmacion = await this._swal.fire({
        icon: 'warning',
        title: 'Anular resultado liberado',
        html: `
          <div style="text-align:left">
            <p>Está revisando <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong>.</p>
            <p>El resultado ya fue LIBERADO y pudo haber sido entregado. Se requiere autorización de un segundo usuario.</p>
            <textarea id="motivo-anulacion-dialog" class="swal2-textarea" placeholder="Motivo obligatorio"></textarea>
            <input id="usuario-autorizador-dialog" class="swal2-input" placeholder="Usuario autorizador" autocomplete="off" />
            <input id="password-autorizador-dialog" class="swal2-input" type="password" placeholder="Contraseña autorizador" autocomplete="new-password" />
          </div>
        `,
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Anular resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b91c1c',
        preConfirm: () => {
          const motivo = document
            .querySelector<HTMLTextAreaElement>('#motivo-anulacion-dialog')
            ?.value?.trim();
          const usuario = document
            .querySelector<HTMLInputElement>('#usuario-autorizador-dialog')
            ?.value?.trim();
          const password = document.querySelector<HTMLInputElement>(
            '#password-autorizador-dialog',
          )?.value;

          if (!motivo || !usuario || !password) {
            Swal.showValidationMessage(
              'Motivo, usuario autorizador y contraseña son obligatorios.',
            );
            return false;
          }

          return { motivo, usuario, password };
        },
      });

      if (!confirmacion.isConfirmed || !confirmacion.value) {
        return;
      }

      motivoAnulacion = confirmacion.value.motivo;
      nombreUsuarioAutorizador = confirmacion.value.usuario;
      passwordAutorizador = confirmacion.value.password;
    } else {
      const confirmacion = await this._swal.fire({
        icon: 'warning',
        title: 'Anular resultado',
        html: `Se anulará <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong>. Los valores actuales se conservarán en el historial.`,
        input: 'textarea',
        inputLabel: 'Motivo de anulación',
        inputValidator: (value) =>
          String(value ?? '').trim()
            ? null
            : 'El motivo de anulación es obligatorio',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Anular resultado',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#b91c1c',
      });

      if (!confirmacion.isConfirmed) {
        return;
      }

      motivoAnulacion = String(confirmacion.value ?? '').trim();
    }

    this.procesando = true;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.anularResultado(resultado._id, {
          motivoAnulacion,
          ...(nombreUsuarioAutorizador ? { nombreUsuarioAutorizador } : {}),
          ...(passwordAutorizador ? { passwordAutorizador } : {}),
        }),
      );

      const actualizado = this.fusionarResultadoCompleto(
        resultado,
        response.resultado,
      );
      this.resultados[this.indiceActual] = actualizado;
      this._resultadosActualizados.set(actualizado._id, actualizado);
      this.ultimoEstadoSolicitud = response.estadoSolicitud;
      this.ultimoEstadoOperativo = response.estadoOperativo;
      this.formResultado = this.crearFormularioActual();

      await this._swal.fire({
        icon: 'success',
        title: 'Resultado anulado',
        text: response.msg,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      await this._swal.fire({
        icon: 'error',
        title: 'No se pudo anular el resultado',
        text: error?.error?.msg || 'Ocurrió un error al anular el resultado.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Reabrir resultado anulado ======

  async reabrirPruebaActual(): Promise<void> {
    const resultado = this.resultadoActual;

    if (!this.puedeReabrirActual || this.procesando) {
      return;
    }

    const confirmacion = await this._swal.fire({
      icon: 'question',
      title: 'Reabrir resultado',
      html: `
        <div style="text-align:left">
          <p>Se iniciará un nuevo ciclo de registro para <strong>${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}</strong>.</p>
          <p>El informe anulado permanecerá íntegro en el historial. La muestra física no será modificada.</p>
          <p>Si la muestra vigente continúa ACEPTADA, podrá registrar los nuevos resultados inmediatamente.</p>
        </div>
      `,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText: 'Reabrir resultado',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0b63c7',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this.procesando = true;

    try {
      const response = await firstValueFrom(
        this._resultadoLaboratorioService.reabrirResultado(resultado._id),
      );

      const actualizado = this.fusionarResultadoCompleto(
        resultado,
        response.resultado,
      );
      this.resultados[this.indiceActual] = actualizado;
      this._resultadosActualizados.set(actualizado._id, actualizado);
      this.ultimoEstadoSolicitud = response.estadoSolicitud;
      this.ultimoEstadoOperativo = response.estadoOperativo;
      this._borradores.delete(actualizado._id);

      if (this.data.puedeRegistrar !== false) {
        this.modoActual = 'REGISTRO';
      } else {
        this.modoActual = 'CONSULTA';
      }

      this.formResultado = this.crearFormularioActual();

      await this._swal.fire({
        icon: 'success',
        title: 'Resultado reabierto',
        text: response.msg,
        confirmButtonText: 'Continuar',
      });
    } catch (error: any) {
      await this._swal.fire({
        icon: 'error',
        title: 'No se pudo reabrir el resultado',
        text: error?.error?.msg || 'Ocurrió un error al reabrir el resultado.',
        confirmButtonText: 'Cerrar',
      });
    } finally {
      this.procesando = false;
    }
  }

  // ====== Cerrar ======

  async cerrar(): Promise<void> {
    if (this.procesando) {
      return;
    }

    this.guardarBorradorActual();

    if (this.hayCambiosSinGuardar()) {
      const confirmacion = await this._swal.fire({
        icon: 'warning',
        title: 'Hay cambios sin guardar',
        text: 'Los valores digitados que no fueron registrados se perderán al cerrar.',
        showCancelButton: true,
        reverseButtons: true,
        confirmButtonText: 'Cerrar sin guardar',
        cancelButtonText: 'Continuar registrando',
      });

      if (!confirmacion.isConfirmed) {
        return;
      }
    }

    if (
      this._resultadosActualizados.size > 0 &&
      this.ultimoEstadoSolicitud &&
      this.ultimoEstadoOperativo
    ) {
      const salida: IRegistroResultadoDialogResult = {
        huboCambios: true,
        resultadosActualizados: Array.from(
          this._resultadosActualizados.values(),
        ),
        estadoSolicitud: this.ultimoEstadoSolicitud,
        estadoOperativo: this.ultimoEstadoOperativo,
      };

      this._dialogRef.close(salida);
      return;
    }

    this._dialogRef.close();
  }

  // ====== Borradores ======

  private guardarBorradorActual(): void {
    const resultado = this.resultadoActual;

    if (!resultado || !this.esResultadoEditable(resultado)) {
      return;
    }

    const borrador = this.itemsForm.controls.map((grupo, indice) => {
      const raw = grupo.getRawValue();
      const item = resultado.resultadosItems[indice];
      let valor: ValorResultadoLaboratorio = null;

      try {
        valor = this.construirValorDesdeGrupo(grupo, item);
      } catch {
        valor = null;
      }

      const observacionActiva =
        !this.esItemObservaciones(item) && raw.observacionActiva;

      return {
        valor,
        observacionActiva,
        observacion: this.esItemObservaciones(item)
          ? String(item.observacion ?? '')
          : observacionActiva
            ? raw.observacion
            : '',
      };
    });

    this._borradores.set(resultado._id, borrador);
  }

  private hayCambiosSinGuardar(): boolean {
    for (const resultado of this.resultados) {
      const borrador = this._borradores.get(resultado._id);

      if (!borrador) {
        continue;
      }

      const existeCambio = resultado.resultadosItems.some((item, indice) => {
        const itemBorrador = borrador[indice];

        if (!itemBorrador) {
          return false;
        }

        const valorBorrador = this.normalizarValorFormulario(
          itemBorrador.valor,
          item,
        );
        const valorOriginal = this.normalizarValorFormulario(item.valor, item);

        return (
          !this.sonValoresEquivalentes(valorBorrador, valorOriginal) ||
          itemBorrador.observacion.trim() !==
            String(item.observacion ?? '').trim()
        );
      });

      if (existeCambio) {
        return true;
      }
    }

    return false;
  }

  // ====== Normalizar valor ======

  private normalizarValorFormulario(
    valor: ValorResultadoLaboratorio | undefined,
    item: IResultadoLaboratorioItem,
  ): ValorResultadoLaboratorio {
    if (valor === null || valor === undefined) return null;

    if (item.tipoResultado === 'NUMERICO') {
      if (valor === '') return null;

      if (typeof valor !== 'object') {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : null;
      }

      if (valor.tipo === 'CUALITATIVO') {
        const texto = String(valor.valor ?? '').trim();
        return texto ? { tipo: 'CUALITATIVO', valor: texto } : null;
      }

      if (valor.tipo === 'RANGO') {
        const desde = Number(valor.desde);
        const hasta = Number(valor.hasta);
        if (
          !Number.isFinite(desde) ||
          !Number.isFinite(hasta) ||
          desde > hasta
        ) {
          return null;
        }
        return { tipo: 'RANGO', desde, hasta };
      }

      if ('valor' in valor) {
        const numero = Number(valor.valor);
        if (!Number.isFinite(numero)) return null;
        return { tipo: valor.tipo, valor: numero };
      }

      return null;
    }

    if (item.tipoResultado === 'ESTRUCTURADO') {
      if (
        typeof valor !== 'object' ||
        Array.isArray(valor) ||
        valor.tipo !== 'HALLAZGOS'
      ) {
        return null;
      }

      return JSON.parse(JSON.stringify(valor)) as ValorResultadoLaboratorio;
    }

    const texto = String(valor).trim();
    return texto ? texto : null;
  }

  private sonValoresEquivalentes(
    valorA: ValorResultadoLaboratorio | undefined,
    valorB: ValorResultadoLaboratorio | undefined,
  ): boolean {
    const vacioA = valorA === null || valorA === undefined || valorA === '';
    const vacioB = valorB === null || valorB === undefined || valorB === '';

    if (vacioA && vacioB) return true;
    if (vacioA || vacioB) return false;

    if (typeof valorA === 'object' || typeof valorB === 'object') {
      return JSON.stringify(valorA) === JSON.stringify(valorB);
    }

    return String(valorA) === String(valorB);
  }

  // ====== Construir resultado actualizado ======

  private construirResultadoActualizado(
    resultadoOrigen: IResultadoLaboratorio,
    response: IRegistrarResultadosMasivosResponse,
  ): IResultadoLaboratorio {
    const itemsActualizados = new Map(
      response.items.map((item) => [item._id, item]),
    );

    return {
      ...resultadoOrigen,
      estadoResultado: response.estadoResultado,
      estadoUnidadLaboratorio: response.estadoUnidadLaboratorio,
      habilitacionMuestra:
        response.habilitacionMuestra ?? resultadoOrigen.habilitacionMuestra,
      versionResultado:
        response.versionResultado ?? resultadoOrigen.versionResultado,
      historialEventos:
        response.historialEventos ?? resultadoOrigen.historialEventos,
      resultadosItems: resultadoOrigen.resultadosItems.map((item) => {
        const actualizado = itemsActualizados.get(item._id);

        if (!actualizado) {
          return item;
        }

        return {
          ...item,
          ...actualizado,
          configuracionClinica:
            actualizado.configuracionClinica ?? item.configuracionClinica,
        };
      }),
    };
  }

  // ====== Estado editable ======

  private esResultadoEditable(resultado: IResultadoLaboratorio): boolean {
    return ['PENDIENTE', 'EN PROCESO', 'COMPLETO'].includes(
      resultado?.estadoResultado,
    );
  }

  // ====== Presentación de evaluación ======

  esHallazgoEstructuradoFueraReferencia(
    item: IResultadoLaboratorioItem,
  ): boolean {
    return (
      item.tipoResultado === 'ESTRUCTURADO' &&
      this.obtenerEvaluacionVisible(item)?.estado === 'VALOR_NO_PERMITIDO'
    );
  }

  obtenerTextoEvaluacionItem(
    item: IResultadoLaboratorioItem,
    evaluacion: IEvaluacionReferencia | null,
  ): string {
    if (!evaluacion) {
      return '';
    }

    if (item.tipoResultado === 'ESTRUCTURADO') {
      if (evaluacion.estado === 'VALOR_NO_PERMITIDO') {
        return 'Hallazgo presente · fuera del valor esperado';
      }

      if (evaluacion.estado === 'VALOR_PERMITIDO') {
        return String(evaluacion.mensaje ?? '').includes(
          'hallazgos registrados',
        )
          ? 'Resultado esperado · hallazgos considerados normales'
          : 'Resultado esperado · sin hallazgos';
      }
    }

    if (item.tipoResultado === 'TEXTO') {
      const esperado = String(
        evaluacion.referenciaAplicada?.textoReferencia ?? '',
      ).trim();

      if (evaluacion.estado === 'FUERA_REFERENCIA' && esperado) {
        return `Resultado diferente al valor esperado: ${esperado}`;
      }

      return '';
    }

    if (
      item.tipoResultado === 'CATEGORICO' &&
      evaluacion.referenciaAplicada?.descripcion === 'Valor de referencia'
    ) {
      return evaluacion.estado === 'VALOR_PERMITIDO'
        ? 'Resultado esperado'
        : evaluacion.estado === 'VALOR_NO_PERMITIDO'
          ? 'Resultado fuera de los valores esperados'
          : this.obtenerTextoEvaluacion(evaluacion);
    }

    return this.obtenerTextoEvaluacion(evaluacion);
  }

  obtenerClaseEvaluacionItem(
    item: IResultadoLaboratorioItem,
    evaluacion: IEvaluacionReferencia | null,
  ): string {
    if (
      item.tipoResultado === 'ESTRUCTURADO' &&
      evaluacion?.estado === 'VALOR_NO_PERMITIDO'
    ) {
      return 'evaluacion evaluacion-precaucion';
    }

    if (
      item.tipoResultado === 'ESTRUCTURADO' &&
      evaluacion?.estado === 'VALOR_PERMITIDO'
    ) {
      return 'evaluacion evaluacion-normal';
    }

    if (
      item.tipoResultado === 'TEXTO' &&
      evaluacion?.estado === 'FUERA_REFERENCIA'
    ) {
      return 'evaluacion evaluacion-precaucion';
    }

    return this.obtenerClaseEvaluacion(evaluacion);
  }

  obtenerTextoEvaluacion(evaluacion: IEvaluacionReferencia | null): string {
    if (!evaluacion) {
      return '';
    }

    const descripcion = String(
      evaluacion.referenciaAplicada?.descripcion ?? '',
    ).trim();

    if (descripcion) {
      return `Resultado clasificado como: ${descripcion}`;
    }

    const textosPorEstado: Partial<
      Record<IEvaluacionReferencia['estado'], string>
    > = {
      ALTO: 'Resultado clasificado como: Alto',
      BAJO: 'Resultado clasificado como: Bajo',
      FUERA_REFERENCIA: 'Resultado fuera de referencia',
      VALOR_NO_PERMITIDO: 'Resultado no permitido por la referencia',
      VALOR_PERMITIDO: 'Resultado clasificado como: Permitido',
      DENTRO_REFERENCIA: 'Resultado dentro de referencia',
      NO_APLICA: 'No existe una referencia clínica aplicable al paciente',
      PENDIENTE: evaluacion.mensaje || 'Evaluación clínica pendiente',
    };

    return textosPorEstado[evaluacion.estado] ?? evaluacion.mensaje ?? '';
  }

  obtenerClaseEvaluacion(evaluacion: IEvaluacionReferencia | null): string {
    if (!evaluacion) {
      return 'evaluacion evaluacion-neutra';
    }

    const estado = evaluacion.estado;

    if (
      ['ALTO', 'BAJO', 'FUERA_REFERENCIA', 'VALOR_NO_PERMITIDO'].includes(
        estado,
      )
    ) {
      return 'evaluacion evaluacion-critica';
    }

    const descripcion = this.normalizarClasificacionVisual(
      evaluacion.referenciaAplicada?.descripcion ?? '',
    );

    if (descripcion) {
      if (
        [
          'MUY ALTO',
          'MUY ELEVADO',
          'ALTO',
          'ELEVADO',
          'CRITICO',
          'CRITICA',
          'SEVERO',
          'SEVERA',
        ].some((termino) => descripcion.includes(termino))
      ) {
        return 'evaluacion evaluacion-critica';
      }

      if (
        [
          'INTERMEDIO',
          'LIMITROFE',
          'LIMITE',
          'MODERADO',
          'MODERADA',
          'BORDERLINE',
        ].some((termino) => descripcion.includes(termino))
      ) {
        return 'evaluacion evaluacion-precaucion';
      }

      if (
        ['NORMAL', 'DESEABLE', 'OPTIMO', 'OPTIMA', 'ADECUADO', 'ADECUADA'].some(
          (termino) => descripcion.includes(termino),
        )
      ) {
        return 'evaluacion evaluacion-normal';
      }

      return 'evaluacion evaluacion-neutra';
    }

    if (['DENTRO_REFERENCIA', 'VALOR_PERMITIDO'].includes(estado)) {
      return 'evaluacion evaluacion-normal';
    }

    return 'evaluacion evaluacion-neutra';
  }

  private normalizarClasificacionVisual(valor: string): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private limpiarSuscripcionesEvaluacion(): void {
    while (this._suscripcionesEvaluacion.length > 0) {
      this._suscripcionesEvaluacion.pop()?.unsubscribe();
    }
  }
}
