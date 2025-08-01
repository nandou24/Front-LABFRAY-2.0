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
import { IItemLab } from '../../../models/Mantenimiento/items.models';
import Swal from 'sweetalert2';
import { ItemLabService } from '../../../services/mantenimiento/itemLab/item-lab.service';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PruebaLabService } from '../../../services/mantenimiento/pruebaLab/prueba-lab.service';

@Component({
  selector: 'app-mant-item-lab',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    CommonModule,
  ],
  templateUrl: './mant-item-lab.component.html',
  styleUrl: './mant-item-lab.component.scss',
})
export class MantItemLabComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    this.ultimosItems(),
      this.limpiarValidacion(),
      this.listarPruebas(),
      // Detectar si es móvil
      this.breakpointObserver
        .observe([Breakpoints.Handset])
        .subscribe((result) => {
          this.isMobile = result.matches;
          if (this.isMobile) {
            this.opened = false; // Cerrar el sidenav en móvil por defecto
          }
        });
  }

  private _fb = inject(FormBuilder);
  private _itemLabService = inject(ItemLabService);
  private _pruebaService = inject(PruebaLabService);

  // Getter para el modo del sidenav
  get sidenavMode(): 'side' | 'over' {
    return this.isMobile ? 'over' : 'side';
  }

  public myFormItemLab: FormGroup = this._fb.group({
    _id: [null],
    codItemLab: '',
    nombreInforme: ['', [Validators.required]],
    nombreHojaTrabajo: ['', [Validators.required]],
    metodoItemLab: ['', [Validators.required]],
    valoresHojaTrabajo: ['', [Validators.required]],
    valoresInforme: ['', [Validators.required]],
    unidadesRef: ['', [Validators.required]],
    perteneceAPrueba: [null, [Validators.required]],
    ordenImpresion: [null, [Validators.required]],
    grupoItemLab: [''],
    poseeValidacion: [false],
    paramValidacion: this._fb.array([]),
  });

  get paramValidacion(): FormArray {
    return this.myFormItemLab.get('paramValidacion') as FormArray;
  }

  agregarValidacion() {
    const validacionItem = this._fb.group({
      descrValidacion: ['', [Validators.required]],
      sexo: ['', [Validators.required]],
      edadIndistinta: [true],
      edadMin: [{ value: '', disabled: true }],
      edadMax: [{ value: '', disabled: true }],
      descRegla: ['', [Validators.required]],
      valor1: [{ value: '', disabled: true }],
      valor2: [{ value: '', disabled: true }],
    });

    this.configurarHandlers(validacionItem);

    this.paramValidacion.push(validacionItem);

    this.escucharCambioEdadIndistinta(this.paramValidacion.length - 1); // 👈 Aquí llamas después de agregar
    this.escucharCambioRegla(this.paramValidacion.length - 1);
  }

  eliminarValidacion(index: number) {
    this.paramValidacion.removeAt(index);
  }

  private configurarHandlers(validacionItem: FormGroup) {
    // Handler para edadIndistinta
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

    // Handler para descRegla
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

        if (regla == 'Entre') {
          valorMinControl?.setValidators([Validators.required]);
          valorMaxControl?.setValidators([Validators.required]);
        } else {
          valorMinControl?.setValidators([Validators.required]);
        }

        valorMinControl?.updateValueAndValidity();
        valorMaxControl?.updateValueAndValidity();
      });
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorItems') paginatorItems!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourceItems.paginator = this.paginatorItems;
    // Configurar el filtro personalizado para buscar en propiedades anidadas
    this.dataSourceItems.filterPredicate = (data: IItemLab, filter: string) => {
      const searchStr = filter.toLowerCase();

      // Buscar en propiedades simples
      const simpleFields = [
        data.codItemLab?.toLowerCase() || '',
        data.nombreInforme?.toLowerCase() || '',
        data.nombreHojaTrabajo?.toLowerCase() || '',
        data.grupoItemLab?.toLowerCase() || '',
      ];

      // Buscar en propiedades anidadas de perteneceAPrueba
      const pruebaFields = [
        data.perteneceAPrueba?.nombrePruebaLab?.toLowerCase() || '',
      ];

      // Combinar todos los campos
      const allFields = [...simpleFields, ...pruebaFields];

      // Verificar si algún campo contiene el término de búsqueda
      return allFields.some((field) => field.includes(searchStr));
    };
  }
  //Tabla pacientes
  columnasTablaPaciente: string[] = [
    'Codigo',
    'NombreItem',
    'PerteneceAPrueba',
    'grupoItemLab',
    'ordenImpresion',
    'accion',
  ];
  dataSourceItems = new MatTableDataSource<IItemLab>();

  // Array para mantener todos los datos iniciales en memoria
  private todosLosItems: IItemLab[] = [];

  ultimosItems(): void {
    this._itemLabService.getLastItemsLab().subscribe((items) => {
      this.todosLosItems = items; // Guardar todos los datos iniciales
      this.dataSourceItems.data = items;
      console.log('Items obtenidos:', items);
    });
  }

  pruebas: any[] = [];
  listarPruebas() {
    this._pruebaService.getLastPruebasLab().subscribe({
      next: (pruebas) => {
        this.pruebas = pruebas;
      },
      error: () => {
        this.pruebas = [];
      },
    });
  }

  terminoBusqueda = new FormControl('');
  timeoutBusqueda: any;

  buscarItems() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    // Asegurar que el dataSource tenga todos los datos
    this.dataSourceItems.data = this.todosLosItems;

    // Aplicar el filtro (el filterPredicate personalizado se encargará de la búsqueda)
    this.dataSourceItems.filter = termino.toLowerCase();

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceItems.paginator) {
      this.dataSourceItems.paginator.firstPage();
    }
  }

  filaSeleccionadaIndex: number | null = null;

  //Carga los datos en los campos
  cargarItemLab(item: IItemLab, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.myFormItemLab.reset(); // Reinicia el formulario antes de cargar los datos
    this.myFormItemLab.patchValue(item);
    this.myFormItemLab
      .get('perteneceAPrueba')
      ?.setValue(item.perteneceAPrueba._id.toString());

    this.paramValidacion.clear();

    // Agregar cada validación al FormArray
    item.paramValidacion.forEach((validacion: any) => {
      this.paramValidacion.push(this.crearValidacionGroup(validacion));
    });
  }

  private crearValidacionGroup(paramValidacion: any): FormGroup {
    return this._fb.group({
      descrValidacion: [paramValidacion.descrValidacion],
      sexo: [paramValidacion.sexo],
      edadIndistinta: [paramValidacion.edadIndistinta],
      edadMin: [paramValidacion.edadMin],
      edadMax: [paramValidacion.edadMax],
      descRegla: [paramValidacion.descRegla],
      valor1: [paramValidacion.valor1],
      valor2: [paramValidacion.valor2],
    });
  }

  limpiarValidacion() {
    // Ahora escuchamos cambios en "poseeValidacion"
    this.myFormItemLab
      .get('poseeValidacion')
      ?.valueChanges.subscribe((valor: boolean) => {
        if (!valor) {
          // Si desactiva el switch, vaciamos las validaciones
          const formArray = this.myFormItemLab.get('paramValidacion');
          if (formArray && formArray instanceof FormArray) {
            formArray.clear();
          }
        }
      });
  }

  validarArrayValores(): boolean {
    const poseeVal = this.myFormItemLab.get('poseeValidacion')?.value;
    const valoresArray = this.myFormItemLab.get('paramValidacion') as FormArray;

    if (poseeVal === true) {
      if (valoresArray.length === 0) {
        return false;
      }
    }

    return true;
  }

  public formSubmitted: boolean = false;

  registraItemLab() {
    if (this.myFormItemLab.invalid) {
      this.myFormItemLab.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    if (this.myFormItemLab.valid && this.validarArrayValores()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de este item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Procede registro');
          const formValue = this.myFormItemLab.value;

          const body: IItemLab = {
            ...formValue,
          };
          console.log('capturando valores en component.ts');

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
                err.message ||
                'No se pudo registrar el item. Intenta nuevamente.';

              Swal.fire({
                title: 'Error',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Ok',
              });
            },
          });
        }
      });
    } else {
      console.log('No Procede');
    }
  }

  actualizarItem() {
    if (this.myFormItemLab.invalid) {
      this.myFormItemLab.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    if (this.myFormItemLab.valid && this.validarArrayValores()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la actualización de este item?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const body: IItemLab = this.myFormItemLab.value; //capturando los valores del component.ts

          this._itemLabService.actualizarItem(body.codItemLab, body).subscribe({
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
                err.message ||
                'No se pudo actualizar el item. Intenta nuevamente.';

              Swal.fire({
                title: 'Error',
                text: mensaje,
                icon: 'error',
                confirmButtonText: 'Ok',
              });
            },
          });
        }
      });
    } else {
      console.log('No Procede Actualización');
    }
  }

  nuevoItem() {
    this.myFormItemLab.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = true;
    this.paramValidacion.clear();
    this.filaSeleccionadaIndex = null; // Reinicia el índice de la fila seleccionada
    this.myFormItemLab.patchValue({
      poseeValidacion: false,
    });
  }

  // public mostrarTabla: boolean = false;
  opened: boolean = false;
  isMobile: boolean = false;

  private breakpointObserver = inject(BreakpointObserver);

  editarItemLab(item: IItemLab, index: number) {
    this.filaSeleccionadaIndex = index;
    this.myFormItemLab.reset(); // Reinicia el formulario antes de cargar los datos
    this.myFormItemLab.patchValue(item);
    this.paramValidacion.clear();

    // Agregar cada validación al FormArray
    item.paramValidacion.forEach((validacion: any) => {
      this.paramValidacion.push(this.crearValidacionGroup(validacion));
    });
  }

  eliminarItemLab(item: IItemLab) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el item ${item.nombreInforme}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._itemLabService.eliminarItemLab(item._id).subscribe({
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
              err.message ||
              'No se pudo eliminar el item. Intenta nuevamente.';

            Swal.fire({
              title: 'Error',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
      }
    });
  }
}
