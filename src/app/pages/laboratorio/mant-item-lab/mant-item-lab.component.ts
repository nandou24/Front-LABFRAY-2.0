// import { CommonModule } from '@angular/common';
// import { Component, inject, OnInit, ViewChild } from '@angular/core';
// import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
// import {
//   FormArray,
//   FormBuilder,
//   FormControl,
//   FormGroup,
//   FormsModule,
//   ReactiveFormsModule,
//   Validators,
// } from '@angular/forms';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatOptionModule } from '@angular/material/core';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import {
//   MatTable,
//   MatTableDataSource,
//   MatTableModule,
// } from '@angular/material/table';
// import { IItemLab } from '../../../models/Mantenimiento/items.models';
// import Swal from 'sweetalert2';
// import { ItemLabService } from '../../../services/mantenimiento/itemLab/item-lab.service';
// import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { MatSidenavModule } from '@angular/material/sidenav';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { PruebaLabService } from '../../../services/mantenimiento/pruebaLab/prueba-lab.service';

// @Component({
//   selector: 'app-mant-item-lab',
//   imports: [
//     MatFormFieldModule,
//     MatInputModule,
//     FormsModule,
//     MatCardModule,
//     MatSelectModule,
//     MatOptionModule,
//     ReactiveFormsModule,
//     MatButtonModule,
//     MatPaginatorModule,
//     MatSlideToggleModule,
//     MatSidenavModule,
//     MatIconModule,
//     MatTableModule,
//     MatTooltipModule,
//     CommonModule,
//   ],
//   templateUrl: './mant-item-lab.component.html',
//   styleUrl: './mant-item-lab.component.scss',
// })
// export class MantItemLabComponent implements OnInit {
//   constructor() {}

//   ngOnInit(): void {
//     this.ultimosItems(),
//       this.limpiarValidacion(),
//       this.listarPruebas(),
//       // Detectar si es móvil
//       this.breakpointObserver
//         .observe([Breakpoints.Handset])
//         .subscribe((result) => {
//           this.isMobile = result.matches;
//           if (this.isMobile) {
//             this.opened = false; // Cerrar el sidenav en móvil por defecto
//           }
//         });
//   }

//   private _fb = inject(FormBuilder);
//   private _itemLabService = inject(ItemLabService);
//   private _pruebaService = inject(PruebaLabService);

//   // Getter para el modo del sidenav
//   get sidenavMode(): 'side' | 'over' {
//     return this.isMobile ? 'over' : 'side';
//   }

//   public myFormItemLab: FormGroup = this._fb.group({
//     _id: [null],
//     codItemLab: '',
//     nombreInforme: ['', [Validators.required]],
//     nombreHojaTrabajo: ['', [Validators.required]],
//     metodoItemLab: ['', [Validators.required]],
//     valoresHojaTrabajo: ['', [Validators.required]],
//     valoresInforme: ['', [Validators.required]],
//     unidadesRef: ['', [Validators.required]],
//     perteneceAPrueba: [null, [Validators.required]],
//     ordenImpresion: [null, [Validators.required]],
//     grupoItemLab: [''],
//     poseeValidacion: [false],
//     paramValidacion: this._fb.array([]),
//   });

//   get paramValidacion(): FormArray {
//     return this.myFormItemLab.get('paramValidacion') as FormArray;
//   }

//   agregarValidacion() {
//     const validacionItem = this._fb.group({
//       descrValidacion: ['', [Validators.required]],
//       sexo: ['', [Validators.required]],
//       edadIndistinta: [true],
//       edadMin: [{ value: '', disabled: true }],
//       edadMax: [{ value: '', disabled: true }],
//       descRegla: ['', [Validators.required]],
//       valor1: [{ value: '', disabled: true }],
//       valor2: [{ value: '', disabled: true }],
//     });

//     this.configurarHandlers(validacionItem);

//     this.paramValidacion.push(validacionItem);

//     this.escucharCambioEdadIndistinta(this.paramValidacion.length - 1); // 👈 Aquí llamas después de agregar
//     this.escucharCambioRegla(this.paramValidacion.length - 1);
//   }

//   eliminarValidacion(index: number) {
//     this.paramValidacion.removeAt(index);
//   }

//   private configurarHandlers(validacionItem: FormGroup) {
//     // Handler para edadIndistinta
//     validacionItem.get('edadIndistinta')?.valueChanges.subscribe((valor) => {
//       if (valor) {
//         validacionItem.get('edadMin')?.disable();
//         validacionItem.get('edadMax')?.disable();
//         validacionItem.get('edadMin')?.reset();
//         validacionItem.get('edadMax')?.reset();
//       } else {
//         validacionItem.get('edadMin')?.enable();
//         validacionItem.get('edadMax')?.enable();
//       }
//     });

