import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
  constructor(private _itemLabService: ItemLabService) {}

  ngOnInit(): void {
    this.ultimosItems(100), this.limpiarValidacion();
  }

  private _fb = inject(FormBuilder);

  public myFormItemLab: FormGroup = this._fb.group({
    codItemLab: '',
    nombreInforme: ['', [Validators.required]],
    nombreHojaTrabajo: ['', [Validators.required]],
    metodoItemLab: ['', [Validators.required]],
    valoresHojaTrabajo: ['', [Validators.required]],
    valoresInforme: ['', [Validators.required]],
    unidadesRef: ['', [Validators.required]],
    perteneceA: ['', [Validators.required]],
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
  }
  //Tabla pacientes
  columnasTablaPaciente: string[] = ['Codigo', 'NombreItem', 'PerteneceA'];
  dataSourceItems = new MatTableDataSource<IItemLab>();

  ultimosItems(cantidad: number): void {
    this._itemLabService.getLastItemsLab(cantidad).subscribe((items) => {
      this.dataSourceItems.data = items;
    });
  }

  terminoBusqueda = new FormControl('');
  timeoutBusqueda: any;

  buscarItems() {
    clearTimeout(this.timeoutBusqueda);
    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusqueda.value?.trim() || '';
      if (termino.length >= 3) {
        this._itemLabService.getItem(termino).subscribe((res: IItemLab[]) => {
          this.dataSourceItems.data = res;
        });
      } else if (termino.length > 0) {
        this.dataSourceItems.data = [];
      } else {
        this.ultimosItems(100);
      }
    }, 200);
  }

  //Carga los datos en los campos
  cargarItemLab(item: IItemLab): void {
    this.myFormItemLab.patchValue(item);

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
              this.ultimosItems(100);
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
              this.ultimosItems(100);
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
    this.myFormItemLab.patchValue({
      poseeValidacion: false,
    });
  }

  // public mostrarTabla: boolean = false;
  opened: boolean = true;

  // toggleTabla(): void {
  //   this.mostrarTabla = !this.mostrarTabla;
  // }
}
