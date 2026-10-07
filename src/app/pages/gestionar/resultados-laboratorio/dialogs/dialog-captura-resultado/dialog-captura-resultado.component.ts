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
import { MatTooltipModule } from '@angular/material/tooltip';
import { distinctUntilChanged, firstValueFrom, startWith, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { IEstadoOperativoSolicitud } from '../../../../../models/Gestion/estadoOperativoSolicitud.models';
import {
  IAlertaDetectada,
  IEvaluacionReferencia,
  IHabilitacionMuestraResultado,
  IReferenciaAplicada,
  IReferenciaResultadoSnapshot,
  IRegistrarResultadosMasivosResponse,
  IReglaAlertaSnapshot,
  IResultadoLaboratorio,
  IResultadoLaboratorioItem,
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

interface IItemResultadoForm {
  itemResultadoId: FormControl<string>;
  selectorResultado: FormControl<string>;
  valor: FormControl<string | number | null>;
  observacion: FormControl<string>;
}

interface IBorradorItemResultado {
  valor: string | number | null;
  observacion: string;
}


interface IEvaluacionLocalItem {
  valorNormalizado: string | number;
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

  private readonly _previsualizaciones = new Map<string, IEvaluacionLocalItem>();

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

    return this._fb.group<IItemResultadoForm>({
      itemResultadoId: this._fb.nonNullable.control(item._id),
      selectorResultado: this._fb.nonNullable.control(
        this.obtenerSeleccionInicialResultado(item, valorInicial),
      ),
      valor: this._fb.control<string | number | null>(valorInicial),
      observacion: this._fb.nonNullable.control(
        borrador ? borrador.observacion : (item.observacion ?? ''),
      ),
    });
  }

  // ====== Valor inicial y opciones de captura ======

  private obtenerValorInicialResultado(
    item: IResultadoLaboratorioItem,
  ): string | number | null {
    if (item.valor !== null && item.valor !== undefined && item.valor !== '') {
      return item.valor;
    }

    if (item.tipoResultado !== 'TEXTO') {
      return '';
    }

    const referenciaTexto = (
      item.configuracionClinica?.referenciasResultado ?? []
    ).find(
      (referencia) =>
        referencia.activo !== false &&
        referencia.tipoReferencia === 'TEXTO' &&
        String(referencia.textoReferencia ?? '').trim(),
    );

    return String(referenciaTexto?.textoReferencia ?? '').trim();
  }

  usaSelectorResultado(item: IResultadoLaboratorioItem): boolean {
    return (
      item.tipoResultado !== 'NUMERICO' &&
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
    valor: string | number | null,
  ): string {
    if (!this.usaSelectorResultado(item)) {
      return '';
    }

    const texto = String(valor ?? '').trim();

    if (!texto) {
      return '';
    }

    const encontrada = this.obtenerOpcionesResultado(item).find(
      (opcion) =>
        String(opcion).trim().toUpperCase() === texto.toUpperCase(),
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
        const suscripcionSelector = grupo.controls.selectorResultado.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe((seleccion) => {
            if (seleccion === this.valorOtroResultado) {
              const valorActual = String(grupo.controls.valor.value ?? '').trim();
              const correspondeALista = this.obtenerOpcionesResultado(item).some(
                (opcion) =>
                  String(opcion).trim().toUpperCase() ===
                  valorActual.toUpperCase(),
              );

              if (correspondeALista) {
                grupo.controls.valor.setValue('', { emitEvent: true });
              }

              return;
            }

            grupo.controls.valor.setValue(seleccion || '', { emitEvent: true });
          });

        this._suscripcionesEvaluacion.push(suscripcionSelector);
      }

      const suscripcion = grupo.controls.valor.valueChanges
        .pipe(
          startWith(grupo.controls.valor.value),
          distinctUntilChanged((anterior, actual) =>
            this.sonValoresEquivalentes(anterior, actual),
          ),
        )
        .subscribe((valorFormulario) => {
          const valor = this.normalizarValorFormulario(valorFormulario, item);
          const valorOriginal = this.normalizarValorFormulario(item.valor, item);

          this._erroresPrevisualizacion.delete(item._id);

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

          try {
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
        });

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
      return this._previsualizaciones.get(item._id)?.evaluacionReferencia ?? null;
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
    valor: string | number,
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

  // ====== Normalizar valor clínico ======

  private normalizarValorClinico(
    item: IResultadoLaboratorioItem,
    valor: string | number,
  ): string | number {
    const configuracion = item.configuracionClinica;

    if (item.tipoResultado === 'NUMERICO') {
      const numero = Number(valor);

      if (!Number.isFinite(numero)) {
        throw new Error('El resultado debe ser un valor numérico válido.');
      }

      return numero;
    }

    const texto = String(valor ?? '').trim();

    if (!texto) {
      throw new Error('El resultado no puede estar vacío.');
    }

    if (item.tipoResultado === 'CATEGORICO') {
      const opciones = configuracion?.opcionesResultado ?? [];

      const opcionEncontrada = opciones.find(
        (opcion) =>
          String(opcion).trim().toUpperCase() === texto.toUpperCase(),
      );

      if (opcionEncontrada !== undefined) {
        return opcionEncontrada;
      }

      if (configuracion?.permiteValorNoListado !== true) {
        throw new Error(
          opciones.length > 0
            ? `El valor debe ser una de las opciones permitidas: ${opciones.join(', ')}`
            : 'El Item no permite valores fuera de la configuración.',
        );
      }
    }

    return texto;
  }

  // ====== Normalizar sexo clínico ======

  private normalizarSexoClinico(sexo: string | null | undefined):
    | 'MASCULINO'
    | 'FEMENINO'
    | null {
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
      configuracion.edadMin !== null &&
      configuracion.edadMin !== undefined;

    const tieneEdadMax =
      configuracion.edadMax !== null &&
      configuracion.edadMax !== undefined;

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
        referencia.edadMin !== null ||
        referencia.edadMax !== null,
    );

    if (especificasEdad.length > 0) {
      candidatas = especificasEdad;
    }

    return candidatas;
  }

  // ====== Comparar valor con referencia ======

  private valorCumpleReferencia(
    valor: string | number,
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
      const numero = Number(valor);

      if (!Number.isFinite(numero)) {
        return false;
      }

      if (tipo === 'RANGO') {
        const minimo = Number(referencia.valorMin);
        const maximo = Number(referencia.valorMax);

        return (
          Number.isFinite(minimo) &&
          Number.isFinite(maximo) &&
          numero >= minimo &&
          numero <= maximo
        );
      }

      const limite = Number(referencia.valorLimite);

      if (!Number.isFinite(limite)) {
        return false;
      }

      if (tipo === 'MENOR_QUE') {
        return numero < limite;
      }

      if (tipo === 'MENOR_IGUAL_QUE') {
        return numero <= limite;
      }

      if (tipo === 'MAYOR_QUE') {
        return numero > limite;
      }

      return numero >= limite;
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
    valor: string | number,
    referencia: IReferenciaResultadoSnapshot,
  ): IEvaluacionReferencia['estado'] {
    const tipo = referencia.tipoReferencia;

    if (tipo === 'VALORES_PERMITIDOS') {
      return 'VALOR_NO_PERMITIDO';
    }

    if (tipo === 'TEXTO') {
      return 'FUERA_REFERENCIA';
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return 'FUERA_REFERENCIA';
    }

    if (tipo === 'RANGO') {
      const minimo = Number(referencia.valorMin);
      const maximo = Number(referencia.valorMax);

      if (Number.isFinite(minimo) && numero < minimo) {
        return 'BAJO';
      }

      if (Number.isFinite(maximo) && numero > maximo) {
        return 'ALTO';
      }

      return 'FUERA_REFERENCIA';
    }

    if (tipo === 'MENOR_QUE' || tipo === 'MENOR_IGUAL_QUE') {
      return 'ALTO';
    }

    if (tipo === 'MAYOR_QUE' || tipo === 'MAYOR_IGUAL_QUE') {
      return 'BAJO';
    }

    return 'FUERA_REFERENCIA';
  }

  // ====== Evaluar referencia ======

  private evaluarReferenciaLocal(
    referencias: IReferenciaResultadoSnapshot[],
    valor: string | number,
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
    valor: string | number,
    regla: IReglaAlertaSnapshot,
  ): boolean {
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

      const numero = Number(valor);
      const valor1 = Number(regla.valor1);

      if (!Number.isFinite(numero) || !Number.isFinite(valor1)) {
        throw new Error(
          `La regla de alerta ${regla.descripcion || regla.condicion} no posee un valor numérico válido.`,
        );
      }

      if (regla.condicion === 'MENOR_QUE') {
        return numero < valor1;
      }

      if (regla.condicion === 'MENOR_IGUAL_QUE') {
        return numero <= valor1;
      }

      if (regla.condicion === 'MAYOR_QUE') {
        return numero > valor1;
      }

      if (regla.condicion === 'MAYOR_IGUAL_QUE') {
        return numero >= valor1;
      }

      const valor2 = Number(regla.valor2);

      if (!Number.isFinite(valor2) || valor1 > valor2) {
        throw new Error(
          `La regla de alerta ${regla.descripcion || regla.condicion} posee un rango inválido.`,
        );
      }

      return numero < valor1 || numero > valor2;
    }

    if (
      regla.condicion === 'IGUAL_A' ||
      regla.condicion === 'DISTINTO_DE'
    ) {
      let iguales: boolean;

      if (item.tipoResultado === 'NUMERICO') {
        const numero = Number(valor);
        const valorRegla = Number(regla.valor1);

        if (!Number.isFinite(numero) || !Number.isFinite(valorRegla)) {
          throw new Error(
            `La regla de alerta ${regla.descripcion || regla.condicion} no posee un valor numérico válido.`,
          );
        }

        iguales = numero === valorRegla;
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
    valor: string | number,
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

  private normalizarTextoComparacion(
    valor: string | number | null | undefined,
  ): string {
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

    const items = this.itemsForm.controls
      .map((grupo, indice) => {
        const itemOrigen = resultado.resultadosItems[indice];
        const raw = grupo.getRawValue();

        const valor = this.normalizarValorFormulario(raw.valor, itemOrigen);

        if (valor === null) {
          return null;
        }

        const observacion = raw.observacion.trim();
        const valorOriginal = this.normalizarValorFormulario(
          itemOrigen.valor,
          itemOrigen,
        );
        const observacionOriginal = String(itemOrigen.observacion ?? '').trim();

        const cambioValor = !this.sonValoresEquivalentes(valor, valorOriginal);
        const cambioObservacion = observacion !== observacionOriginal;
        const aunPendiente = itemOrigen.estado === 'PENDIENTE';

        if (!cambioValor && !cambioObservacion && !aunPendiente) {
          return null;
        }

        return {
          itemResultadoId: raw.itemResultadoId,
          valor,
          observacion,
        };
      })
      .filter((item) => item !== null);

    if (items.length === 0) {
      this._snackBar.open('No hay cambios para guardar en esta prueba.', 'Cerrar', {
        duration: 2200,
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
        next: (response) => {
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

          this.formResultado = this.crearFormularioActual();

          this._snackBar.open(
            this.esModoValidacion
              ? 'Cambios del informe guardados para validación.'
              : response.estadoResultado === 'COMPLETO'
                ? 'Prueba completa. Ya puede validarse.'
                : 'Resultados registrados correctamente.',
            'Cerrar',
            {
              duration: 2200,
            },
          );
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

  // ====== Cambios de un resultado durante validación ======

  private construirItemsModificadosDesdeBorrador(
    resultado: IResultadoLaboratorio,
  ): Array<{ itemResultadoId: string; valor: string | number; observacion: string }> {
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
          valor: string | number;
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
          item.configuracionClinica ?? itemsOrigen.get(item._id)?.configuracionClinica,
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
      .map((resultado) => `${resultado.codPruebaLab} - ${resultado.nombrePruebaLab}`)
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

      this._snackBar.open('Resultado validado correctamente.', 'Cerrar', {
        duration: 2200,
      });
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
        this._snackBar.open('No quedan resultados seleccionados por validar.', 'Cerrar', {
          duration: 2200,
        });
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

      this._snackBar.open(response.msg, 'Cerrar', { duration: 2400 });
    } catch (error: any) {
      await this._swal.fire({
        icon: 'error',
        title: 'No se pudieron validar los resultados',
        text:
          error?.error?.msg ||
          'Ocurrió un error durante la validación masiva.',
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
          const motivo = document.querySelector<HTMLTextAreaElement>(
            '#motivo-anulacion-dialog',
          )?.value?.trim();
          const usuario = document.querySelector<HTMLInputElement>(
            '#usuario-autorizador-dialog',
          )?.value?.trim();
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
          ...(nombreUsuarioAutorizador
            ? { nombreUsuarioAutorizador }
            : {}),
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
        text:
          error?.error?.msg ||
          'Ocurrió un error al anular el resultado.',
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
        text:
          error?.error?.msg ||
          'Ocurrió un error al reabrir el resultado.',
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

    const borrador = this.itemsForm.controls.map((grupo) => {
      const raw = grupo.getRawValue();

      return {
        valor: raw.valor,
        observacion: raw.observacion,
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
    valor: string | number | null | undefined,
    item: IResultadoLaboratorioItem,
  ): string | number | null {
    if (valor === null || valor === undefined) {
      return null;
    }

    if (item.tipoResultado === 'NUMERICO') {
      if (valor === '') {
        return null;
      }

      const numero = Number(valor);

      return Number.isFinite(numero) ? numero : String(valor);
    }

    const texto = String(valor).trim();

    return texto ? texto : null;
  }

  private sonValoresEquivalentes(
    valorA: string | number | null | undefined,
    valorB: string | number | null | undefined,
  ): boolean {
    if (
      (valorA === null || valorA === undefined || valorA === '') &&
      (valorB === null || valorB === undefined || valorB === '')
    ) {
      return true;
    }

    return String(valorA ?? '') === String(valorB ?? '');
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

  obtenerTextoEvaluacionItem(
    item: IResultadoLaboratorioItem,
    evaluacion: IEvaluacionReferencia | null,
  ): string {
    if (!evaluacion) {
      return '';
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