//     // Handler para descRegla
//     validacionItem.get('descRegla')?.valueChanges.subscribe((valor) => {
//       validacionItem.get('valor1')?.reset();
//       validacionItem.get('valor2')?.reset();
//       if (valor === 'Entre') {
//         validacionItem.get('valor1')?.enable();
//         validacionItem.get('valor2')?.enable();
//       } else {
//         validacionItem.get('valor1')?.enable();
//         validacionItem.get('valor2')?.disable();
//       }
//     });
//   }

//   private escucharCambioEdadIndistinta(index: number): void {
//     const grupoValidacion = this.paramValidacion.at(index) as FormGroup;

//     grupoValidacion
//       .get('edadIndistinta')
//       ?.valueChanges.subscribe((sinEdad: boolean) => {
//         const edadMinControl = grupoValidacion.get('edadMin');
//         const edadMaxControl = grupoValidacion.get('edadMax');

//         if (!sinEdad) {
//           edadMinControl?.setValidators([Validators.required]);
//           edadMaxControl?.setValidators([Validators.required]);
//         } else {
//           edadMinControl?.clearValidators();
//           edadMaxControl?.clearValidators();
//         }

//         edadMinControl?.updateValueAndValidity();
//         edadMaxControl?.updateValueAndValidity();
//       });
//   }

//   private escucharCambioRegla(index: number): void {
//     const grupoValidacion = this.paramValidacion.at(index) as FormGroup;

//     grupoValidacion
//       .get('descRegla')
//       ?.valueChanges.subscribe((regla: string) => {
//         const valorMinControl = grupoValidacion.get('valor1');
//         const valorMaxControl = grupoValidacion.get('valor2');

//         if (regla == 'Entre') {
//           valorMinControl?.setValidators([Validators.required]);
//           valorMaxControl?.setValidators([Validators.required]);
//         } else {
//           valorMinControl?.setValidators([Validators.required]);
//         }

//         valorMinControl?.updateValueAndValidity();
//         valorMaxControl?.updateValueAndValidity();
//       });
//   }

//   //setear los anchos
//   setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
//     return `0 0 ${valor}${unidad}`;
//   }

//   @ViewChild(MatTable) table!: MatTable<any>;
//   @ViewChild('MatPaginatorItems') paginatorItems!: MatPaginator;
//   ngAfterViewInit() {
//     this.dataSourceItems.paginator = this.paginatorItems;
//     // Configurar el filtro personalizado para buscar en propiedades anidadas
//     this.dataSourceItems.filterPredicate = (data: IItemLab, filter: string) => {
//       const searchStr = filter.toLowerCase();

//       // Buscar en propiedades simples
//       const simpleFields = [
//         data.codItemLab?.toLowerCase() || '',
//         data.nombreInforme?.toLowerCase() || '',
//         data.nombreHojaTrabajo?.toLowerCase() || '',
//         data.grupoItemLab?.toLowerCase() || '',
//       ];

//       // Buscar en propiedades anidadas de perteneceAPrueba
//       const pruebaFields = [
//         data.perteneceAPrueba?.nombrePruebaLab?.toLowerCase() || '',
//       ];

//       // Combinar todos los campos
//       const allFields = [...simpleFields, ...pruebaFields];

//       // Verificar si algún campo contiene el término de búsqueda
//       return allFields.some((field) => field.includes(searchStr));
//     };
//   }
//   //Tabla pacientes
//   columnasTablaPaciente: string[] = [
//     'Codigo',
//     'NombreItem',
//     'PerteneceAPrueba',
//     'grupoItemLab',
//     'ordenImpresion',
//     'accion',
//   ];
//   dataSourceItems = new MatTableDataSource<IItemLab>();

//   // Array para mantener todos los datos iniciales en memoria
//   private todosLosItems: IItemLab[] = [];

//   ultimosItems(): void {
//     this._itemLabService.getLastItemsLab().subscribe((items) => {
//       this.todosLosItems = items; // Guardar todos los datos iniciales
//       this.dataSourceItems.data = items;
//       console.log('Items obtenidos:', items);
//     });
//   }

//   pruebas: any[] = [];
//   listarPruebas() {
//     this._pruebaService.getLastPruebasLab().subscribe({
//       next: (pruebas) => {
//         this.pruebas = pruebas;
//       },
//       error: () => {
//         this.pruebas = [];
//       },
//     });
//   }

//   terminoBusqueda = new FormControl('');
//   timeoutBusqueda: any;

//   buscarItems() {
//     const termino = this.terminoBusqueda?.value?.trim() ?? '';

