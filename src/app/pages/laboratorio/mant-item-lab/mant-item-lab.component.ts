import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';
import {
  FormatoCapturaNumerica,
  IItemLab,
  PrecisionNumericaItem,
  TipoResultadoItem,
  ValorPorDefectoResultadoItem,
} from '../../../models/Mantenimiento/items.models';
import { ItemLabService } from '../../../services/mantenimiento/itemLab/item-lab.service';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-mant-item-lab',

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatChipsModule,
  ],

  templateUrl: './mant-item-lab.component.html',
  styleUrl: './mant-item-lab.component.scss',
})
export class MantItemLabComponent implements OnInit {
  constructor() {}

  // ==========================================================
  // INYECCIONES
  // ==========================================================

  private readonly _fb = inject(FormBuilder);
  private readonly _itemLabService = inject(ItemLabService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // ==========================================================
  // CONFIGURACIÓN GENERAL
  // ==========================================================

  public tiposResultado: { value: TipoResultadoItem; label: string }[] = [
    { value: 'NUMERICO', label: 'Numérico' },
    { value: 'TEXTO', label: 'Texto' },
    { value: 'CATEGORICO', label: 'Categórico' },
    { value: 'ESTRUCTURADO', label: 'Estructurado / hallazgos' },
  ];

  public precisionesNumericas: { value: PrecisionNumericaItem; label: string }[] = [
    { value: 'ENTERO', label: 'Solo enteros' },
    { value: 'DECIMAL', label: 'Permitir decimales' },
  ];

  public formatosCapturaNumerica: {
    value: FormatoCapturaNumerica;
    label: string;
  }[] = [
    { value: 'VALOR', label: 'Valor único' },
    { value: 'RANGO', label: 'Rango (desde - hasta)' },
    { value: 'MAYOR_QUE', label: 'Mayor que (>)' },
    { value: 'MAYOR_IGUAL_QUE', label: 'Mayor o igual que (>=)' },
    { value: 'MENOR_QUE', label: 'Menor que (<)' },
    { value: 'MENOR_IGUAL_QUE', label: 'Menor o igual que (<=)' },
  ];

  public sexosReferencia = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMENINO', label: 'Femenino' },
  ];

  public tiposReferenciaNumerica = [
    { value: 'RANGO', label: 'Rango' },
    { value: 'MENOR_QUE', label: 'Menor que' },
    { value: 'MENOR_IGUAL_QUE', label: 'Menor o igual que' },
    { value: 'MAYOR_QUE', label: 'Mayor que' },
    { value: 'MAYOR_IGUAL_QUE', label: 'Mayor o igual que' },
  ];

  public unidadesEdad = [
    { value: 'DIAS', label: 'Días' },
    { value: 'MESES', label: 'Meses' },
    { value: 'ANIOS', label: 'Años' },
  ];

  public condicionesAlertaNumerica = [
    { value: 'MENOR_QUE', label: 'Menor que' },
    { value: 'MENOR_IGUAL_QUE', label: 'Menor o igual que' },
    { value: 'MAYOR_QUE', label: 'Mayor que' },
    { value: 'MAYOR_IGUAL_QUE', label: 'Mayor o igual que' },
    { value: 'FUERA_DE_RANGO', label: 'Fuera de rango' },
    { value: 'IGUAL_A', label: 'Igual a' },
    { value: 'DISTINTO_DE', label: 'Distinto de' },
  ];

  public nivelesAlerta = [
    { value: 'INFORMATIVA', label: 'Informativa' },
    { value: 'ADVERTENCIA', label: 'Advertencia' },
    { value: 'CRITICA', label: 'Crítica' },
  ];

  public condicionesAlertaCategorica = [
    { value: 'IGUAL_A', label: 'Igual a' },
    { value: 'DISTINTO_DE', label: 'Distinto de' },
  ];

  public nuevaOpcionCualitativaNumerica = new FormControl<string>('', { nonNullable: true });
  public nuevoHallazgoEstructurado = new FormControl<string>('', { nonNullable: true });
  public nuevaOpcionCuantificacionEstructurada = new FormControl<string>('', { nonNullable: true });

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  public myFormItemLab: FormGroup = this._fb.group({
    _id: [null],
    codItemLab: [null],
    nombreInforme: ['', [Validators.required]],
    nombreHojaTrabajo: ['', [Validators.required]],
    metodoItemLab: ['', [Validators.required]],
    valoresHojaTrabajo: [''],
    valoresInforme: [''],
    unidadesRef: [''],

    // ======================================================
    // CAMPOS LEGACY
    // ======================================================

    /*
     * Temporalmente se mantienen para no romper
     * el HTML actual durante esta etapa.
     *
     * Ya NO son obligatorios.
     */

    perteneceAPrueba: [null],
    ordenImpresion: [0],
    grupoItemLab: [''],
    poseeValidacion: [false],
    paramValidacion: this._fb.array([]),

    // ======================================================
    // NUEVOS CAMPOS
    // ======================================================

    contextoAnalitico: ['', [Validators.maxLength(150)]],
    tipoResultado: ['TEXTO', [Validators.required]],
    opcionesResultado: [[]],
    valorPorDefectoResultado: [''],
    valorPorDefectoRangoDesde: [null],
    valorPorDefectoRangoHasta: [null],
    formatosCapturaNumerica: [['VALOR']],
    formatoCapturaNumericaDefault: ['VALOR'],
    precisionNumerica: ['DECIMAL'],
    valoresCualitativosAlternativos: [[]],
    valoresCualitativosReferencia: [[]],
    valorCualitativoDefaultNumerico: [''],
    permiteValorNoListado: [false],
    esOpcional: [false],
    mostrarReferenciaInforme: [true],

    // ====== Resultado estructurado / hallazgos ======
    hallazgosEstructurados: [[]],
    cuantificacionEstructuradaTipo: ['CATEGORICA'],
    opcionesCuantificacionEstructurada: [[]],
    formatosCapturaEstructurada: [['RANGO']],
    formatoCapturaEstructuradaDefault: ['RANGO'],
    precisionNumericaEstructurada: ['DECIMAL'],
    valorAusenciaEstructurada: ['NO SE OBSERVAN'],
    ausenciaEsReferenciaEstructurada: [true],
    hallazgosNormalesEstructurados: [[]],
    permiteMultiplesEstructurada: [true],
    permitirOtroHallazgoEstructurado: [false],
    modoDefaultEstructurado: ['AUSENCIA'],
    hallazgosDefaultEstructurado: this._fb.array([]),
    valoresReferenciaCategorica: [[]],
    poseeReferenciaTexto: [false],
    textoReferenciaResultado: [''],

    /*
     * En pantalla trabajamos con boolean.
     * Al enviar convertiremos:
     *
     * true  -> ACTIVO
     * false -> INACTIVO
     */
    referenciasResultado: this._fb.array([]),
    reglasAlerta: this._fb.array([]),
    estado: [true, [Validators.required]],
  });

  // ==========================================================
  // FORMARRAY LEGACY
  // ==========================================================

  get paramValidacion(): FormArray {
    return this.myFormItemLab.get('paramValidacion') as FormArray;
  }

  get referenciasResultado(): FormArray {
    return this.myFormItemLab.get('referenciasResultado') as FormArray;
  }

  get reglasAlerta(): FormArray {
    return this.myFormItemLab.get('reglasAlerta') as FormArray;
  }

  get hallazgosDefaultEstructurado(): FormArray {
    return this.myFormItemLab.get('hallazgosDefaultEstructurado') as FormArray;
  }

  // ==========================================================
  // INICIALIZACIÓN
  // ==========================================================

  ngOnInit(): void {
    this.ultimosItems();
    this.limpiarValidacion();
    this.inicializarCambioTipoResultado();
  }

  // ==========================================================
  // FLEX
  // ==========================================================

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  // ==========================================================
  // VALIDACIONES LEGACY
  // ==========================================================

  agregarValidacion(): void {
    const validacionItem = this._fb.group({
      descrValidacion: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      edadIndistinta: [true],
      edadMin: [
        {
          value: '',
          disabled: true,
        },
      ],
      edadMax: [
        {
          value: '',
          disabled: true,
        },
      ],
      descRegla: ['', [Validators.required]],
      valor1: [
        {
          value: '',
          disabled: true,
        },
      ],
      valor2: [
        {
          value: '',
          disabled: true,
        },
      ],
    });

    this.configurarHandlers(validacionItem);
    this.paramValidacion.push(validacionItem);
    const index = this.paramValidacion.length - 1;
    this.escucharCambioEdadIndistinta(index);
    this.escucharCambioRegla(index);
  }

  eliminarValidacion(index: number): void {
    this.paramValidacion.removeAt(index);
  }

  private configurarHandlers(validacionItem: FormGroup): void {
    validacionItem.get('edadIndistinta')?.valueChanges.subscribe((valor) => {
      if (valor) {
        validacionItem.get('edadMin')?.disable();
        validacionItem.get('edadMax')?.disable();
        validacionItem.get('edadMin')?.reset();
        validacionItem.get('edadMax')?.reset();
      } else {
        validacionItem.get('edadMin')?.enable();
        validacionItem.get('edadMax')?.enable();
      }
    });

    validacionItem.get('descRegla')?.valueChanges.subscribe((valor) => {
      validacionItem.get('valor1')?.reset();
      validacionItem.get('valor2')?.reset();

      if (valor === 'Entre') {
        validacionItem.get('valor1')?.enable();
        validacionItem.get('valor2')?.enable();
      } else {
        validacionItem.get('valor1')?.enable();
        validacionItem.get('valor2')?.disable();
      }
    });
  }

