import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import {
  AlcanceRequerimientoMuestra,
  EstadoPruebaLab,
  IProcesamientoLab,
  IPruebaLab,
  IRequerimientoMuestra,
  TipoProcesamientoLab,
  UnidadVolumen,
} from '../../../models/Mantenimiento/pruebaLab.models';
import { ITipoMuestra } from '../../../models/Mantenimiento/tipoMuestra.models';
import { ITuboEnvase } from '../../../models/Mantenimiento/tuboEnvase.models';
import { IItemLab } from '../../../models/Mantenimiento/items.models';
import { MatButtonModule } from '@angular/material/button';
import { PruebaLabService } from '../../../services/mantenimiento/pruebaLab/prueba-lab.service';
import { ItemLabService } from '../../../services/mantenimiento/itemLab/item-lab.service';
import Swal from 'sweetalert2';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TipoMuestraService } from '../../../services/mantenimiento/tipoMuestra/tipo-muestra.service';
import { TuboEnvaseService } from '../../../services/mantenimiento/tuboEnvase/tubo-envase.service';

@Component({
  selector: 'app-mant-prueba-lab',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatAutocompleteModule,
  ],
  templateUrl: './mant-prueba-lab.component.html',
  styleUrl: './mant-prueba-lab.component.scss',
})
export class MantPruebaLabComponent implements OnInit, AfterViewInit {
  constructor(
    private _pruebaLabService: PruebaLabService,
    private _itemLabService: ItemLabService,
  ) {}

  ngOnInit(): void {
    this.ultimasPruebas();
    this.ultimosItems();
    this.cargarTiposMuestraActivos();
    this.cargarTubosEnvasesActivos();
  }

  private _fb = inject(FormBuilder);
  private readonly _tipoMuestraService = inject(TipoMuestraService);
  private readonly _tuboEnvaseService = inject(TuboEnvaseService);

  // ====== Procesamiento ======

  public tiposProcesamiento: {
    value: TipoProcesamientoLab;
    label: string;
  }[] = [
    { value: 'INTERNO', label: 'Interno' },
    { value: 'REFERENCIA', label: 'Referencia' },
  ];

  // ====== Requerimientos de muestra ======

  public alcancesRequerimiento: {
    value: AlcanceRequerimientoMuestra;
    label: string;
  }[] = [
    { value: 'TODA_PRUEBA', label: 'Toda la prueba' },
    { value: 'ITEMS_ESPECIFICOS', label: 'Items específicos' },
  ];

  public unidadesVolumen: {
    value: UnidadVolumen;
    label: string;
  }[] = [
    { value: 'uL', label: 'µL' },
    { value: 'mL', label: 'mL' },
    { value: 'L', label: 'L' },
  ];

  // ====== Catálogos de muestras ======

  public tiposMuestraActivos: ITipoMuestra[] = [];
  public tubosEnvasesActivos: ITuboEnvase[] = [];

  public myFormPruebaLab: FormGroup = this._fb.group({
    codPruebaLab: [''],
    areaLab: ['', [Validators.required]],
    nombrePruebaLab: ['', [Validators.required]],
    condPreAnalitPaciente: ['', [Validators.required]],
    condPreAnalitRefer: ['', [Validators.required]],
    tiempoRespuesta: [
      '',
      [Validators.required, Validators.pattern('^[1-9][0-9]*$')],
    ],
    observPruebas: [''],

    // En el formulario seguimos usando boolean.
    estadoPrueba: [true, [Validators.required]],

    // ====== Procesamiento por defecto ======

    procesamientoDefault: this._fb.group({
      tipo: ['INTERNO', [Validators.required]],
      laboratorioReferenciaId: [null],
      observacion: ['', [Validators.maxLength(250)]],
    }),

    gruposResultado: this._fb.array([]),
    // ====== Requerimientos de muestra ======

    requiereMuestra: [true],
    requerimientosMuestra: this._fb.array([]),
  });

  get procesamientoDefault(): FormGroup {
    return this.myFormPruebaLab.get('procesamientoDefault') as FormGroup;
  }

  get gruposResultado(): FormArray {
    return this.myFormPruebaLab.get('gruposResultado') as FormArray;
  }