//     // Asegurar que el dataSource tenga todos los datos
//     this.dataSourceItems.data = this.todosLosItems;

//     // Aplicar el filtro (el filterPredicate personalizado se encargará de la búsqueda)
//     this.dataSourceItems.filter = termino.toLowerCase();

//     // Si hay un paginador, ir a la primera página cuando se filtra
//     if (this.dataSourceItems.paginator) {
//       this.dataSourceItems.paginator.firstPage();
//     }
//   }

//   filaSeleccionadaIndex: number | null = null;

//   //Carga los datos en los campos
//   cargarItemLab(item: IItemLab, index: number): void {
//     this.filaSeleccionadaIndex = index;
//     this.myFormItemLab.reset(); // Reinicia el formulario antes de cargar los datos
//     this.myFormItemLab.patchValue(item);
//     this.myFormItemLab
//       .get('perteneceAPrueba')
//       ?.setValue(item.perteneceAPrueba._id.toString());

//     this.paramValidacion.clear();

//     // Agregar cada validación al FormArray
//     item.paramValidacion.forEach((validacion: any) => {
//       this.paramValidacion.push(this.crearValidacionGroup(validacion));
//     });
//   }

//   private crearValidacionGroup(paramValidacion: any): FormGroup {
//     return this._fb.group({
//       descrValidacion: [paramValidacion.descrValidacion],
//       sexo: [paramValidacion.sexo],
//       edadIndistinta: [paramValidacion.edadIndistinta],
//       edadMin: [paramValidacion.edadMin],
//       edadMax: [paramValidacion.edadMax],
//       descRegla: [paramValidacion.descRegla],
//       valor1: [paramValidacion.valor1],
//       valor2: [paramValidacion.valor2],
//     });
//   }

//   limpiarValidacion() {
//     // Ahora escuchamos cambios en "poseeValidacion"
//     this.myFormItemLab
//       .get('poseeValidacion')
//       ?.valueChanges.subscribe((valor: boolean) => {
//         if (!valor) {
//           // Si desactiva el switch, vaciamos las validaciones
//           const formArray = this.myFormItemLab.get('paramValidacion');
//           if (formArray && formArray instanceof FormArray) {
//             formArray.clear();
//           }
//         }
//       });
//   }

//   validarArrayValores(): boolean {
//     const poseeVal = this.myFormItemLab.get('poseeValidacion')?.value;
//     const valoresArray = this.myFormItemLab.get('paramValidacion') as FormArray;

//     if (poseeVal === true) {
//       if (valoresArray.length === 0) {
//         return false;
//       }
//     }

//     return true;
//   }

//   public formSubmitted: boolean = false;

//   registraItemLab() {
//     if (this.myFormItemLab.invalid) {
//       this.myFormItemLab.markAllAsTouched();
//       return;
//     }

//     this.formSubmitted = true;

//     if (this.myFormItemLab.valid && this.validarArrayValores()) {
//       Swal.fire({
//         title: '¿Estás seguro?',
//         text: '¿Deseas confirmar la creación de este item?',
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, confirmar',
//         cancelButtonText: 'Cancelar',
//       }).then((result) => {
//         if (result.isConfirmed) {
//           console.log('Procede registro');
//           const formValue = this.myFormItemLab.value;

//           const body: IItemLab = {
//             ...formValue,
//           };
//           console.log('capturando valores en component.ts');

//           this._itemLabService.registrarItemLab(body).subscribe({
//             next: () => {
//               Swal.fire({
//                 title: 'Confirmado',
//                 text: 'Item Registrado',
//                 icon: 'success',
//                 confirmButtonText: 'Ok',
//               });
//               this.ultimosItems();
//               this.nuevoItem();
//             },
//             error: (err) => {
//               const mensaje =
//                 err?.error?.msg ||
//                 err.message ||
//                 'No se pudo registrar el item. Intenta nuevamente.';

//               Swal.fire({
//                 title: 'Error',
//                 text: mensaje,
//                 icon: 'error',
//                 confirmButtonText: 'Ok',
//               });
//             },
//           });
//         }
//       });
//     } else {
//       console.log('No Procede');
//     }
//   }

//   actualizarItem() {
//     if (this.myFormItemLab.invalid) {
//       this.myFormItemLab.markAllAsTouched();
//       return;
//     }

//     this.formSubmitted = true;

//     if (this.myFormItemLab.valid && this.validarArrayValores()) {
//       Swal.fire({
//         title: '¿Estás seguro?',
//         text: '¿Deseas confirmar la actualización de este item?',
//         icon: 'question',
//         showCancelButton: true,
//         confirmButtonText: 'Sí, confirmar',
//         cancelButtonText: 'Cancelar',
//       }).then((result) => {
//         if (result.isConfirmed) {
//           const body: IItemLab = this.myFormItemLab.value; //capturando los valores del component.ts