  private escucharCambioEdadIndistinta(index: number): void {
    const grupoValidacion = this.paramValidacion.at(index) as FormGroup;

    grupoValidacion
      .get('edadIndistinta')
      ?.valueChanges.subscribe((sinEdad: boolean) => {
        const edadMinControl = grupoValidacion.get('edadMin');
        const edadMaxControl = grupoValidacion.get('edadMax');

        if (!sinEdad) {
          edadMinControl?.setValidators([Validators.required]);
          edadMaxControl?.setValidators([Validators.required]);
        } else {
          edadMinControl?.clearValidators();
          edadMaxControl?.clearValidators();
        }

        edadMinControl?.updateValueAndValidity();
        edadMaxControl?.updateValueAndValidity();
      });
  }

  private escucharCambioRegla(index: number): void {
    const grupoValidacion = this.paramValidacion.at(index) as FormGroup;

    grupoValidacion
      .get('descRegla')
      ?.valueChanges.subscribe((regla: string) => {
        const valorMinControl = grupoValidacion.get('valor1');
        const valorMaxControl = grupoValidacion.get('valor2');

        if (regla === 'Entre') {
          valorMinControl?.setValidators([Validators.required]);
          valorMaxControl?.setValidators([Validators.required]);
        } else {
          valorMinControl?.setValidators([Validators.required]);
          valorMaxControl?.clearValidators();
        }

        valorMinControl?.updateValueAndValidity();
        valorMaxControl?.updateValueAndValidity();
      });
  }

  limpiarValidacion(): void {
    this.myFormItemLab
      .get('poseeValidacion')
      ?.valueChanges.subscribe((valor: boolean) => {
        if (!valor) {
          this.paramValidacion.clear();
        }
      });
  }

  validarArrayValores(): boolean {
    const poseeVal = this.myFormItemLab.get('poseeValidacion')?.value;

    if (poseeVal === true && this.paramValidacion.length === 0) {
      return false;
    }

    return true;
  }

  //AGREGAR REFERENCIA

  agregarReferencia(): void {
    const referencia = this._fb.group(
      {
        descripcion: ['', [Validators.maxLength(100)]],
        sexo: ['TODOS', [Validators.required]],
        tipoReferencia: ['RANGO', [Validators.required]],
        valorMin: [null],
        valorMax: [null],
        valorLimite: [null],
        aplicarEdad: [false],
        edadMin: [null],
        edadMax: [null],
        unidadEdad: ['ANIOS'],
        activo: [true],
      },
      {
        validators: [this.validarReferenciaNumerica()],
      },
    );
    this.configurarReferencia(referencia);
    this.referenciasResultado.push(referencia);
  }

  eliminarReferencia(index: number): void {
    this.referenciasResultado.removeAt(index);
  }

  private configurarReferencia(referencia: FormGroup): void {
    referencia.get('tipoReferencia')?.valueChanges.subscribe((tipo) => {
      this.actualizarControlesReferencia(referencia, tipo);
    });

    referencia
      .get('aplicarEdad')
      ?.valueChanges.subscribe((aplicarEdad: boolean) => {
        const edadMin = referencia.get('edadMin');
        const edadMax = referencia.get('edadMax');
        const unidadEdad = referencia.get('unidadEdad');

        if (aplicarEdad) {
          edadMin?.setValidators([Validators.required, Validators.min(0)]);
          edadMax?.setValidators([Validators.required, Validators.min(0)]);
          unidadEdad?.setValidators([Validators.required]);
        } else {
          edadMin?.clearValidators();
          edadMax?.clearValidators();
          unidadEdad?.clearValidators();
          edadMin?.setValue(null);
          edadMax?.setValue(null);
        }

        edadMin?.updateValueAndValidity();
        edadMax?.updateValueAndValidity();
        unidadEdad?.updateValueAndValidity();
      });

    this.actualizarControlesReferencia(
      referencia,
      referencia.get('tipoReferencia')?.value,
    );
  }

  private actualizarControlesReferencia(
    referencia: FormGroup,
    tipo: string,
  ): void {
    const valorMin = referencia.get('valorMin');
    const valorMax = referencia.get('valorMax');
    const valorLimite = referencia.get('valorLimite');

    valorMin?.clearValidators();
    valorMax?.clearValidators();
    valorLimite?.clearValidators();

    if (tipo === 'RANGO') {
      valorMin?.setValidators([Validators.required]);
      valorMax?.setValidators([Validators.required]);
      valorLimite?.setValue(null);
    } else {
      valorLimite?.setValidators([Validators.required]);
      valorMin?.setValue(null);
      valorMax?.setValue(null);
    }

    valorMin?.updateValueAndValidity();
    valorMax?.updateValueAndValidity();
    valorLimite?.updateValueAndValidity();
  }