  get requerimientosMuestra(): FormArray {
    return this.myFormPruebaLab.get('requerimientosMuestra') as FormArray;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorPruebas') paginatorPruebas!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourcePruebas.paginator = this.paginatorPruebas;
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //Tabla pruebas de laboratorio
  columnasPruebas: string[] = ['codigo', 'nombre', 'areaLab'];
  dataSourcePruebas = new MatTableDataSource<IPruebaLab>();

  // ====== Grupos de resultado ======

  private crearGrupoResultado(grupo?: any): FormGroup {
    const tieneOverride = !!grupo?.procesamientoOverride;
    const formGrupo = this._fb.group({
      nombreGrupo: [grupo?.nombreGrupo ?? ''],
      ordenGrupo: [
        grupo?.ordenGrupo ?? 0,
        [Validators.required, Validators.min(0)],
      ],
      mostrarTitulo: [grupo?.mostrarTitulo ?? true],
      usarProcesamientoOverride: [tieneOverride],
      procesamientoOverride: this._fb.group({
        tipo: [grupo?.procesamientoOverride?.tipo ?? 'INTERNO'],
        laboratorioReferenciaId: [
          grupo?.procesamientoOverride?.laboratorioReferenciaId ?? null,
        ],
        observacion: [grupo?.procesamientoOverride?.observacion ?? ''],
      }),

      // Solo frontend
      busquedaItem: [''],
      items: this._fb.array([]),
    });

    const items = formGrupo.get('items') as FormArray;

    (grupo?.items ?? []).forEach((item: any) => {
      items.push(this.crearItemGrupoResultado(item));
    });

    return formGrupo;
  }

  // ====== Opción de muestra ======

  private crearOpcionMuestra(opcion?: any): FormGroup {
    return this._fb.group({
      tipoMuestraId: [opcion?.tipoMuestraId ?? null, [Validators.required]],
      tuboEnvaseId: [opcion?.tuboEnvaseId ?? null, [Validators.required]],
    });
  }

  // ====== Requerimiento de muestra ======

  private crearRequerimientoMuestra(requerimiento?: any): FormGroup {
    const grupo = this._fb.group({
      descripcion: [requerimiento?.descripcion ?? ''],
      alcance: [requerimiento?.alcance ?? 'TODA_PRUEBA', [Validators.required]],
      opciones: this._fb.array([]),
      itemsAsociados: [requerimiento?.itemsAsociados ?? []],
      cantidadRecipientes: [
        requerimiento?.cantidadRecipientes ?? 1,
        [Validators.required, Validators.min(1)],
      ],
      volumenMinimo: [
        requerimiento?.volumenMinimo ?? null,
        [Validators.min(0)],
      ],

      unidadVolumen: [requerimiento?.unidadVolumen ?? null],
      permiteCompartirMuestra: [requerimiento?.permiteCompartirMuestra ?? true],
      observacion: [
        requerimiento?.observacion ?? '',
        [Validators.maxLength(250)],
      ],
    });

    const opciones = grupo.get('opciones') as FormArray;
    const opcionesExistentes = requerimiento?.opciones ?? [];

    if (opcionesExistentes.length > 0) {
      opcionesExistentes.forEach((opcion: any) => {
        opciones.push(this.crearOpcionMuestra(opcion));
      });
    } else {
      /*
       * Un requerimiento nuevo comienza
       * con una opción vacía.
       */
      opciones.push(this.crearOpcionMuestra());
    }

    return grupo;
  }

  obtenerOpcionesRequerimiento(requerimientoIndex: number): FormArray {
    return this.requerimientosMuestra
      .at(requerimientoIndex)
      .get('opciones') as FormArray;
  }

  agregarRequerimientoMuestra(): void {
    this.requerimientosMuestra.push(this.crearRequerimientoMuestra());
  }

  eliminarRequerimientoMuestra(index: number): void {
    this.requerimientosMuestra.removeAt(index);
  }

  agregarOpcionMuestra(requerimientoIndex: number): void {
    const opciones = this.obtenerOpcionesRequerimiento(requerimientoIndex);

    opciones.push(this.crearOpcionMuestra());
  }

  eliminarOpcionMuestra(requerimientoIndex: number, opcionIndex: number): void {
    const opciones = this.obtenerOpcionesRequerimiento(requerimientoIndex);

    /* Conservamos al menos una opción dentro del requerimiento.*/
    if (opciones.length <= 1) {
      Swal.fire({
        title: 'Aviso',
        text: 'El requerimiento debe tener al menos una opción de muestra.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return;
    }

    opciones.removeAt(opcionIndex);
  }

  // ====== Búsqueda de Items ======

  obtenerItemsFiltradosParaGrupo(grupoIndex: number): IItemLab[] {
    const grupo = this.gruposResultado.at(grupoIndex);
    const valor = grupo.get('busquedaItem')?.value;
    const termino = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
    const disponibles = this.todosLosItems.filter(
      (item) =>
        item.estadoItem !== 'INACTIVO' && !this.itemYaAsignado(item._id),
    );

    if (!termino) {
      return disponibles;
    }

    return disponibles.filter((item) => {
      const codigo = item.codItemLab?.toLowerCase() ?? '';
      const nombre = item.nombreInforme?.toLowerCase() ?? '';
      const nombreHoja = item.nombreHojaTrabajo?.toLowerCase() ?? '';
      const contexto = item.contextoAnalitico?.toLowerCase() ?? '';

      return (
        codigo.includes(termino) ||
        nombre.includes(termino) ||
        nombreHoja.includes(termino) ||
        contexto.includes(termino)
      );
    });
  }

  private crearItemGrupoResultado(item?: any): FormGroup {
    let itemReal: IItemLab | null = null;

    if (item?.itemLabId && typeof item.itemLabId === 'object') {
      itemReal = item.itemLabId;
    } else if (item?._id && item?.codItemLab) {
      itemReal = item;
    }

    const tieneOverride = !!item?.procesamientoOverride;

    return this._fb.group({
      itemLabId: [
        itemReal?._id ?? item?.itemLabId ?? item?._id ?? null,
        [Validators.required],
      ],

      // Solo frontend
      codItemLab: [itemReal?.codItemLab ?? item?.codItemLab ?? ''],
      // Solo frontend
      nombreInforme: [itemReal?.nombreInforme ?? item?.nombreInforme ?? ''],
      // Solo frontend
      contextoAnalitico: [
        itemReal?.contextoAnalitico ?? item?.contextoAnalitico ?? '',
      ],

      ordenItem: [
        item?.ordenItem ?? 0,
        [Validators.required, Validators.min(0)],
      ],

      mostrarItem: [item?.mostrarItem ?? true],
      usarProcesamientoOverride: [tieneOverride],
      procesamientoOverride: this._fb.group({
        tipo: [item?.procesamientoOverride?.tipo ?? 'INTERNO'],
        laboratorioReferenciaId: [
          item?.procesamientoOverride?.laboratorioReferenciaId ?? null,
        ],
        observacion: [item?.procesamientoOverride?.observacion ?? ''],
      }),
    });
  }

  obtenerItemsGrupo(grupoIndex: number): FormArray {
    return this.gruposResultado.at(grupoIndex).get('items') as FormArray;
  }

  private itemYaAsignado(itemId?: string): boolean {
    if (!itemId) {
      return false;
    }

    return this.gruposResultado.controls.some((grupo) => {
      const items = grupo.get('items') as FormArray;

      return items.controls.some(
        (control) => String(control.get('itemLabId')?.value) === String(itemId),
      );
    });
  }

  obtenerItemsDisponiblesParaGrupo(): IItemLab[] {
    return this.todosLosItems.filter(
      (item) =>
        item.estadoItem !== 'INACTIVO' && !this.itemYaAsignado(item._id),
    );
  }

  agregarItemAGrupo(grupoIndex: number, item: IItemLab | null): void {
    if (!item || !item._id) {
      return;
    }

    if (this.itemYaAsignado(item._id)) {
      Swal.fire({
        title: 'Aviso',
        text: 'Este Item ya está agregado a la prueba.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return;
    }

    const items = this.obtenerItemsGrupo(grupoIndex);

    items.push(
      this.crearItemGrupoResultado({
        ...item,
        ordenItem: items.length + 1,
        mostrarItem: true,
        procesamientoOverride: null,
      }),
    );

    this.gruposResultado.at(grupoIndex).get('busquedaItem')?.setValue('', {
      emitEvent: false,
    });

    this.actualizarItemsDisponiblesRequerimiento();
  }

  eliminarItemDeGrupo(grupoIndex: number, itemIndex: number): void {
    const items = this.obtenerItemsGrupo(grupoIndex);
    const itemId = items.at(itemIndex).get('itemLabId')?.value;

    if (itemId) {
      this.limpiarItemDeRequerimientos(String(itemId));
    }

    items.removeAt(itemIndex);
    this.reordenarItemsGrupo(grupoIndex);
    this.actualizarItemsDisponiblesRequerimiento();
  }

  private reordenarItemsGrupo(grupoIndex: number): void {
    const items = this.obtenerItemsGrupo(grupoIndex);
    items.controls.forEach((item, index) => {
      item.get('ordenItem')?.setValue(index + 1, {
        emitEvent: false,
      });
    });
  }

  agregarGrupoResultado(): void {
    const nuevoGrupo = this.crearGrupoResultado({
      nombreGrupo: '',
      ordenGrupo: this.gruposResultado.length + 1,
      mostrarTitulo: true,
    });
    this.gruposResultado.push(nuevoGrupo);
  }

  eliminarGrupoResultado(index: number): void {
    const grupo = this.gruposResultado.at(index) as FormGroup;
    const items = grupo.get('items') as FormArray;

    items.controls.forEach((itemControl) => {
      const itemId = itemControl.get('itemLabId')?.value;

      if (itemId) {
        this.limpiarItemDeRequerimientos(String(itemId));
      }
    });

    this.gruposResultado.removeAt(index);
    this.reordenarGruposResultado();
    this.actualizarItemsDisponiblesRequerimiento();
  }

  private reordenarGruposResultado(): void {
    this.gruposResultado.controls.forEach((grupo, index) => {
      grupo.get('ordenGrupo')?.setValue(index + 1, {
        emitEvent: false,
      });
    });
  }

  // Array para mantener todas las pruebas en memoria
  private todasLasPruebasMemoria: IPruebaLab[] = [];

  ultimasPruebas(): void {
    this._pruebaLabService.getLastPruebasLab().subscribe((pruebas) => {
      this.todasLasPruebasMemoria = pruebas; // Guardar todas las pruebas en memoria
      this.dataSourcePruebas.data = pruebas;
    });
  }

  // Array para mantener todos los datos iniciales en memoria
  private todosLosItems: IItemLab[] = [];

  // Método últimos 20* pacientes
  ultimosItems(): void {
    this._itemLabService.getLastItemsLab().subscribe({
      next: (items: IItemLab[]) => {
        this.todosLosItems = items;
      },

      error: (err) => {
        console.error('Error al obtener los Items:', err);

        this.todosLosItems = [];
      },
    });
  }

  terminoBusqueda = new FormControl('');

  buscarPrueba() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todas las pruebas iniciales
      this.dataSourcePruebas.data = this.todasLasPruebasMemoria;
      this.dataSourcePruebas.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourcePruebas.data = this.todasLasPruebasMemoria; // Asegurar que tiene todos los datos
      this.dataSourcePruebas.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourcePruebas.paginator) {
      this.dataSourcePruebas.paginator.firstPage();
    }
  }

  // ====== Cargar tipos de muestra ======

  private cargarTiposMuestraActivos(): void {
    this._tipoMuestraService.getTiposMuestraActivos().subscribe({
      next: (tiposMuestra) => {
        this.tiposMuestraActivos = tiposMuestra;

        console.log('Tipos de muestra activos:', this.tiposMuestraActivos);
      },

      error: (error) => {
        console.error('Error al cargar tipos de muestra:', error);
      },
    });
  }

  // ====== Cargar tubos / envases ======

  private cargarTubosEnvasesActivos(): void {
    this._tuboEnvaseService.getTubosEnvasesActivos().subscribe({
      next: (tubosEnvases) => {
        this.tubosEnvasesActivos = tubosEnvases;

        console.log('Tubos / envases activos:', this.tubosEnvasesActivos);
      },

      error: (error) => {
        console.error('Error al cargar tubos / envases:', error);
      },
    });
  }

  private construirProcesamientoDefault(): IProcesamientoLab {
    const procesamiento = this.procesamientoDefault.getRawValue();

    return {
      tipo: procesamiento.tipo ?? 'INTERNO',
      laboratorioReferenciaId:
        procesamiento.tipo === 'REFERENCIA'
          ? (procesamiento.laboratorioReferenciaId ?? null)
          : null,
      observacion: procesamiento.observacion?.trim() ?? '',
    };
  }

  // ====== Items disponibles para requerimientos ======

  public itemsDisponiblesRequerimiento: {
    _id: string;
    codItemLab: string;
    nombreInforme: string;
    contextoAnalitico: string;
  }[] = [];

  private actualizarItemsDisponiblesRequerimiento(): void {
    const itemsDisponibles: {
      _id: string;
      codItemLab: string;
      nombreInforme: string;
      contextoAnalitico: string;
    }[] = [];

    this.gruposResultado.controls.forEach((grupoControl) => {
      const items = grupoControl.get('items') as FormArray;

      items.controls.forEach((itemControl) => {
        const itemId = itemControl.get('itemLabId')?.value;

        if (!itemId) {
          return;
        }

        const id = String(itemId);

        const yaExiste = itemsDisponibles.some((item) => item._id === id);

        if (yaExiste) {
          return;
        }

        itemsDisponibles.push({
          _id: id,
          codItemLab: itemControl.get('codItemLab')?.value ?? '',
          nombreInforme: itemControl.get('nombreInforme')?.value ?? '',
          contextoAnalitico: itemControl.get('contextoAnalitico')?.value ?? '',
        });
      });
    });

    this.itemsDisponiblesRequerimiento = itemsDisponibles;
  }

  // ====== Cambio de alcance ======

  public cambiarAlcanceRequerimiento(requerimientoIndex: number): void {
    const requerimiento = this.requerimientosMuestra.at(requerimientoIndex);
    const alcance = requerimiento.get('alcance')?.value;

    if (alcance !== 'ITEMS_ESPECIFICOS') {
      requerimiento.get('itemsAsociados')?.setValue([]);
    }
  }

  // ====== Limpiar asociaciones de Item ======

  private limpiarItemDeRequerimientos(itemId: string): void {
    this.requerimientosMuestra.controls.forEach((requerimientoControl) => {
      const control = requerimientoControl.get('itemsAsociados');

      const seleccionados: string[] = control?.value ?? [];

      const nuevosSeleccionados = seleccionados.filter(
        (id) => String(id) !== String(itemId),
      );

      if (nuevosSeleccionados.length !== seleccionados.length) {
        control?.setValue(nuevosSeleccionados);
      }
    });
  }

  nuevaPrueba(): void {
    this.formSubmitted = false;
    this.filaSeleccionadaIndex = null;
    this.gruposResultado.clear();
    this.requerimientosMuestra.clear();
    this.itemsDisponiblesRequerimiento = [];

    this.myFormPruebaLab.reset({
      codPruebaLab: '',
      areaLab: '',
      nombrePruebaLab: '',
      condPreAnalitPaciente: '',
      condPreAnalitRefer: '',
      tiempoRespuesta: '',
      observPruebas: '',
      estadoPrueba: true,
      requiereMuestra: true,
      procesamientoDefault: {
        tipo: 'INTERNO',
        laboratorioReferenciaId: null,
        observacion: '',
      },
    });

    this.myFormPruebaLab.get('nombrePruebaLab')?.enable();
    this.myFormPruebaLab.get('areaLab')?.enable();
    this.terminoBusqueda.setValue('');
    this.buscarPrueba();
  }

  formSubmitted = false;

  // ====== Procesamiento override ======

  private construirProcesamientoOverride(
    control: FormGroup,
  ): IProcesamientoLab | null {
    const usarOverride =
      control.get('usarProcesamientoOverride')?.value === true;

    if (!usarOverride) {
      return null;
    }

    const procesamiento = (
      control.get('procesamientoOverride') as FormGroup
    ).getRawValue();

    return {
      tipo: procesamiento.tipo ?? 'INTERNO',
      laboratorioReferenciaId:
        procesamiento.tipo === 'REFERENCIA'
          ? (procesamiento.laboratorioReferenciaId ?? null)
          : null,

      observacion: procesamiento.observacion?.trim() ?? '',
    };
  }

  // ====== Construcción de grupos ======

  private construirGruposResultado() {
    return this.gruposResultado.controls.map((grupoControl, grupoIndex) => {
      const grupo = grupoControl as FormGroup;
      const items = grupo.get('items') as FormArray;

      return {
        nombreGrupo: grupo.get('nombreGrupo')?.value?.trim() ?? '',
        ordenGrupo: Number(grupo.get('ordenGrupo')?.value ?? grupoIndex + 1),
        mostrarTitulo: grupo.get('mostrarTitulo')?.value ?? true,
        procesamientoOverride: this.construirProcesamientoOverride(grupo),
        items: items.controls.map((itemControl, itemIndex) => {
          const item = itemControl as FormGroup;
          return {
            itemLabId: item.get('itemLabId')?.value,
            ordenItem: Number(item.get('ordenItem')?.value ?? itemIndex + 1),
            mostrarItem: item.get('mostrarItem')?.value ?? true,
            procesamientoOverride: this.construirProcesamientoOverride(item),
          };
        }),
      };
    });
  }

  // ====== Construcción de requerimientos de muestra ======

  private construirRequerimientosMuestra(): IRequerimientoMuestra[] {
    return this.requerimientosMuestra.controls.map((control) => {
      const requerimiento = control as FormGroup;
      const alcance = requerimiento.get('alcance')
        ?.value as AlcanceRequerimientoMuestra;
      const opciones = requerimiento.get('opciones') as FormArray;
      const volumenMinimo = requerimiento.get('volumenMinimo')?.value;

      return {
        descripcion: requerimiento.get('descripcion')?.value?.trim() ?? '',
        alcance,
        opciones: opciones.controls.map((opcionControl) => {
          const opcion = opcionControl as FormGroup;

          return {
            tipoMuestraId: opcion.get('tipoMuestraId')?.value,
            tuboEnvaseId: opcion.get('tuboEnvaseId')?.value,
          };
        }),

        itemsAsociados:
          alcance === 'ITEMS_ESPECIFICOS'
            ? (requerimiento.get('itemsAsociados')?.value ?? [])
            : [],
        cantidadRecipientes: Number(
          requerimiento.get('cantidadRecipientes')?.value ?? 1,
        ),

        volumenMinimo:
          volumenMinimo === null ||
          volumenMinimo === undefined ||
          volumenMinimo === ''
            ? null
            : Number(volumenMinimo),

        unidadVolumen:
          volumenMinimo === null ||
          volumenMinimo === undefined ||
          volumenMinimo === ''
            ? null
            : (requerimiento.get('unidadVolumen')?.value ?? null),

        permiteCompartirMuestra:
          requerimiento.get('permiteCompartirMuestra')?.value ?? true,

        observacion: requerimiento.get('observacion')?.value?.trim() ?? '',
      };
    });
  }

  // ====== Validar configuración de muestras ======

  private validarConfiguracionMuestras(): boolean {
    const requiereMuestra =
      this.myFormPruebaLab.get('requiereMuestra')?.value === true;

    if (!requiereMuestra) {
      return true;
    }

    if (this.requerimientosMuestra.length === 0) {
      Swal.fire({
        title: 'Requerimiento de muestra',
        text: 'Debe configurar al menos un requerimiento de muestra.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return false;
    }

    for (let i = 0; i < this.requerimientosMuestra.length; i++) {
      const requerimiento = this.requerimientosMuestra.at(i) as FormGroup;
      const alcance = requerimiento.get('alcance')?.value;
      const itemsAsociados: string[] =
        requerimiento.get('itemsAsociados')?.value ?? [];

      // ====== Items específicos ======

      if (alcance === 'ITEMS_ESPECIFICOS' && itemsAsociados.length === 0) {
        Swal.fire({
          title: 'Requerimiento incompleto',
          text: `Seleccione al menos un Item en el requerimiento ${i + 1}.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }

      // ====== Volumen ======

      const volumenMinimo = requerimiento.get('volumenMinimo')?.value;
      const unidadVolumen = requerimiento.get('unidadVolumen')?.value;
      const tieneVolumen =
        volumenMinimo !== null &&
        volumenMinimo !== undefined &&
        volumenMinimo !== '';

      if (tieneVolumen && !unidadVolumen) {
        Swal.fire({
          title: 'Unidad requerida',
          text: `Seleccione la unidad del volumen mínimo en el requerimiento ${i + 1}.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }
    }

    return true;
  }

  // ====== Construcción del body ======

  private construirBody(): IPruebaLab {
    const formValue = this.myFormPruebaLab.getRawValue();

    // ====== Estado ======

    const estadoPrueba: EstadoPruebaLab = formValue.estadoPrueba
      ? 'ACTIVO'
      : 'INACTIVO';

    return {
      codPruebaLab: formValue.codPruebaLab || undefined,
      areaLab: formValue.areaLab,
      nombrePruebaLab: formValue.nombrePruebaLab,
      condPreAnalitPaciente: formValue.condPreAnalitPaciente,
      condPreAnalitRefer: formValue.condPreAnalitRefer,
      tiempoRespuesta: formValue.tiempoRespuesta,
      observPruebas: formValue.observPruebas ?? '',
      estadoPrueba,

      // ====== Procesamiento ======

      procesamientoDefault: this.construirProcesamientoDefault(),

      // ====== Composición nueva ======

      gruposResultado: this.construirGruposResultado(),

      // ====== Muestras ======

      requiereMuestra: formValue.requiereMuestra ?? true,

      requerimientosMuestra: formValue.requiereMuestra
        ? this.construirRequerimientosMuestra()
        : [],
    };
  }

  registraPrueba(): void {
    this.formSubmitted = true;

    if (this.myFormPruebaLab.invalid) {
      this.myFormPruebaLab.markAllAsTouched();
      return;
    }

    if (!this.validarConfiguracionMuestras()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de esta prueba?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();
      console.log('BODY PRUEBA:', body);

      this._pruebaLabService.registrarPruebaLab(body).subscribe({
        next: () => {
          Swal.fire({
            title: 'Confirmado',
            text: 'Prueba Registrada',
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.ultimasPruebas();
          this.nuevaPrueba();
        },

        error: (err) => {
          console.error('Error al registrar prueba:', err);

          Swal.fire({
            title: 'ERROR!',
            text: err.error?.msg || 'Error al registrar la prueba',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
    });
  }

  actualizarPrueba(): void {
    this.formSubmitted = true;

    if (this.myFormPruebaLab.invalid) {
      this.myFormPruebaLab.markAllAsTouched();
      return;
    }

    if (!this.validarConfiguracionMuestras()) {
      return;
    }

    const codPruebaLab = this.myFormPruebaLab.get('codPruebaLab')?.value;

    if (!codPruebaLab) {
      Swal.fire({
        title: 'Error',
        text: 'No se encontró el código de la prueba.',
        icon: 'error',
        confirmButtonText: 'Ok',
      });

      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de esta prueba?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();

      console.log('BODY ACTUALIZACIÓN PRUEBA:', body);

      this._pruebaLabService.actualizarPruebaLab(codPruebaLab, body).subscribe({
        next: () => {
          Swal.fire({
            title: 'Confirmado',
            text: 'Prueba Actualizada',
            icon: 'success',
            confirmButtonText: 'Ok',
          });
          this.ultimasPruebas();
          this.nuevaPrueba();
        },

        error: (err) => {
          console.error('Error al actualizar prueba:', err);

          Swal.fire({
            title: 'ERROR!',
            text: err.error?.msg || 'Error al actualizar la prueba',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
    });
  }

  filaSeleccionadaIndex: number | null = null;

  cargarPruebas(prueba: IPruebaLab, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.myFormPruebaLab.get('nombrePruebaLab')?.disable();
    this.myFormPruebaLab.get('areaLab')?.disable();

    // ====== Datos principales ======

    this.myFormPruebaLab.patchValue({
      codPruebaLab: prueba.codPruebaLab ?? '',
      areaLab: prueba.areaLab,
      nombrePruebaLab: prueba.nombrePruebaLab,
      condPreAnalitPaciente: prueba.condPreAnalitPaciente,
      condPreAnalitRefer: prueba.condPreAnalitRefer,
      tiempoRespuesta: prueba.tiempoRespuesta,
      observPruebas: prueba.observPruebas ?? '',
      estadoPrueba: prueba.estadoPrueba === 'ACTIVO',

      procesamientoDefault: {
        tipo: prueba.procesamientoDefault?.tipo ?? 'INTERNO',
        laboratorioReferenciaId:
          prueba.procesamientoDefault?.laboratorioReferenciaId ?? null,
        observacion: prueba.procesamientoDefault?.observacion ?? '',
      },
    });

    // ====== Grupos de resultado ======

    this.gruposResultado.clear();

    (prueba.gruposResultado ?? []).forEach((grupo) => {
      this.gruposResultado.push(this.crearGrupoResultado(grupo));
    });

    this.actualizarItemsDisponiblesRequerimiento();

    // ====== Requerimientos de muestra ======

    this.myFormPruebaLab
      .get('requiereMuestra')
      ?.setValue(prueba.requiereMuestra ?? true);

    this.requerimientosMuestra.clear();

    (prueba.requerimientosMuestra ?? []).forEach((requerimiento) => {
      this.requerimientosMuestra.push(
        this.crearRequerimientoMuestra(requerimiento),
      );
    });
  }
}