//           this._itemLabService.actualizarItem(body.codItemLab, body).subscribe({
//             next: () => {
//               Swal.fire({
//                 title: 'Confirmado',
//                 text: 'Item Actualizado',
//                 icon: 'success',
//                 confirmButtonText: 'Ok',
//               });
//               this.ultimosItems();
//               this.nuevoItem();
//             },
//             error: (err) => {
//               const mensaje =
//                 err?.error?.msg ||
//                 err.message ||
//                 'No se pudo actualizar el item. Intenta nuevamente.';

//               Swal.fire({
//                 title: 'Error',
//                 text: mensaje,
//                 icon: 'error',
//                 confirmButtonText: 'Ok',
//               });
//             },
//           });
//         }
//       });
//     } else {
//       console.log('No Procede Actualización');
//     }
//   }

//   nuevoItem() {
//     this.myFormItemLab.reset(); // Reinicia todos los campos del formulario
//     this.formSubmitted = true;
//     this.paramValidacion.clear();
//     this.filaSeleccionadaIndex = null; // Reinicia el índice de la fila seleccionada
//     this.myFormItemLab.patchValue({
//       poseeValidacion: false,
//     });
//   }

//   // public mostrarTabla: boolean = false;
//   opened: boolean = false;
//   isMobile: boolean = false;

//   private breakpointObserver = inject(BreakpointObserver);

//   editarItemLab(item: IItemLab, index: number) {
//     this.filaSeleccionadaIndex = index;
//     this.myFormItemLab.reset(); // Reinicia el formulario antes de cargar los datos
//     this.myFormItemLab.patchValue(item);
//     this.paramValidacion.clear();

//     // Agregar cada validación al FormArray
//     item.paramValidacion.forEach((validacion: any) => {
//       this.paramValidacion.push(this.crearValidacionGroup(validacion));
//     });
//   }

//   eliminarItemLab(item: IItemLab) {
//     Swal.fire({
//       title: '¿Estás seguro?',
//       text: `¿Deseas eliminar el item ${item.nombreInforme}?`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonText: 'Sí, eliminar',
//       cancelButtonText: 'Cancelar',
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this._itemLabService.eliminarItemLab(item._id).subscribe({
//           next: () => {
//             Swal.fire({
//               title: 'Confirmado',
//               text: 'Item Eliminado',
//               icon: 'success',
//               confirmButtonText: 'Ok',
//             });
//             this.ultimosItems();
//           },
//           error: (err) => {
//             const mensaje =
//               err?.error?.msg ||
//               err.message ||
//               'No se pudo eliminar el item. Intenta nuevamente.';

//             Swal.fire({
//               title: 'Error',
//               text: mensaje,
//               icon: 'error',
//               confirmButtonText: 'Ok',
//             });
//           },
//         });
//       }
//     });
//   }
// }

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

    /*
     * En pantalla trabajamos con boolean.
     * Al enviar convertiremos:
     *
     * true  -> ACTIVO
     * false -> INACTIVO
     */
    referenciasResultado: this._fb.array([]),
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
    const referencia = this._fb.group({
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
    });

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
    'PerteneceAPrueba',
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
      estado: (item.estadoItem ?? 'ACTIVO') === 'ACTIVO',
    });

    (item.referenciasResultado ?? []).forEach((referencia) => {
      const grupo = this.crearReferenciaGroup(referencia);

      this.referenciasResultado.push(grupo);
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

    const grupo = this._fb.group({
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
    });

    this.configurarReferencia(grupo);

    return grupo;
  }

  // private crearValidacionGroup(paramValidacion: any): FormGroup {
  //   const grupo = this._fb.group({
  //     descrValidacion: [paramValidacion?.descrValidacion ?? ''],
  //     sexo: [paramValidacion?.sexo ?? ''],
  //     edadIndistinta: [paramValidacion?.edadIndistinta ?? true],
  //     edadMin: [paramValidacion?.edadMin ?? ''],
  //     edadMax: [paramValidacion?.edadMax ?? ''],
  //     descRegla: [paramValidacion?.descRegla ?? ''],
  //     valor1: [paramValidacion?.valor1 ?? ''],
  //     valor2: [paramValidacion?.valor2 ?? ''],
  //   });

  //   this.configurarHandlers(grupo);

  //   return grupo;
  // }

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
      unidadesRef: formValue.unidadesRef,

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
      referenciasResultado: this.construirReferenciasResultado(),
      reglasAlerta: this.itemSeleccionado?.reglasAlerta ?? [],
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