  private validarReferenciaNumerica(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const tipoReferencia = control.get('tipoReferencia')?.value;
      const valorMin = control.get('valorMin')?.value;
      const valorMax = control.get('valorMax')?.value;
      const aplicarEdad = control.get('aplicarEdad')?.value;
      const edadMin = control.get('edadMin')?.value;
      const edadMax = control.get('edadMax')?.value;
      const errores: ValidationErrors = {};

      // ========================================================
      // VALIDAR RANGO NUMÉRICO
      // ========================================================

      if (
        tipoReferencia === 'RANGO' &&
        valorMin !== null &&
        valorMin !== '' &&
        valorMax !== null &&
        valorMax !== '' &&
        Number(valorMin) >= Number(valorMax)
      ) {
        errores['rangoInvalido'] = true;
      }

      // ========================================================
      // VALIDAR RANGO DE EDAD
      // ========================================================

      if (
        aplicarEdad === true &&
        edadMin !== null &&
        edadMin !== '' &&
        edadMax !== null &&
        edadMax !== '' &&
        Number(edadMin) >= Number(edadMax)
      ) {
        errores['rangoEdadInvalido'] = true;
      }

      return Object.keys(errores).length > 0 ? errores : null;
    };
  }

  //PARA CATEGORICO

  public nuevaOpcionResultado = new FormControl('');

  agregarOpcionResultado(): void {
    const valor = this.nuevaOpcionResultado.value?.trim().toUpperCase();

    if (!valor) {
      return;
    }

    const opcionesActuales = this.obtenerOpcionesResultado();

    const existe = opcionesActuales.some(
      (opcion) => opcion.toUpperCase() === valor,
    );

    if (existe) {
      Swal.fire({
        title: 'Opción duplicada',
        text: `La opción "${valor}" ya fue agregada.`,
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return;
    }

    this.myFormItemLab
      .get('opcionesResultado')
      ?.setValue([...opcionesActuales, valor]);
    this.myFormItemLab.get('opcionesResultado')?.markAsDirty();
    this.nuevaOpcionResultado.setValue('');
  }

  eliminarOpcionResultado(index: number): void {
    const opciones = [...this.obtenerOpcionesResultado()];
    const opcionEliminada = opciones[index];

    if (!opcionEliminada) {
      return;
    }

    // ========================================================
    // ELIMINAR DE OPCIONES DE RESULTADO
    // ========================================================

    opciones.splice(index, 1);

    this.myFormItemLab.get('opcionesResultado')?.setValue(opciones);

    // ========================================================
    // ELIMINAR DE REFERENCIA CATEGÓRICA
    // ========================================================

    const referenciasActuales: string[] =
      this.myFormItemLab.get('valoresReferenciaCategorica')?.value ?? [];

    this.myFormItemLab
      .get('valoresReferenciaCategorica')
      ?.setValue(
        referenciasActuales.filter((valor) => valor !== opcionEliminada),
      );

    // ========================================================
    // LIMPIAR VALOR POR DEFECTO SI ERA LA OPCIÓN ELIMINADA
    // ========================================================

    if (
      this.myFormItemLab.get('valorPorDefectoResultado')?.value ===
      opcionEliminada
    ) {
      this.myFormItemLab.get('valorPorDefectoResultado')?.setValue('');
    }

    // ========================================================
    // ELIMINAR DE REGLAS DE ALERTA
    // ========================================================

    this.reglasAlerta.controls.forEach((control) => {
      const valorAlerta = control.get('valor1')?.value;

      if (valorAlerta === opcionEliminada) {
        control.get('valor1')?.setValue(null);

        control.get('valor1')?.markAsTouched();
      }
    });

    // ========================================================
    // MARCAR CAMBIO
    // ========================================================

    this.myFormItemLab.get('opcionesResultado')?.markAsDirty();
  }

  obtenerOpcionesResultado(): string[] {
    return this.myFormItemLab.get('opcionesResultado')?.value ?? [];
  }

  onEnterOpcionResultado(event: Event): void {
    event.preventDefault();
    this.agregarOpcionResultado();
  }

  // ====== Alternativas cualitativas de Items numéricos ======

  agregarValorCualitativoNumerico(): void {
    const valor = this.nuevaOpcionCualitativaNumerica.value.trim();
    if (!valor) return;

    const actuales: string[] =
      this.myFormItemLab.get('valoresCualitativosAlternativos')?.value ?? [];

    if (
      actuales.some(
        (item) => item.trim().toUpperCase() === valor.toUpperCase(),
      )
    ) {
      this.nuevaOpcionCualitativaNumerica.setValue('');
      return;
    }

    this.myFormItemLab
      .get('valoresCualitativosAlternativos')
      ?.setValue([...actuales, valor]);
    this.nuevaOpcionCualitativaNumerica.setValue('');
  }

  eliminarValorCualitativoNumerico(index: number): void {
    const actuales: string[] = [
      ...(this.myFormItemLab.get('valoresCualitativosAlternativos')?.value ?? []),
    ];
    const eliminado = actuales[index];
    actuales.splice(index, 1);
    this.myFormItemLab.get('valoresCualitativosAlternativos')?.setValue(actuales);

    const referencias: string[] =
      this.myFormItemLab.get('valoresCualitativosReferencia')?.value ?? [];
    this.myFormItemLab
      .get('valoresCualitativosReferencia')
      ?.setValue(referencias.filter((valor) => valor !== eliminado));

    if (
      this.myFormItemLab.get('valorCualitativoDefaultNumerico')?.value ===
      eliminado
    ) {
      this.myFormItemLab.get('valorCualitativoDefaultNumerico')?.setValue('');
    }
  }

  obtenerValoresCualitativosNumericos(): string[] {
    return this.myFormItemLab.get('valoresCualitativosAlternativos')?.value ?? [];
  }

  // ====== Catálogo de hallazgos estructurados ======

  agregarHallazgoEstructurado(): void {
    const valor = this.nuevoHallazgoEstructurado.value.trim();
    if (!valor) return;

    const actuales: string[] =
      this.myFormItemLab.get('hallazgosEstructurados')?.value ?? [];

    if (
      actuales.some(
        (item) => item.trim().toUpperCase() === valor.toUpperCase(),
      )
    ) {
      this.nuevoHallazgoEstructurado.setValue('');
      return;
    }

    this.myFormItemLab.get('hallazgosEstructurados')?.setValue([...actuales, valor]);
    this.nuevoHallazgoEstructurado.setValue('');
  }

  eliminarHallazgoEstructurado(index: number): void {
    const actuales: string[] = [
      ...(this.myFormItemLab.get('hallazgosEstructurados')?.value ?? []),
    ];
    const eliminado = actuales[index];
    actuales.splice(index, 1);
    this.myFormItemLab.get('hallazgosEstructurados')?.setValue(actuales);

    const normales: string[] =
      this.myFormItemLab.get('hallazgosNormalesEstructurados')?.value ?? [];
    this.myFormItemLab
      .get('hallazgosNormalesEstructurados')
      ?.setValue(normales.filter((hallazgo) => hallazgo !== eliminado));

    [...this.hallazgosDefaultEstructurado.controls]
      .reverse()
      .forEach((control, reverseIndex) => {
        if (control.get('hallazgo')?.value === eliminado) {
          const indice = this.hallazgosDefaultEstructurado.length - 1 - reverseIndex;
          this.hallazgosDefaultEstructurado.removeAt(indice);
        }
      });
  }

  obtenerHallazgosEstructurados(): string[] {
    return this.myFormItemLab.get('hallazgosEstructurados')?.value ?? [];
  }

  // ====== Opciones de cuantificación estructurada ======

  agregarOpcionCuantificacionEstructurada(): void {
    const valor = this.nuevaOpcionCuantificacionEstructurada.value.trim();
    if (!valor) return;

    const actuales: string[] =
      this.myFormItemLab.get('opcionesCuantificacionEstructurada')?.value ?? [];

    if (
      actuales.some(
        (item) => item.trim().toUpperCase() === valor.toUpperCase(),
      )
    ) {
      this.nuevaOpcionCuantificacionEstructurada.setValue('');
      return;
    }

    this.myFormItemLab
      .get('opcionesCuantificacionEstructurada')
      ?.setValue([...actuales, valor]);
    this.nuevaOpcionCuantificacionEstructurada.setValue('');
  }

  eliminarOpcionCuantificacionEstructurada(index: number): void {
    const actuales: string[] = [
      ...(this.myFormItemLab.get('opcionesCuantificacionEstructurada')?.value ?? []),
    ];
    const eliminado = actuales[index];
    actuales.splice(index, 1);
    this.myFormItemLab
      .get('opcionesCuantificacionEstructurada')
      ?.setValue(actuales);

    this.hallazgosDefaultEstructurado.controls.forEach((control) => {
      if (control.get('valorCategorico')?.value === eliminado) {
        control.get('valorCategorico')?.setValue('');
      }
    });
  }

  obtenerOpcionesCuantificacionEstructurada(): string[] {
    return this.myFormItemLab.get('opcionesCuantificacionEstructurada')?.value ?? [];
  }

  // ====== Default estructurado ======

  private crearHallazgoDefaultEstructuradoGroup(data: any = {}): FormGroup {
    return this._fb.group({
      hallazgo: [data.hallazgo ?? '', Validators.required],
      valorCategorico: [data.valorCategorico ?? ''],
      formatoNumerico: [data.formatoNumerico ?? 'RANGO'],
      valor: [data.valor ?? null],
      desde: [data.desde ?? null],
      hasta: [data.hasta ?? null],
    });
  }

  agregarHallazgoDefaultEstructurado(data: any = {}): void {
    if (
      this.myFormItemLab.get('permiteMultiplesEstructurada')?.value === false &&
      this.hallazgosDefaultEstructurado.length > 0
    ) {
      return;
    }

    this.hallazgosDefaultEstructurado.push(
      this.crearHallazgoDefaultEstructuradoGroup(data),
    );
  }

  eliminarHallazgoDefaultEstructurado(index: number): void {
    this.hallazgosDefaultEstructurado.removeAt(index);
  }

  esCuantificacionEstructuradaNumerica(): boolean {
    return (
      this.myFormItemLab.get('cuantificacionEstructuradaTipo')?.value ===
      'NUMERICA'
    );
  }

  esHallazgoDefaultRango(control: AbstractControl): boolean {
    return control.get('formatoNumerico')?.value === 'RANGO';
  }

  obtenerFormatosCapturaEstructuradaSeleccionados(): FormatoCapturaNumerica[] {
    return (
      this.myFormItemLab.get('formatosCapturaEstructurada')?.value ?? ['RANGO']
    ) as FormatoCapturaNumerica[];
  }

  private validarConfiguracionResultado(): boolean {
    const tipoResultado = this.myFormItemLab.get('tipoResultado')?.value;

    // ====== NUMÉRICO ======

    if (tipoResultado === 'NUMERICO') {
      const formatos = this.obtenerFormatosCapturaSeleccionados();
      const formatoDefault = this.myFormItemLab.get(
        'formatoCapturaNumericaDefault',
      )?.value as FormatoCapturaNumerica | null;

      if (!formatos.length) {
        Swal.fire({
          title: 'Formato de captura requerido',
          text: 'Seleccione al menos un formato de captura para el resultado numérico.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      if (!formatoDefault || !formatos.includes(formatoDefault)) {
        Swal.fire({
          title: 'Formato predeterminado inválido',
          text: 'El formato predeterminado debe estar incluido entre los formatos permitidos.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      // ====== Validar alternativas cualitativas ======
      const alternativas = this.obtenerValoresCualitativosNumericos();
      const referenciasCualitativas: string[] =
        this.myFormItemLab.get('valoresCualitativosReferencia')?.value ?? [];
      const referenciaInvalida = referenciasCualitativas.find(
        (valor) => !alternativas.includes(valor),
      );

      if (referenciaInvalida) {
        Swal.fire({
          title: 'Referencia cualitativa inválida',
          text: 'Los valores cualitativos de referencia deben existir entre las alternativas configuradas.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      const defaultCualitativo = String(
        this.myFormItemLab.get('valorCualitativoDefaultNumerico')?.value ?? '',
      ).trim();

      if (defaultCualitativo && !alternativas.includes(defaultCualitativo)) {
        Swal.fire({
          title: 'Valor cualitativo predeterminado inválido',
          text: 'El valor predeterminado debe existir entre las alternativas cualitativas.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      // ====== Validar valor por defecto numérico ======
      if (!defaultCualitativo) {
        if (formatoDefault === 'RANGO') {
          const desdeRaw = this.myFormItemLab.get(
            'valorPorDefectoRangoDesde',
          )?.value;
          const hastaRaw = this.myFormItemLab.get(
            'valorPorDefectoRangoHasta',
          )?.value;
          const desdeVacio =
            desdeRaw === null || desdeRaw === undefined || desdeRaw === '';
          const hastaVacio =
            hastaRaw === null || hastaRaw === undefined || hastaRaw === '';

          if (desdeVacio !== hastaVacio) {
            Swal.fire({
              title: 'Valor por defecto incompleto',
              text: 'Para un rango predeterminado debe indicar ambos extremos.',
              icon: 'warning',
              confirmButtonText: 'Ok',
            });
            return false;
          }

          if (!desdeVacio && !hastaVacio) {
            const desde = Number(desdeRaw);
            const hasta = Number(hastaRaw);

            if (!Number.isFinite(desde) || !Number.isFinite(hasta)) {
              Swal.fire({
                title: 'Valor por defecto inválido',
                text: 'Los extremos del rango predeterminado deben ser numéricos.',
                icon: 'warning',
                confirmButtonText: 'Ok',
              });
              return false;
            }

            if (
              !this.permiteDecimalesNumerico() &&
              (!Number.isInteger(desde) || !Number.isInteger(hasta))
            ) {
              Swal.fire({
                title: 'Valor por defecto inválido',
                text: 'Este Item está configurado para aceptar solo números enteros.',
                icon: 'warning',
                confirmButtonText: 'Ok',
              });
              return false;
            }

            if (desde > hasta) {
              Swal.fire({
                title: 'Rango predeterminado inválido',
                text: 'El valor inicial no puede ser mayor que el valor final.',
                icon: 'warning',
                confirmButtonText: 'Ok',
              });
              return false;
            }
          }
        } else {
          const valorRaw = this.myFormItemLab.get(
            'valorPorDefectoResultado',
          )?.value;
          const vacio =
            valorRaw === null || valorRaw === undefined || valorRaw === '';

          if (!vacio && !Number.isFinite(Number(valorRaw))) {
            Swal.fire({
              title: 'Valor por defecto inválido',
              text: 'El valor predeterminado debe ser numérico.',
              icon: 'warning',
              confirmButtonText: 'Ok',
            });
            return false;
          }

          if (
            !vacio &&
            !this.permiteDecimalesNumerico() &&
            !Number.isInteger(Number(valorRaw))
          ) {
            Swal.fire({
              title: 'Valor por defecto inválido',
              text: 'Este Item está configurado para aceptar solo números enteros.',
              icon: 'warning',
              confirmButtonText: 'Ok',
            });
            return false;
          }
        }
      }
    }

    // ========================================================
    // CATEGÓRICO
    // ========================================================

    if (tipoResultado === 'CATEGORICO') {
      const opciones = this.obtenerOpcionesResultado();

      // Debe existir por lo menos
      // una opción habitual.
      if (opciones.length === 0) {
        Swal.fire({
          title: 'Opciones de resultado requeridas',
          text: 'Un Item categórico debe tener al menos una opción de resultado.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }

      const valorPorDefecto = String(
        this.myFormItemLab.get('valorPorDefectoResultado')?.value ?? '',
      ).trim();

      if (valorPorDefecto && !opciones.includes(valorPorDefecto)) {
        Swal.fire({
          title: 'Valor por defecto inválido',
          text: 'El valor por defecto debe existir entre las opciones configuradas.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }

      // ======================================================
      // VALIDAR QUE LAS ALERTAS APUNTEN
      // A OPCIONES EXISTENTES
      // ======================================================

      const alertaConValorInvalido = this.reglasAlerta.controls.some(
        (control) => {
          const valor = control.get('valor1')?.value;

          /*
           * Si está vacío, el Validators.required
           * del formulario se encargará.
           */
          if (valor === null || valor === undefined || valor === '') {
            return false;
          }

          return !opciones.includes(valor);
        },
      );

      if (alertaConValorInvalido) {
        Swal.fire({
          title: 'Alerta categórica inválida',
          text: 'Una regla de alerta utiliza un valor que ya no existe entre las opciones de resultado.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }
    }

    // ========================================================
    // ESTRUCTURADO / HALLAZGOS
    // ========================================================

    if (tipoResultado === 'ESTRUCTURADO') {
      const hallazgos = this.obtenerHallazgosEstructurados();
      const hallazgosNormales: string[] =
        this.myFormItemLab.get('hallazgosNormalesEstructurados')?.value ?? [];
      const valorAusencia = String(
        this.myFormItemLab.get('valorAusenciaEstructurada')?.value ?? '',
      ).trim();
      const tipoCuantificacion =
        this.myFormItemLab.get('cuantificacionEstructuradaTipo')?.value;

      if (!hallazgos.length) {
        Swal.fire({
          title: 'Hallazgos requeridos',
          text: 'Configure al menos un hallazgo para este Item estructurado.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      const hallazgoNormalInvalido = hallazgosNormales.find(
        (hallazgo) => !hallazgos.includes(hallazgo),
      );

      if (hallazgoNormalInvalido) {
        Swal.fire({
          title: 'Hallazgo normal inválido',
          text: `El hallazgo ${hallazgoNormalInvalido} ya no existe en el catálogo configurado.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      if (!valorAusencia) {
        Swal.fire({
          title: 'Valor de ausencia requerido',
          text: 'Indique el texto que se utilizará cuando no existan hallazgos.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });
        return false;
      }

      if (tipoCuantificacion === 'CATEGORICA') {
        if (!this.obtenerOpcionesCuantificacionEstructurada().length) {
          Swal.fire({
            title: 'Cuantificación requerida',
            text: 'Agregue al menos una opción de cuantificación, por ejemplo +, ++ o +++.',
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
          return false;
        }
      } else if (tipoCuantificacion === 'NUMERICA') {
        const formatos = this.obtenerFormatosCapturaEstructuradaSeleccionados();
        const formatoDefault = this.myFormItemLab.get(
          'formatoCapturaEstructuradaDefault',
        )?.value as FormatoCapturaNumerica | null;

        if (!formatos.length || !formatoDefault || !formatos.includes(formatoDefault)) {
          Swal.fire({
            title: 'Formato estructurado inválido',
            text: 'Seleccione formatos numéricos válidos y un formato predeterminado.',
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
          return false;
        }
      } else {
        return false;
      }

      if (this.myFormItemLab.get('modoDefaultEstructurado')?.value === 'DETALLE') {
        if (!this.hallazgosDefaultEstructurado.length) {
          Swal.fire({
            title: 'Default estructurado incompleto',
            text: 'Agregue al menos un hallazgo predeterminado o seleccione ausencia.',
            icon: 'warning',
            confirmButtonText: 'Ok',
          });
          return false;
        }

        const usados = new Set<string>();
        for (const control of this.hallazgosDefaultEstructurado.controls) {
          const hallazgo = String(control.get('hallazgo')?.value ?? '').trim();
          if (!hallazgo || !hallazgos.includes(hallazgo) || usados.has(hallazgo)) {
            Swal.fire({
              title: 'Default estructurado inválido',
              text: 'Revise los hallazgos predeterminados y evite duplicados.',
              icon: 'warning',
              confirmButtonText: 'Ok',
            });
            return false;
          }
          usados.add(hallazgo);

          if (tipoCuantificacion === 'CATEGORICA') {
            const valor = String(control.get('valorCategorico')?.value ?? '').trim();
            if (!this.obtenerOpcionesCuantificacionEstructurada().includes(valor)) {
              Swal.fire({
                title: 'Cuantificación predeterminada inválida',
                text: `Seleccione una cuantificación válida para ${hallazgo}.`,
                icon: 'warning',
                confirmButtonText: 'Ok',
              });
              return false;
            }
          } else {
            const formato = control.get('formatoNumerico')?.value as FormatoCapturaNumerica;
            if (!this.obtenerFormatosCapturaEstructuradaSeleccionados().includes(formato)) {
              return false;
            }

            if (formato === 'RANGO') {
              const desde = control.get('desde')?.value;
              const hasta = control.get('hasta')?.value;
              if (
                desde === null ||
                hasta === null ||
                !Number.isFinite(Number(desde)) ||
                !Number.isFinite(Number(hasta)) ||
                Number(desde) > Number(hasta)
              ) {
                Swal.fire({
                  title: 'Rango predeterminado inválido',
                  text: `Revise el rango configurado para ${hallazgo}.`,
                  icon: 'warning',
                  confirmButtonText: 'Ok',
                });
                return false;
              }

              if (
                !this.permiteDecimalesEstructurado() &&
                (!Number.isInteger(Number(desde)) ||
                  !Number.isInteger(Number(hasta)))
              ) {
                Swal.fire({
                  title: 'Rango predeterminado inválido',
                  text: `${hallazgo} está configurado para aceptar solo números enteros.`,
                  icon: 'warning',
                  confirmButtonText: 'Ok',
                });
                return false;
              }
            } else {
              const valor = control.get('valor')?.value;
              if (valor === null || valor === '' || !Number.isFinite(Number(valor))) {
                return false;
              }

              if (
                !this.permiteDecimalesEstructurado() &&
                !Number.isInteger(Number(valor))
              ) {
                Swal.fire({
                  title: 'Valor predeterminado inválido',
                  text: `${hallazgo} está configurado para aceptar solo números enteros.`,
                  icon: 'warning',
                  confirmButtonText: 'Ok',
                });
                return false;
              }
            }
          }
        }
      }
    }

    // ========================================================
    // TEXTO
    // ========================================================

    if (tipoResultado === 'TEXTO') {
      const poseeReferencia = this.myFormItemLab.get(
        'poseeReferenciaTexto',
      )?.value;

      const textoReferencia = this.myFormItemLab
        .get('textoReferenciaResultado')
        ?.value?.trim();

      if (poseeReferencia && !textoReferencia) {
        Swal.fire({
          title: 'Referencia incompleta',
          text: 'Ingrese el texto de referencia o desactive la opción de mostrar referencia.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }
    }

    return true;
  }

  private inicializarCambioTipoResultado(): void {
    const tipoControl = this.myFormItemLab.get('tipoResultado');

    let tipoAnterior: TipoResultadoItem = tipoControl?.value ?? 'TEXTO';

    tipoControl?.valueChanges.subscribe((nuevoTipo: TipoResultadoItem) => {
      if (tipoAnterior && nuevoTipo !== tipoAnterior) {
        /*
         * Las reglas numéricas y categóricas
         * no son intercambiables.
         *
         * Ejemplo:
         *
         * NUMERICO:
         * MENOR_QUE 40
         *
         * CATEGORICO:
         * IGUAL_A POSITIVO
         */
        this.reglasAlerta.clear();
      }

      if (nuevoTipo !== tipoAnterior) {
        this.myFormItemLab.get('valorPorDefectoResultado')?.setValue('', {
          emitEvent: false,
        });
        this.myFormItemLab.get('valorPorDefectoRangoDesde')?.setValue(null, {
          emitEvent: false,
        });
        this.myFormItemLab.get('valorPorDefectoRangoHasta')?.setValue(null, {
          emitEvent: false,
        });
      }

      if (nuevoTipo !== 'NUMERICO') {
        this.myFormItemLab.get('formatosCapturaNumerica')?.setValue(['VALOR'], {
          emitEvent: false,
        });
        this.myFormItemLab
          .get('formatoCapturaNumericaDefault')
          ?.setValue('VALOR', { emitEvent: false });
        this.myFormItemLab.get('valoresCualitativosAlternativos')?.setValue([], { emitEvent: false });
        this.myFormItemLab.get('valoresCualitativosReferencia')?.setValue([], { emitEvent: false });
        this.myFormItemLab.get('valorCualitativoDefaultNumerico')?.setValue('', { emitEvent: false });
      }

      if (nuevoTipo !== 'ESTRUCTURADO') {
        this.hallazgosDefaultEstructurado.clear();
      }

      tipoAnterior = nuevoTipo;
    });
  }

  // ==========================================================
  // TABLA
  // ==========================================================

  @ViewChild(MatTable)
  table!: MatTable<IItemLab>;

  @ViewChild('MatPaginatorItems')
  paginatorItems!: MatPaginator;

  public dataSourceItems = new MatTableDataSource<IItemLab>();

  private todosLosItems: IItemLab[] = [];

  public columnasTablaPaciente: string[] = [
    'Codigo',
    'NombreItem',
    'Contexto',
    'TipoResultado',
    'Estado',
    'accion',
  ];

  ngAfterViewInit(): void {
    this.dataSourceItems.paginator = this.paginatorItems;

    this.dataSourceItems.filterPredicate = (data: IItemLab, filter: string) => {
      const searchStr = filter.trim().toLowerCase();

      const campos = [
        data.codItemLab ?? '',
        data.nombreInforme ?? '',
        data.nombreHojaTrabajo ?? '',
        data.metodoItemLab ?? '',
        data.contextoAnalitico ?? '',
        data.tipoResultado ?? '',
        data.estadoItem ?? '',
      ];

      return campos.some((campo) =>
        String(campo).toLowerCase().includes(searchStr),
      );
    };
  }

  // ==========================================================
  // LISTAR
  // ==========================================================

  ultimosItems(): void {
    this._itemLabService.getLastItemsLab().subscribe({
      next: (items) => {
        this.todosLosItems = items;
        this.dataSourceItems.data = items;
      },

      error: () => {
        this.todosLosItems = [];
        this.dataSourceItems.data = [];
      },
    });
  }

  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  public terminoBusqueda = new FormControl('');

  buscarItems(): void {
    const termino = this.terminoBusqueda.value?.trim().toLowerCase() ?? '';
    this.dataSourceItems.data = this.todosLosItems;
    this.dataSourceItems.filter = termino;

    if (this.dataSourceItems.paginator) {
      this.dataSourceItems.paginator.firstPage();
    }
  }

  obtenerNombreTipoResultado(tipo?: TipoResultadoItem): string {
    switch (tipo) {
      case 'NUMERICO':
        return 'Numérico';

      case 'CATEGORICO':
        return 'Categórico';

      case 'TEXTO':
        return 'Texto';

      case 'ESTRUCTURADO':
        return 'Estructurado';

      default:
        return '—';
    }
  }

  // ==========================================================
  // SELECCIÓN / EDICIÓN
  // ==========================================================

  public filaSeleccionadaIndex: number | null = null;
  private itemSeleccionado: IItemLab | null = null;

  cargarItemLab(item: IItemLab, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.itemSeleccionado = item;

    // ========================================================
    // LIMPIAR FORMARRAYS
    // ========================================================

    this.paramValidacion.clear();
    this.referenciasResultado.clear();
    this.reglasAlerta.clear();
    this.hallazgosDefaultEstructurado.clear();

    // ========================================================
    // TIPO DE RESULTADO
    // ========================================================

    const tipoItem = item.tipoResultado ?? 'TEXTO';
    const valorDefaultNumerico = this.descomponerValorPorDefectoNumerico(item);
    const configuracionEstructurada = item.configuracionEstructurada;
    const valorDefaultEstructurado =
      tipoItem === 'ESTRUCTURADO' &&
      item.valorPorDefectoResultado &&
      typeof item.valorPorDefectoResultado === 'object' &&
      item.valorPorDefectoResultado.tipo === 'HALLAZGOS'
        ? item.valorPorDefectoResultado
        : null;

    // ========================================================
    // REFERENCIA CATEGÓRICA
    // ========================================================

    const referenciaCategorica = (item.referenciasResultado ?? []).find(
      (referencia) => referencia.tipoReferencia === 'VALORES_PERMITIDOS',
    );

    const valoresReferenciaCategorica =
      referenciaCategorica?.valoresPermitidos ?? [];

    // ========================================================
    // REFERENCIA TEXTO
    // ========================================================

    const referenciaTexto = (item.referenciasResultado ?? []).find(
      (referencia) => referencia.tipoReferencia === 'TEXTO',
    );
    const textoReferenciaResultado = referenciaTexto?.textoReferencia ?? '';
    const poseeReferenciaTexto = textoReferenciaResultado.trim().length > 0;

    // ========================================================
    // CARGAR FORMULARIO PRINCIPAL
    // ========================================================

    this.myFormItemLab.reset({
      _id: item._id ?? null,
      codItemLab: item.codItemLab ?? null,
      nombreInforme: item.nombreInforme ?? '',
      nombreHojaTrabajo: item.nombreHojaTrabajo ?? '',
      metodoItemLab: item.metodoItemLab ?? '',
      valoresHojaTrabajo: item.valoresHojaTrabajo ?? '',
      valoresInforme: item.valoresInforme ?? '',
      unidadesRef: item.unidadesRef ?? '',

      // ======================================================
      // LEGACY
      // ======================================================

      perteneceAPrueba: null,
      ordenImpresion: item.ordenImpresion ?? 0,
      grupoItemLab: item.grupoItemLab ?? '',
      poseeValidacion: item.poseeValidacion ?? false,

      // ======================================================
      // NUEVA ESTRUCTURA
      // ======================================================

      contextoAnalitico: item.contextoAnalitico ?? '',
      tipoResultado: tipoItem,
      opcionesResultado: item.opcionesResultado ?? [],
      valorPorDefectoResultado:
        tipoItem === 'NUMERICO'
          ? valorDefaultNumerico.valor
          : tipoItem === 'ESTRUCTURADO'
            ? ''
            : (item.valorPorDefectoResultado ?? ''),
      valorPorDefectoRangoDesde: valorDefaultNumerico.desde,
      valorPorDefectoRangoHasta: valorDefaultNumerico.hasta,
      formatosCapturaNumerica:
        item.tipoResultado === 'NUMERICO' && item.formatosCapturaNumerica?.length
          ? item.formatosCapturaNumerica
          : ['VALOR'],
      precisionNumerica:
        item.tipoResultado === 'NUMERICO'
          ? (item.precisionNumerica ?? 'DECIMAL')
          : 'DECIMAL',
      formatoCapturaNumericaDefault:
        item.tipoResultado === 'NUMERICO'
          ? (item.formatoCapturaNumericaDefault ??
            item.formatosCapturaNumerica?.[0] ??
            'VALOR')
          : 'VALOR',
      valoresCualitativosAlternativos:
        item.tipoResultado === 'NUMERICO'
          ? (item.valoresCualitativosAlternativos ?? [])
          : [],
      valoresCualitativosReferencia:
        item.tipoResultado === 'NUMERICO'
          ? (item.valoresCualitativosReferencia ?? [])
          : [],
      valorCualitativoDefaultNumerico: valorDefaultNumerico.cualitativo,
      hallazgosEstructurados: configuracionEstructurada?.hallazgos ?? [],
      cuantificacionEstructuradaTipo:
        configuracionEstructurada?.cuantificacion?.tipo ?? 'CATEGORICA',
      opcionesCuantificacionEstructurada:
        configuracionEstructurada?.cuantificacion?.opciones ?? [],
      formatosCapturaEstructurada:
        configuracionEstructurada?.cuantificacion?.formatosCapturaNumerica?.length
          ? configuracionEstructurada.cuantificacion.formatosCapturaNumerica
          : ['RANGO'],
      formatoCapturaEstructuradaDefault:
        configuracionEstructurada?.cuantificacion?.formatoCapturaNumericaDefault ??
        'RANGO',
      precisionNumericaEstructurada:
        configuracionEstructurada?.cuantificacion?.precisionNumerica ?? 'DECIMAL',
      valorAusenciaEstructurada:
        configuracionEstructurada?.valorAusencia ?? 'NO SE OBSERVAN',
      ausenciaEsReferenciaEstructurada:
        configuracionEstructurada?.ausenciaEsReferencia === true,
      hallazgosNormalesEstructurados:
        configuracionEstructurada?.hallazgosNormales ?? [],
      permiteMultiplesEstructurada:
        configuracionEstructurada?.permiteMultiples !== false,
      permitirOtroHallazgoEstructurado:
        configuracionEstructurada?.permitirOtroHallazgo === true,
      modoDefaultEstructurado:
        valorDefaultEstructurado?.modo ?? 'AUSENCIA',
      permiteValorNoListado: item.permiteValorNoListado ?? false,
      esOpcional: item.esOpcional === true,
      mostrarReferenciaInforme: item.mostrarReferenciaInforme !== false,
      valoresReferenciaCategorica: valoresReferenciaCategorica,
      poseeReferenciaTexto: poseeReferenciaTexto,
      textoReferenciaResultado: textoReferenciaResultado,
      estado: (item.estadoItem ?? 'ACTIVO') === 'ACTIVO',
    });

    // ========================================================
    // RECONSTRUIR DEFAULT ESTRUCTURADO
    // ========================================================

    if (
      valorDefaultEstructurado?.modo === 'DETALLE' &&
      Array.isArray(valorDefaultEstructurado.hallazgos)
    ) {
      valorDefaultEstructurado.hallazgos.forEach((entrada) => {
        const valor: any = entrada.valor;
        const data: any = {
          hallazgo: entrada.hallazgo,
          valorCategorico: '',
          formatoNumerico:
            configuracionEstructurada?.cuantificacion?.formatoCapturaNumericaDefault ??
            'RANGO',
          valor: null,
          desde: null,
          hasta: null,
        };

        if (valor && typeof valor === 'object' && valor.tipo === 'CATEGORICO') {
          data.valorCategorico = valor.valor ?? '';
        } else if (valor && typeof valor === 'object' && valor.tipo === 'RANGO') {
          data.formatoNumerico = 'RANGO';
          data.desde = valor.desde ?? null;
          data.hasta = valor.hasta ?? null;
        } else if (valor && typeof valor === 'object' && 'valor' in valor) {
          data.formatoNumerico = valor.tipo ?? 'VALOR';
          data.valor = valor.valor ?? null;
        } else if (typeof valor === 'number') {
          data.formatoNumerico = 'VALOR';
          data.valor = valor;
        }

        this.agregarHallazgoDefaultEstructurado(data);
      });
    }

    // ========================================================
    // RECONSTRUIR REFERENCIAS NUMÉRICAS
    // ========================================================

    if (tipoItem === 'NUMERICO') {
      (item.referenciasResultado ?? [])
        .filter((referencia) =>
          [
            'RANGO',
            'MENOR_QUE',
            'MENOR_IGUAL_QUE',
            'MAYOR_QUE',
            'MAYOR_IGUAL_QUE',
          ].includes(referencia.tipoReferencia),
        )
        .forEach((referencia) => {
          const grupo = this.crearReferenciaGroup(referencia);

          this.referenciasResultado.push(grupo);
        });
    }

    // ========================================================
    // RECONSTRUIR REGLAS DE ALERTA
    // NUMÉRICO / CATEGÓRICO
    // ========================================================

    if (tipoItem === 'NUMERICO' || tipoItem === 'CATEGORICO') {
      (item.reglasAlerta ?? []).forEach((alerta) => {
        const grupo = this.crearReglaAlertaGroup(alerta, tipoItem);

        this.reglasAlerta.push(grupo);
      });
    }
  }

  private crearReferenciaGroup(referencia: any): FormGroup {
    const tieneEdad =
      (referencia.edadMin !== null && referencia.edadMin !== undefined) ||
      (referencia.edadMax !== null && referencia.edadMax !== undefined);

    const grupo = this._fb.group(
      {
        descripcion: [referencia.descripcion ?? '', [Validators.maxLength(100)]],
        sexo: [referencia.sexo ?? 'TODOS'],
        tipoReferencia: [referencia.tipoReferencia ?? 'RANGO'],
        valorMin: [referencia.valorMin ?? null],
        valorMax: [referencia.valorMax ?? null],
        valorLimite: [referencia.valorLimite ?? null],
        aplicarEdad: [tieneEdad],
        edadMin: [referencia.edadMin ?? null],
        edadMax: [referencia.edadMax ?? null],
        unidadEdad: [referencia.unidadEdad ?? 'ANIOS'],
        activo: [referencia.activo ?? true],
      },
      {
        validators: [this.validarReferenciaNumerica()],
      },
    );

    this.configurarReferencia(grupo);

    return grupo;
  }

  private crearReglaAlertaGroup(
    alerta: any,
    tipoResultado: 'NUMERICO' | 'CATEGORICO',
  ): FormGroup {
    const tieneRestriccionEdad =
      (alerta.edadMin !== null && alerta.edadMin !== undefined) ||
      (alerta.edadMax !== null && alerta.edadMax !== undefined);

    const tieneRestriccionSexo = alerta.sexo && alerta.sexo !== 'TODOS';
    const aplicarPoblacion = tieneRestriccionEdad || tieneRestriccionSexo;

    const condicionInicial =
      tipoResultado === 'CATEGORICO' ? 'IGUAL_A' : 'MENOR_QUE';

    const validador =
      tipoResultado === 'CATEGORICO'
        ? this.validarReglaAlertaCategorica()
        : this.validarReglaAlertaNumerica();

    const grupo = this._fb.group(
      {
        descripcion: [
          alerta.descripcion ?? '',
          [Validators.required, Validators.maxLength(100)],
        ],
        condicion: [
          alerta.condicion ?? condicionInicial,
          [Validators.required],
        ],
        valor1: [alerta.valor1 ?? null],
        valor2: [alerta.valor2 ?? null],
        nivelAlerta: [
          alerta.nivelAlerta ?? 'ADVERTENCIA',
          [Validators.required],
        ],
        mensaje: [alerta.mensaje ?? '', [Validators.maxLength(250)]],
        activo: [alerta.activo ?? true],
        aplicarPoblacion: [aplicarPoblacion],
        sexo: [alerta.sexo ?? 'TODOS'],
        aplicarEdad: [tieneRestriccionEdad],
        edadMin: [alerta.edadMin ?? null],
        edadMax: [alerta.edadMax ?? null],
        unidadEdad: [alerta.unidadEdad ?? 'ANIOS'],
      },
      {
        validators: [validador],
      },
    );

    this.configurarReglaAlerta(grupo);

    return grupo;
  }

  //REGLAS DE ALERTA

  agregarReglaAlerta(): void {
    const tipoResultado = this.myFormItemLab.get('tipoResultado')?.value;

    if (tipoResultado !== 'NUMERICO' && tipoResultado !== 'CATEGORICO') {
      return;
    }

    const alerta = this.crearReglaAlertaGroup({}, tipoResultado);

    this.reglasAlerta.push(alerta);
  }

  eliminarReglaAlerta(index: number): void {
    this.reglasAlerta.removeAt(index);
  }

  private configurarReglaAlerta(alerta: FormGroup): void {
    // ========================================================
    // CONDICIÓN
    // ========================================================

    alerta.get('condicion')?.valueChanges.subscribe((condicion) => {
      this.actualizarControlesReglaAlerta(alerta, condicion);
    });

    // ========================================================
    // APLICAR POBLACIÓN
    // ========================================================

    alerta
      .get('aplicarPoblacion')
      ?.valueChanges.subscribe((aplicar: boolean) => {
        if (!aplicar) {
          alerta.get('sexo')?.setValue('TODOS', {
            emitEvent: false,
          });

          alerta.get('aplicarEdad')?.setValue(false, {
            emitEvent: false,
          });

          alerta.get('edadMin')?.setValue(null, {
            emitEvent: false,
          });

          alerta.get('edadMax')?.setValue(null, {
            emitEvent: false,
          });
        }

        this.actualizarValidacionEdadAlerta(alerta);
      });

    // ========================================================
    // APLICAR EDAD
    // ========================================================

    alerta.get('aplicarEdad')?.valueChanges.subscribe(() => {
      this.actualizarValidacionEdadAlerta(alerta);
    });

    // Estado inicial
    this.actualizarControlesReglaAlerta(alerta, alerta.get('condicion')?.value);

    this.actualizarValidacionEdadAlerta(alerta);
  }

  private actualizarValidacionEdadAlerta(alerta: FormGroup): void {
    const aplicarPoblacion = alerta.get('aplicarPoblacion')?.value;
    const aplicarEdad = alerta.get('aplicarEdad')?.value;
    const edadMin = alerta.get('edadMin');
    const edadMax = alerta.get('edadMax');
    const unidadEdad = alerta.get('unidadEdad');
    edadMin?.clearValidators();
    edadMax?.clearValidators();
    unidadEdad?.clearValidators();

    if (aplicarPoblacion && aplicarEdad) {
      edadMin?.setValidators([Validators.required, Validators.min(0)]);
      edadMax?.setValidators([Validators.required, Validators.min(0)]);
      unidadEdad?.setValidators([Validators.required]);
    } else {
      edadMin?.setValue(null, { emitEvent: false });
      edadMax?.setValue(null, { emitEvent: false });
    }

    edadMin?.updateValueAndValidity({ emitEvent: false });
    edadMax?.updateValueAndValidity({ emitEvent: false });
    unidadEdad?.updateValueAndValidity({ emitEvent: false });

    alerta.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private actualizarControlesReglaAlerta(
    alerta: FormGroup,
    condicion: string,
  ): void {
    const valor1 = alerta.get('valor1');
    const valor2 = alerta.get('valor2');

    valor1?.clearValidators();
    valor2?.clearValidators();

    // Siempre necesitamos valor1
    valor1?.setValidators([Validators.required]);

    if (condicion === 'FUERA_DE_RANGO') {
      valor2?.setValidators([Validators.required]);
    } else {
      valor2?.setValue(null, {
        emitEvent: false,
      });
    }

    valor1?.updateValueAndValidity({ emitEvent: false });
    valor2?.updateValueAndValidity({ emitEvent: false });

    /*
     * La condición también puede modificar
     * el resultado del validador del FormGroup.
     */
    alerta.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private validarReglaAlertaNumerica(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const condicion = control.get('condicion')?.value;
      const valor1 = control.get('valor1')?.value;
      const valor2 = control.get('valor2')?.value;
      const aplicarPoblacion = control.get('aplicarPoblacion')?.value;
      const aplicarEdad = control.get('aplicarEdad')?.value;
      const edadMin = control.get('edadMin')?.value;
      const edadMax = control.get('edadMax')?.value;

      if (
        condicion === 'FUERA_DE_RANGO' &&
        valor1 !== null &&
        valor1 !== '' &&
        valor2 !== null &&
        valor2 !== '' &&
        Number(valor1) > Number(valor2)
      ) {
        return {
          rangoAlertaInvalido: true,
        };
      }

      if (
        aplicarPoblacion &&
        aplicarEdad &&
        edadMin !== null &&
        edadMin !== '' &&
        edadMax !== null &&
        edadMax !== '' &&
        Number(edadMin) > Number(edadMax)
      ) {
        return {
          rangoEdadAlertaInvalido: true,
        };
      }
      return null;
    };
  }

  private validarReglaAlertaCategorica(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const aplicarPoblacion = control.get('aplicarPoblacion')?.value;
      const aplicarEdad = control.get('aplicarEdad')?.value;
      const edadMin = control.get('edadMin')?.value;
      const edadMax = control.get('edadMax')?.value;

      if (
        aplicarPoblacion &&
        aplicarEdad &&
        edadMin !== null &&
        edadMin !== '' &&
        edadMax !== null &&
        edadMax !== '' &&
        Number(edadMin) > Number(edadMax)
      ) {
        return {
          rangoEdadAlertaInvalido: true,
        };
      }

      return null;
    };
  }

  // ====== Validar formatos de captura numérica ======

  cambiarFormatosCapturaNumerica(): void {
    const formatos = (
      this.myFormItemLab.get('formatosCapturaNumerica')?.value ?? []
    ) as FormatoCapturaNumerica[];
    const controlDefault = this.myFormItemLab.get(
      'formatoCapturaNumericaDefault',
    );
    const actual = controlDefault?.value as FormatoCapturaNumerica | null;

    if (!formatos.length) {
      controlDefault?.setValue('VALOR', { emitEvent: false });
      return;
    }

    if (!actual || !formatos.includes(actual)) {
      controlDefault?.setValue(formatos[0], { emitEvent: false });
    }
  }

  obtenerFormatosCapturaSeleccionados(): FormatoCapturaNumerica[] {
    return (
      this.myFormItemLab.get('formatosCapturaNumerica')?.value ?? ['VALOR']
    ) as FormatoCapturaNumerica[];
  }

  // ====== Precisión numérica ======

  permiteDecimalesNumerico(): boolean {
    return this.myFormItemLab.get('precisionNumerica')?.value !== 'ENTERO';
  }

  permiteDecimalesEstructurado(): boolean {
    return (
      this.myFormItemLab.get('precisionNumericaEstructurada')?.value !== 'ENTERO'
    );
  }

  bloquearDecimalSiEntero(
    event: KeyboardEvent,
    permiteDecimales: boolean,
  ): void {
    if (permiteDecimales) return;

    if (['.', ',', 'Decimal'].includes(event.key)) {
      event.preventDefault();
    }
  }

  // ====== Configuración estructurada ======

  private construirConfiguracionEstructurada(): any | null {
    if (this.myFormItemLab.get('tipoResultado')?.value !== 'ESTRUCTURADO') {
      return null;
    }

    const tipoCuantificacion =
      this.myFormItemLab.get('cuantificacionEstructuradaTipo')?.value ??
      'CATEGORICA';

    return {
      subtipo: 'HALLAZGOS',
      permiteMultiples:
        this.myFormItemLab.get('permiteMultiplesEstructurada')?.value !== false,
      valorAusencia: String(
        this.myFormItemLab.get('valorAusenciaEstructurada')?.value ??
          'NO SE OBSERVAN',
      ).trim(),
      ausenciaEsReferencia:
        this.myFormItemLab.get('ausenciaEsReferenciaEstructurada')?.value === true,
      hallazgosNormales:
        this.myFormItemLab.get('hallazgosNormalesEstructurados')?.value ?? [],
      permitirOtroHallazgo:
        this.myFormItemLab.get('permitirOtroHallazgoEstructurado')?.value ===
        true,
      hallazgos: this.obtenerHallazgosEstructurados(),
      cuantificacion: {
        tipo: tipoCuantificacion,
        precisionNumerica:
          tipoCuantificacion === 'NUMERICA'
            ? (this.myFormItemLab.get('precisionNumericaEstructurada')?.value ??
              'DECIMAL')
            : 'DECIMAL',
        opciones:
          tipoCuantificacion === 'CATEGORICA'
            ? this.obtenerOpcionesCuantificacionEstructurada()
            : [],
        formatosCapturaNumerica:
          tipoCuantificacion === 'NUMERICA'
            ? this.obtenerFormatosCapturaEstructuradaSeleccionados()
            : ['VALOR'],
        formatoCapturaNumericaDefault:
          tipoCuantificacion === 'NUMERICA'
            ? (this.myFormItemLab.get('formatoCapturaEstructuradaDefault')
                ?.value ?? 'RANGO')
            : 'VALOR',
      },
    };
  }

  private construirValorPorDefectoEstructurado(): ValorPorDefectoResultadoItem {
    const configuracion = this.construirConfiguracionEstructurada();

    if (!configuracion) return null;

    const modo =
      this.myFormItemLab.get('modoDefaultEstructurado')?.value ?? 'AUSENCIA';

    if (modo === 'AUSENCIA') {
      return {
        tipo: 'HALLAZGOS',
        modo: 'AUSENCIA',
        valorAusencia: configuracion.valorAusencia,
        hallazgos: [],
      };
    }

    const hallazgos = this.hallazgosDefaultEstructurado.controls.map(
      (control) => {
        const hallazgo = String(control.get('hallazgo')?.value ?? '').trim();

        if (configuracion.cuantificacion.tipo === 'CATEGORICA') {
          return {
            hallazgo,
            valor: {
              tipo: 'CATEGORICO' as const,
              valor: String(control.get('valorCategorico')?.value ?? '').trim(),
            },
          };
        }

        const formato = (control.get('formatoNumerico')?.value ??
          configuracion.cuantificacion.formatoCapturaNumericaDefault ??
          'RANGO') as FormatoCapturaNumerica;

        if (formato === 'RANGO') {
          return {
            hallazgo,
            valor: {
              tipo: 'RANGO' as const,
              desde: Number(control.get('desde')?.value),
              hasta: Number(control.get('hasta')?.value),
            },
          };
        }

        const numero = Number(control.get('valor')?.value);

        if (formato === 'VALOR') {
          return { hallazgo, valor: numero };
        }

        return {
          hallazgo,
          valor: {
            tipo: formato,
            valor: numero,
          },
        };
      },
    );

    return {
      tipo: 'HALLAZGOS',
      modo: 'DETALLE',
      hallazgos,
    };
  }

  // ====== Valor por defecto numérico ======

  esFormatoDefaultRango(): boolean {
    return (
      this.myFormItemLab.get('formatoCapturaNumericaDefault')?.value ===
      'RANGO'
    );
  }

  simboloFormatoDefaultNumerico(): string {
    const formato = this.myFormItemLab.get(
      'formatoCapturaNumericaDefault',
    )?.value as FormatoCapturaNumerica | null;

    const simbolos: Partial<Record<FormatoCapturaNumerica, string>> = {
      MAYOR_QUE: '>',
      MAYOR_IGUAL_QUE: '>=',
      MENOR_QUE: '<',
      MENOR_IGUAL_QUE: '<=',
    };

    return formato ? (simbolos[formato] ?? '') : '';
  }

  private descomponerValorPorDefectoNumerico(item: IItemLab): {
    valor: number | null;
    desde: number | null;
    hasta: number | null;
    cualitativo: string;
  } {
    if (item.tipoResultado !== 'NUMERICO') {
      return { valor: null, desde: null, hasta: null, cualitativo: '' };
    }

    const valor = item.valorPorDefectoResultado;

    if (typeof valor === 'number') {
      return { valor, desde: null, hasta: null, cualitativo: '' };
    }

    if (typeof valor === 'string' && valor.trim() !== '') {
      const numero = Number(valor);
      return Number.isFinite(numero)
        ? { valor: numero, desde: null, hasta: null, cualitativo: '' }
        : { valor: null, desde: null, hasta: null, cualitativo: valor.trim() };
    }

    if (valor && typeof valor === 'object') {
      if (valor.tipo === 'CUALITATIVO') {
        return {
          valor: null,
          desde: null,
          hasta: null,
          cualitativo: String(valor.valor ?? '').trim(),
        };
      }

      if (valor.tipo === 'RANGO') {
        const desde = Number(valor.desde);
        const hasta = Number(valor.hasta);
        return {
          valor: null,
          desde: Number.isFinite(desde) ? desde : null,
          hasta: Number.isFinite(hasta) ? hasta : null,
          cualitativo: '',
        };
      }

      if ('valor' in valor) {
        const numero = Number(valor.valor);
        return {
          valor: Number.isFinite(numero) ? numero : null,
          desde: null,
          hasta: null,
          cualitativo: '',
        };
      }
    }

    return { valor: null, desde: null, hasta: null, cualitativo: '' };
  }

  private construirValorPorDefectoResultado(): ValorPorDefectoResultadoItem {
    const tipoResultado = this.myFormItemLab.get('tipoResultado')?.value;

    if (tipoResultado === 'ESTRUCTURADO') {
      return this.construirValorPorDefectoEstructurado();
    }

    if (tipoResultado !== 'NUMERICO') {
      return String(
        this.myFormItemLab.get('valorPorDefectoResultado')?.value ?? '',
      ).trim();
    }

    const cualitativo = String(
      this.myFormItemLab.get('valorCualitativoDefaultNumerico')?.value ?? '',
    ).trim();

    if (cualitativo) {
      return {
        tipo: 'CUALITATIVO',
        valor: cualitativo,
      };
    }

    const formato = (
      this.myFormItemLab.get('formatoCapturaNumericaDefault')?.value ??
      'VALOR'
    ) as FormatoCapturaNumerica;

    if (formato === 'RANGO') {
      const desdeRaw = this.myFormItemLab.get(
        'valorPorDefectoRangoDesde',
      )?.value;
      const hastaRaw = this.myFormItemLab.get(
        'valorPorDefectoRangoHasta',
      )?.value;

      if (
        desdeRaw === null ||
        desdeRaw === undefined ||
        desdeRaw === '' ||
        hastaRaw === null ||
        hastaRaw === undefined ||
        hastaRaw === ''
      ) {
        return null;
      }

      return {
        tipo: 'RANGO',
        desde: Number(desdeRaw),
        hasta: Number(hastaRaw),
      };
    }

    const valorRaw = this.myFormItemLab.get(
      'valorPorDefectoResultado',
    )?.value;

    if (valorRaw === null || valorRaw === undefined || valorRaw === '') {
      return null;
    }

    const numero = Number(valorRaw);

    if (formato === 'VALOR') {
      return numero;
    }

    return {
      tipo: formato,
      valor: numero,
    };
  }

  // ==========================================================
  // CONSTRUIR BODY
  // ==========================================================

  private construirBody(): IItemLab {
    const formValue = this.myFormItemLab.value;
    const esCategorico = formValue.tipoResultado === 'CATEGORICO';
    const admiteAlertas =
      formValue.tipoResultado === 'NUMERICO' ||
      formValue.tipoResultado === 'CATEGORICO';

    return {
      codItemLab: formValue.codItemLab ?? undefined,
      nombreInforme: formValue.nombreInforme,
      nombreHojaTrabajo: formValue.nombreHojaTrabajo,
      metodoItemLab: formValue.metodoItemLab,
      valoresHojaTrabajo: formValue.valoresHojaTrabajo,
      valoresInforme: formValue.valoresInforme,
      unidadesRef: formValue.unidadesRef ?? '',

      // ======================================================
      // LEGACY
      // ======================================================

      perteneceAPrueba: null,
      ordenImpresion: formValue.ordenImpresion ?? 0,
      grupoItemLab: formValue.grupoItemLab ?? '',
      poseeValidacion: formValue.poseeValidacion ?? false,
      paramValidacion: formValue.paramValidacion ?? [],

      // ======================================================
      // NUEVA ESTRUCTURA
      // ======================================================

      contextoAnalitico: formValue.contextoAnalitico ?? '',
      tipoResultado: formValue.tipoResultado ?? 'TEXTO',
      opcionesResultado:
        formValue.tipoResultado === 'CATEGORICO'
          ? (formValue.opcionesResultado ?? [])
          : [],
      valorPorDefectoResultado: this.construirValorPorDefectoResultado(),
      formatosCapturaNumerica:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.formatosCapturaNumerica ?? ['VALOR'])
          : ['VALOR'],
      formatoCapturaNumericaDefault:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.formatoCapturaNumericaDefault ?? 'VALOR')
          : 'VALOR',
      precisionNumerica:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.precisionNumerica ?? 'DECIMAL')
          : 'DECIMAL',
      valoresCualitativosAlternativos:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.valoresCualitativosAlternativos ?? [])
          : [],
      valoresCualitativosReferencia:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.valoresCualitativosReferencia ?? [])
          : [],
      configuracionEstructurada:
        formValue.tipoResultado === 'ESTRUCTURADO'
          ? this.construirConfiguracionEstructurada()
          : null,
      permiteValorNoListado:
        formValue.tipoResultado === 'CATEGORICO'
          ? (formValue.permiteValorNoListado ?? false)
          : false,
      esOpcional: formValue.esOpcional === true,
      mostrarReferenciaInforme: formValue.mostrarReferenciaInforme !== false,
      estadoItem: formValue.estado ? 'ACTIVO' : 'INACTIVO',

      /*
       * Todavía no estamos editando estas dos estructuras.
       *
       * Si el item ya tenía datos, los conservamos.
       * Si es nuevo, se envían arrays vacíos.
       */
      referenciasResultado: this.construirReferenciasSegunTipo(),
      reglasAlerta: admiteAlertas ? this.construirReglasAlerta() : [],
    };
  }

  private construirReferenciasResultado() {
    return this.referenciasResultado.controls.map((control) => {
      const referencia = control.value;

      return {
        descripcion: referencia.descripcion ?? '',
        sexo: referencia.sexo ?? 'TODOS',
        edadMin: referencia.aplicarEdad ? referencia.edadMin : null,
        edadMax: referencia.aplicarEdad ? referencia.edadMax : null,
        unidadEdad: referencia.unidadEdad ?? 'ANIOS',
        tipoReferencia: referencia.tipoReferencia,
        valorMin:
          referencia.tipoReferencia === 'RANGO' ? referencia.valorMin : null,
        valorMax:
          referencia.tipoReferencia === 'RANGO' ? referencia.valorMax : null,
        valorLimite:
          referencia.tipoReferencia !== 'RANGO' ? referencia.valorLimite : null,
        valoresPermitidos: [],
        textoReferencia: '',
        activo: referencia.activo ?? true,
      };
    });
  }

  private construirReferenciasSegunTipo() {
    const tipoResultado = this.myFormItemLab.get('tipoResultado')?.value;

    if (tipoResultado === 'NUMERICO') {
      return this.construirReferenciasResultado();
    }

    if (tipoResultado === 'CATEGORICO') {
      return this.construirReferenciaCategorica();
    }

    if (tipoResultado === 'TEXTO') {
      return this.construirReferenciaTexto();
    }

    return [];
  }

  private construirReferenciaCategorica() {
    const valoresPermitidos: string[] =
      this.myFormItemLab.get('valoresReferenciaCategorica')?.value ?? [];

    if (valoresPermitidos.length === 0) {
      return [];
    }

    return [
      {
        descripcion: 'Valor de referencia',
        sexo: 'TODOS' as const,
        edadMin: null,
        edadMax: null,
        unidadEdad: 'ANIOS' as const,
        tipoReferencia: 'VALORES_PERMITIDOS' as const,
        valorMin: null,
        valorMax: null,
        valorLimite: null,
        valoresPermitidos: valoresPermitidos,
        textoReferencia: '',
        activo: true,
      },
    ];
  }

  private construirReferenciaTexto() {
    const poseeReferencia = this.myFormItemLab.get(
      'poseeReferenciaTexto',
    )?.value;

    const texto = this.myFormItemLab
      .get('textoReferenciaResultado')
      ?.value?.trim();

    if (!poseeReferencia || !texto) {
      return [];
    }

    return [
      {
        descripcion: 'Valor de referencia',
        sexo: 'TODOS' as const,
        edadMin: null,
        edadMax: null,
        unidadEdad: 'ANIOS' as const,
        tipoReferencia: 'TEXTO' as const,
        valorMin: null,
        valorMax: null,
        valorLimite: null,
        valoresPermitidos: [],
        textoReferencia: texto,
        activo: true,
      },
    ];
  }

  private construirReglasAlerta() {
    return this.reglasAlerta.controls.map((control) => {
      const alerta = control.value;
      const esRango = alerta.condicion === 'FUERA_DE_RANGO';

      return {
        descripcion: alerta.descripcion ?? '',

        sexo: alerta.aplicarPoblacion ? (alerta.sexo ?? 'TODOS') : 'TODOS',
        edadMin:
          alerta.aplicarPoblacion && alerta.aplicarEdad ? alerta.edadMin : null,
        edadMax:
          alerta.aplicarPoblacion && alerta.aplicarEdad ? alerta.edadMax : null,
        unidadEdad:
          alerta.aplicarPoblacion && alerta.aplicarEdad
            ? (alerta.unidadEdad ?? 'ANIOS')
            : 'ANIOS',
        condicion: alerta.condicion,
        valor1: alerta.valor1,
        valor2: esRango ? alerta.valor2 : null,
        nivelAlerta: alerta.nivelAlerta ?? 'ADVERTENCIA',
        mensaje: alerta.mensaje ?? '',
        activo: alerta.activo ?? true,
      };
    });
  }

  // ==========================================================
  // REGISTRAR
  // ==========================================================

  public formSubmitted = false;

  registraItemLab(): void {
    this.formSubmitted = true;

    if (this.myFormItemLab.invalid) {
      this.myFormItemLab.markAllAsTouched();
      return;
    }

    if (!this.validarArrayValores()) {
      return;
    }

    if (!this.validarConfiguracionResultado()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();

      this._itemLabService.registrarItemLab(body).subscribe({
        next: () => {
          Swal.fire({
            title: 'Confirmado',
            text: 'Item Registrado',
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.ultimosItems();
          this.nuevoItem();
        },

        error: (err) => {
          const mensaje =
            err?.error?.msg ||
            err?.message ||
            'No se pudo registrar el item. Intenta nuevamente.';

          Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
    });
  }

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  actualizarItem(): void {
    this.formSubmitted = true;

    if (this.myFormItemLab.invalid) {
      this.myFormItemLab.markAllAsTouched();
      return;
    }

    if (!this.validarArrayValores()) {
      return;
    }

    if (!this.validarConfiguracionResultado()) {
      return;
    }

    const codigo =
      this.itemSeleccionado?.codItemLab ??
      this.myFormItemLab.get('codItemLab')?.value;

    if (!codigo) {
      Swal.fire('Error', 'No se encontró el código del item', 'error');
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este item?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();

      this._itemLabService.actualizarItem(codigo, body).subscribe({
        next: () => {
          Swal.fire({
            title: 'Confirmado',
            text: 'Item Actualizado',
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.ultimosItems();
          this.nuevoItem();
        },

        error: (err) => {
          const mensaje =
            err?.error?.msg ||
            err?.message ||
            'No se pudo actualizar el item. Intenta nuevamente.';

          Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
    });
  }

  // ==========================================================
  // NUEVO
  // ==========================================================

  nuevoItem(): void {
    this.formSubmitted = false;
    this.itemSeleccionado = null;
    this.filaSeleccionadaIndex = null;
    this.paramValidacion.clear();
    this.referenciasResultado.clear();
    this.reglasAlerta.clear();
    this.hallazgosDefaultEstructurado.clear();

    this.myFormItemLab.reset({
      _id: null,
      codItemLab: null,
      nombreInforme: '',
      nombreHojaTrabajo: '',
      metodoItemLab: '',
      valoresHojaTrabajo: '',
      valoresInforme: '',
      unidadesRef: '',

      // Legacy
      perteneceAPrueba: null,
      ordenImpresion: 0,
      grupoItemLab: '',
      poseeValidacion: false,

      // Nuevos
      contextoAnalitico: '',
      tipoResultado: 'TEXTO',
      opcionesResultado: [],
      valorPorDefectoResultado: '',
      valorPorDefectoRangoDesde: null,
      valorPorDefectoRangoHasta: null,
      formatosCapturaNumerica: ['VALOR'],
      formatoCapturaNumericaDefault: 'VALOR',
      precisionNumerica: 'DECIMAL',
      valoresCualitativosAlternativos: [],
      valoresCualitativosReferencia: [],
      valorCualitativoDefaultNumerico: '',
      hallazgosEstructurados: [],
      cuantificacionEstructuradaTipo: 'CATEGORICA',
      opcionesCuantificacionEstructurada: [],
      formatosCapturaEstructurada: ['RANGO'],
      formatoCapturaEstructuradaDefault: 'RANGO',
      precisionNumericaEstructurada: 'DECIMAL',
      valorAusenciaEstructurada: 'NO SE OBSERVAN',
      ausenciaEsReferenciaEstructurada: true,
      hallazgosNormalesEstructurados: [],
      permiteMultiplesEstructurada: true,
      permitirOtroHallazgoEstructurado: false,
      modoDefaultEstructurado: 'AUSENCIA',
      permiteValorNoListado: false,
      esOpcional: false,
      mostrarReferenciaInforme: true,
      valoresReferenciaCategorica: [],
      poseeReferenciaTexto: false,
      textoReferenciaResultado: '',
      estado: true,
    });
  }
}
