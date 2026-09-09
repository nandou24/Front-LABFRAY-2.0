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
  IItemLab,
  TipoResultadoItem,
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

  public tiposResultado: {
    value: TipoResultadoItem;
    label: string;
  }[] = [
    {
      value: 'NUMERICO',
      label: 'Numérico',
    },
    {
      value: 'TEXTO',
      label: 'Texto',
    },
    {
      value: 'CATEGORICO',
      label: 'Categórico',
    },
  ];

  public sexosReferencia = [
    {
      value: 'TODOS',
      label: 'Todos',
    },
    {
      value: 'MASCULINO',
      label: 'Masculino',
    },
    {
      value: 'FEMENINO',
      label: 'Femenino',
    },
  ];

  public tiposReferenciaNumerica = [
    {
      value: 'RANGO',
      label: 'Rango',
    },
    {
      value: 'MENOR_QUE',
      label: 'Menor que',
    },
    {
      value: 'MENOR_IGUAL_QUE',
      label: 'Menor o igual que',
    },
    {
      value: 'MAYOR_QUE',
      label: 'Mayor que',
    },
    {
      value: 'MAYOR_IGUAL_QUE',
      label: 'Mayor o igual que',
    },
  ];

  public unidadesEdad = [
    {
      value: 'DIAS',
      label: 'Días',
    },
    {
      value: 'MESES',
      label: 'Meses',
    },
    {
      value: 'ANIOS',
      label: 'Años',
    },
  ];

  public condicionesAlertaNumerica = [
    {
      value: 'MENOR_QUE',
      label: 'Menor que',
    },
    {
      value: 'MENOR_IGUAL_QUE',
      label: 'Menor o igual que',
    },
    {
      value: 'MAYOR_QUE',
      label: 'Mayor que',
    },
    {
      value: 'MAYOR_IGUAL_QUE',
      label: 'Mayor o igual que',
    },
    {
      value: 'FUERA_DE_RANGO',
      label: 'Fuera de rango',
    },
    {
      value: 'IGUAL_A',
      label: 'Igual a',
    },
    {
      value: 'DISTINTO_DE',
      label: 'Distinto de',
    },
  ];

  public nivelesAlerta = [
    {
      value: 'INFORMATIVA',
      label: 'Informativa',
    },
    {
      value: 'ADVERTENCIA',
      label: 'Advertencia',
    },
    {
      value: 'CRITICA',
      label: 'Crítica',
    },
  ];

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

  // ==========================================================
  // INICIALIZACIÓN
  // ==========================================================

  ngOnInit(): void {
    this.ultimosItems();
    this.limpiarValidacion();
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;

        if (this.isMobile) {
          this.opened = false;
        }
      });
  }

  // ==========================================================
  // RESPONSIVE
  // ==========================================================

  public opened = false;
  public isMobile = false;

  get sidenavMode(): 'side' | 'over' {
    return this.isMobile ? 'over' : 'side';
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
        descripcion: ['', [Validators.required, Validators.maxLength(100)]],
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
    const opciones = this.obtenerOpcionesResultado();
    const opcionEliminada = opciones[index];

    opciones.splice(index, 1);

    this.myFormItemLab.get('opcionesResultado')?.setValue([...opciones]);

    // Si la opción eliminada estaba configurada
    // como referencia, también la retiramos.
    const referenciasActuales: string[] =
      this.myFormItemLab.get('valoresReferenciaCategorica')?.value ?? [];

    this.myFormItemLab
      .get('valoresReferenciaCategorica')
      ?.setValue(
        referenciasActuales.filter((valor) => valor !== opcionEliminada),
      );

    this.myFormItemLab.get('opcionesResultado')?.markAsDirty();
  }

  obtenerOpcionesResultado(): string[] {
    return this.myFormItemLab.get('opcionesResultado')?.value ?? [];
  }

  onEnterOpcionResultado(event: Event): void {
    event.preventDefault();
    this.agregarOpcionResultado();
  }

  private validarConfiguracionResultado(): boolean {
    const tipoResultado = this.myFormItemLab.get('tipoResultado')?.value;

    if (tipoResultado === 'CATEGORICO') {
      const opciones = this.obtenerOpcionesResultado();

      if (opciones.length === 0) {
        Swal.fire({
          title: 'Opciones de resultado requeridas',
          text: 'Un Item categórico debe tener al menos una opción de resultado.',
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }
    }

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

  // ==========================================================
  // TABLA
  // ==========================================================

  @ViewChild(MatTable)
  table!: MatTable<any>;

  @ViewChild('MatPaginatorItems')
  paginatorItems!: MatPaginator;

  /*
   * Temporalmente usamos any aquí porque el HTML antiguo
   * todavía intenta acceder directamente a:
   *
   * item.perteneceAPrueba.nombrePruebaLab
   *
   * Cuando cambiemos el HTML, volverá a ser:
   *
   * MatTableDataSource<IItemLab>
   */
  public dataSourceItems = new MatTableDataSource<any>();
  private todosLosItems: IItemLab[] = [];
  public columnasTablaPaciente: string[] = [
    'Codigo',
    'NombreItem',
    // 'PerteneceAPrueba',
    'grupoItemLab',
    'ordenImpresion',
    'accion',
  ];

  ngAfterViewInit(): void {
    this.dataSourceItems.paginator = this.paginatorItems;

    this.dataSourceItems.filterPredicate = (data: IItemLab, filter: string) => {
      const searchStr = filter.toLowerCase();
      let nombrePrueba = '';

      if (data.perteneceAPrueba && typeof data.perteneceAPrueba === 'object') {
        nombrePrueba =
          data.perteneceAPrueba.nombrePruebaLab?.toLowerCase() ?? '';
      }

      const campos = [
        data.codItemLab?.toLowerCase() ?? '',
        data.nombreInforme?.toLowerCase() ?? '',
        data.nombreHojaTrabajo?.toLowerCase() ?? '',
        data.metodoItemLab?.toLowerCase() ?? '',
        data.contextoAnalitico?.toLowerCase() ?? '',
        data.tipoResultado?.toLowerCase() ?? '',
        data.estadoItem?.toLowerCase() ?? '',
        data.grupoItemLab?.toLowerCase() ?? '',
        nombrePrueba,
      ];

      return campos.some((campo) => campo.includes(searchStr));
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

  // ==========================================================
  // SELECCIÓN / EDICIÓN
  // ==========================================================

  public filaSeleccionadaIndex: number | null = null;
  private itemSeleccionado: IItemLab | null = null;

  cargarItemLab(item: IItemLab, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.itemSeleccionado = item;
    this.paramValidacion.clear();
    this.referenciasResultado.clear();
    this.reglasAlerta.clear();
    const referenciaCategorica = (item.referenciasResultado ?? []).find(
      (referencia) => referencia.tipoReferencia === 'VALORES_PERMITIDOS',
    );

    const valoresReferenciaCategorica =
      referenciaCategorica?.valoresPermitidos ?? [];

    const referenciaTexto = (item.referenciasResultado ?? []).find(
      (referencia) => referencia.tipoReferencia === 'TEXTO',
    );

    const textoReferenciaResultado = referenciaTexto?.textoReferencia ?? '';

    const poseeReferenciaTexto = textoReferenciaResultado.trim().length > 0;

    this.myFormItemLab.reset({
      _id: item._id ?? null,
      codItemLab: item.codItemLab ?? null,
      nombreInforme: item.nombreInforme ?? '',
      nombreHojaTrabajo: item.nombreHojaTrabajo ?? '',
      metodoItemLab: item.metodoItemLab ?? '',
      valoresHojaTrabajo: item.valoresHojaTrabajo ?? '',
      valoresInforme: item.valoresInforme ?? '',
      unidadesRef: item.unidadesRef ?? '',

      // Legacy
      perteneceAPrueba: null,
      ordenImpresion: item.ordenImpresion ?? 0,
      grupoItemLab: item.grupoItemLab ?? '',
      poseeValidacion: item.poseeValidacion ?? false,

      // Nuevos
      contextoAnalitico: item.contextoAnalitico ?? '',
      tipoResultado: item.tipoResultado ?? 'TEXTO',
      opcionesResultado: item.opcionesResultado ?? [],
      valoresReferenciaCategorica: valoresReferenciaCategorica,
      poseeReferenciaTexto: poseeReferenciaTexto,
      textoReferenciaResultado: textoReferenciaResultado,
      estado: (item.estadoItem ?? 'ACTIVO') === 'ACTIVO',
    });

    (item.referenciasResultado ?? []).forEach((referencia) => {
      const grupo = this.crearReferenciaGroup(referencia);

      this.referenciasResultado.push(grupo);
    });

    (item.reglasAlerta ?? []).forEach((alerta) => {
      const grupo = this.crearReglaAlertaGroup(alerta);

      this.reglasAlerta.push(grupo);
    });

    // (item.paramValidacion ?? []).forEach((validacion) => {
    //   const grupo = this.crearValidacionGroup(validacion);

    //   this.paramValidacion.push(grupo);
    // });
  }

  private crearReferenciaGroup(referencia: any): FormGroup {
    const tieneEdad =
      (referencia.edadMin !== null && referencia.edadMin !== undefined) ||
      (referencia.edadMax !== null && referencia.edadMax !== undefined);

    const grupo = this._fb.group(
      {
        descripcion: [referencia.descripcion ?? '', [Validators.required]],
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

  private crearReglaAlertaGroup(alerta: any): FormGroup {
    const grupo = this._fb.group(
      {
        descripcion: [
          alerta.descripcion ?? '',
          [Validators.required, Validators.maxLength(100)],
        ],

        condicion: [alerta.condicion ?? 'MENOR_QUE', [Validators.required]],
        valor1: [alerta.valor1 ?? null],
        valor2: [alerta.valor2 ?? null],
        nivelAlerta: [
          alerta.nivelAlerta ?? 'ADVERTENCIA',
          [Validators.required],
        ],
        mensaje: [alerta.mensaje ?? '', [Validators.maxLength(250)]],
        activo: [alerta.activo ?? true],
      },
      {
        validators: [this.validarReglaAlertaNumerica()],
      },
    );

    this.configurarReglaAlerta(grupo);

    return grupo;
  }

  //REGLAS DE ALERTA

  agregarReglaAlerta(): void {
    const alerta = this._fb.group(
      {
        descripcion: ['', [Validators.required, Validators.maxLength(100)]],
        condicion: ['MENOR_QUE', [Validators.required]],
        valor1: [null],
        valor2: [null],
        nivelAlerta: ['ADVERTENCIA', [Validators.required]],
        mensaje: ['', [Validators.maxLength(250)]],
        activo: [true],
      },
      {
        validators: [this.validarReglaAlertaNumerica()],
      },
    );

    this.configurarReglaAlerta(alerta);
    this.reglasAlerta.push(alerta);
  }

  eliminarReglaAlerta(index: number): void {
    this.reglasAlerta.removeAt(index);
  }

  private configurarReglaAlerta(alerta: FormGroup): void {
    alerta.get('condicion')?.valueChanges.subscribe((condicion) => {
      this.actualizarControlesReglaAlerta(alerta, condicion);
    });

    this.actualizarControlesReglaAlerta(alerta, alerta.get('condicion')?.value);
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

      return null;
    };
  }

  // ==========================================================
  // CONSTRUIR BODY
  // ==========================================================

  private construirBody(): IItemLab {
    const formValue = this.myFormItemLab.value;

    return {
      codItemLab: formValue.codItemLab ?? undefined,
      nombreInforme: formValue.nombreInforme,
      nombreHojaTrabajo: formValue.nombreHojaTrabajo,
      metodoItemLab: formValue.metodoItemLab,
      valoresHojaTrabajo: formValue.valoresHojaTrabajo,
      valoresInforme: formValue.valoresInforme,
      unidadesRef:
        formValue.tipoResultado === 'NUMERICO'
          ? (formValue.unidadesRef ?? '')
          : '',

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
      opcionesResultado: formValue.opcionesResultado ?? [],
      estadoItem: formValue.estado ? 'ACTIVO' : 'INACTIVO',

      /*
       * Todavía no estamos editando estas dos estructuras.
       *
       * Si el item ya tenía datos, los conservamos.
       * Si es nuevo, se envían arrays vacíos.
       */
      referenciasResultado: this.construirReferenciasSegunTipo(),
      reglasAlerta:
        formValue.tipoResultado === 'NUMERICO'
          ? this.construirReglasAlerta()
          : [],
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

        /*
         * Todavía no configuramos
         * sexo ni edad desde la UI.
         */
        sexo: 'TODOS' as const,
        edadMin: null,
        edadMax: null,
        unidadEdad: 'ANIOS' as const,
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
      valoresReferenciaCategorica: [],
      poseeReferenciaTexto: false,
      textoReferenciaResultado: '',
      estado: true,
    });
  }

  // ==========================================================
  // DELETE LEGACY
  // ==========================================================
  /*
   * TEMPORAL.
   *
   * El HTML actual todavía llama este método.
   * Cuando actualicemos el HTML se eliminará.
   */

  eliminarItemLab(item: IItemLab): void {
    if (!item._id) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el item ${item.nombreInforme}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this._itemLabService.eliminarItemLab(item._id!).subscribe({
        next: () => {
          Swal.fire({
            title: 'Confirmado',
            text: 'Item Eliminado',
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.ultimosItems();
        },

        error: (err) => {
          const mensaje =
            err?.error?.msg ||
            err?.message ||
            'No se pudo eliminar el item. Intenta nuevamente.';

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
}
