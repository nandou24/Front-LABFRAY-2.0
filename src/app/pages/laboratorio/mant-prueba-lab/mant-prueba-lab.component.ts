import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
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
import { MatCheckbox } from '@angular/material/checkbox';
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
import { IPruebaLab } from '../../../models/Mantenimiento/pruebaLab.models';
import { IItemLab } from '../../../models/Mantenimiento/items.models';
import { MatButtonModule } from '@angular/material/button';
import { PruebaLabService } from '../../../services/mantenimiento/pruebaLab/prueba-lab.service';
import { ItemLabService } from '../../../services/mantenimiento/itemLab/item-lab.service';
import Swal from 'sweetalert2';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
    MatCheckbox,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './mant-prueba-lab.component.html',
  styleUrl: './mant-prueba-lab.component.scss',
})
export class MantPruebaLabComponent implements OnInit {
  constructor(
    private _pruebaLabService: PruebaLabService,
    private _itemLabService: ItemLabService,
  ) {}

  ngOnInit(): void {
    this.ultimasPruebas();
    this.ultimosItems(5);
    this.inicializarBusquedaItems();
  }

  private _fb = inject(FormBuilder);

  public myFormPruebaLab: FormGroup = this._fb.group({
    codPruebaLab: '',
    areaLab: ['', [Validators.required]],
    nombrePruebaLab: ['', [Validators.required]],
    condPreAnalitPaciente: ['', [Validators.required]],
    condPreAnalitRefer: ['', [Validators.required]],
    tipoMuestra: this._fb.group({
      suero: [false],
      sangreTotal: [false],
      plasmaCitratado: [false],
      orinaAleatoria: [false],
      orina24Horas: [false],
      heces: [false],
      esputo: [false],
      saliva: [false],
      raspado: [false],
      hisopado: [false],
      secrecion: [false],
      cintaAdhesiva: [false],
      otro: [false],
    }),
    tipoTuboEnvase: this._fb.group({
      TuboLila: [false],
      TuboAmarillo: [false],
      TuboCeleste: [false],
      TuboPlomo: [false],
      TuboVerde: [false],
      Criovial: [false],
      FrascoEsteril: [false],
      FrascoNoEsteril: [false],
      FrasconEspatula: [false],
      Hemocultivo: [false],
      MedioTransporte: [false],
      Lamina: [false],
    }),
    tiempoRespuesta: [
      '',
      [Validators.required, Validators.pattern('^[1-9][0-9]*$')],
    ],
    observPruebas: [''],
    estadoPrueba: [true, [Validators.required]],
    ordenImpresion: ['', [Validators.required]],
    itemsComponentes: this._fb.array([]),
  });

  get itemsComponentes(): FormArray {
    return this.myFormPruebaLab.get('itemsComponentes') as FormArray;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  //Tabla items disponibles
  columnasDisponibles: string[] = ['codigo', 'nombre', 'perteneceA', 'accion'];
  dataSourceItemsDisponibles = new MatTableDataSource<IItemLab>();

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //Tabla items seleccionados
  columnasSeleccionados: string[] = [
    'codigo',
    'nombre',
    'perteneceA',
    'accion',
  ];
  dataSourceItemsSeleccionados = new MatTableDataSource<IItemLab>();

  //Tabla pruebas de laboratorio
  columnasPruebas: string[] = ['codigo', 'nombre', 'areaLab'];
  dataSourcePruebas = new MatTableDataSource<IPruebaLab>();

  agregarItem(item: IItemLab) {
    const existe = this.itemsComponentes.controls.some(
      (control) => control.value.codItemLab === item.codItemLab,
    );

    if (existe) {
      Swal.fire({
        title: 'Error',
        text: 'El item ya está agregado',
        icon: 'error',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.itemsComponentes.push(this.crearItemFormGroup(item));
    this.dataSourceItemsSeleccionados.data = this.itemsComponentes.controls.map(
      (control: AbstractControl) => control.value,
    );
  }

  private crearItemFormGroup(item: IItemLab): FormGroup {
    return this._fb.group({
      itemLabId: [item._id],
      codItemLab: [item.codItemLab, Validators.required],
      nombreItemLab: [item.nombreItemLab, Validators.required],
      perteneceA: [item.perteneceA],
    });
  }

  removerItem(item: IItemLab) {
    // Buscar el índice del item en el FormArray
    const index = this.itemsComponentes.controls.findIndex(
      (control) => control.value.codItemLab === item.codItemLab,
    );

    // Si se encuentra el índice, eliminarlo
    if (index !== -1) {
      this.itemsComponentes.removeAt(index);

      // Actualizar el dataSource con los nuevos valores
      this.dataSourceItemsSeleccionados.data =
        this.itemsComponentes.controls.map(
          (control: AbstractControl) => control.value,
        );
    }
  }

  ultimasPruebas(): void {
    this._pruebaLabService.getLastPruebasLab().subscribe((pruebas) => {
      this.dataSourcePruebas.data = pruebas;
      console.log('Pruebas de laboratorio obtenidas:', pruebas);
    });
  }

  // Método últimos 20* pacientes
  ultimosItems(cantidad: number): void {
    this._itemLabService.getLastItemsLab(cantidad).subscribe({
      next: (res: IItemLab[]) => {
        this.dataSourceItemsDisponibles.data = res;
        console.log('Items de laboratorio disponibles:', res);
      },
      error: (err) => {
        console.error('Error al obtener las pruebas:', err);
      },
    });
  }

  terminoBusqueda: any;

  buscarPrueba() {
    const termino = this.terminoBusqueda?.trim() ?? '';

    if (termino.length >= 3) {
      this._pruebaLabService
        .getPruebaLab(this.terminoBusqueda)
        .subscribe((res: IPruebaLab[]) => {
          this.dataSourcePruebas.data = res;
        });
    }
    if (termino.length > 0) {
      this.dataSourcePruebas.data = [];
    } else {
      this.ultimasPruebas();
    }
  }

  terminoBusquedaItemsControl = new FormControl('');
  terminoBusquedaItems: any;

  private inicializarBusquedaItems(): void {
    this.terminoBusquedaItemsControl.valueChanges
      .pipe(
        debounceTime(300), // ⏱️ Espera 300 ms después del último cambio
        distinctUntilChanged(), // 🔄 Solo si el valor cambió
      )
      .subscribe((valor: string | null) => {
        this.terminoBusquedaItems = valor;
        this.buscarItems();
      });
  }

  buscarItems(): void {
    const termino = this.terminoBusquedaItems?.trim() ?? '';

    if (termino.length >= 3) {
      this._itemLabService
        .getItem(this.terminoBusquedaItems)
        .subscribe((res: IItemLab[]) => {
          this.dataSourceItemsDisponibles.data = res;
        });
    }
    if (termino.length > 0) {
      this.dataSourceItemsDisponibles.data = [];
    } else {
      this.ultimosItems(5);
    }
  }

  validarArrayItems(): boolean {
    const valoresArray = this.myFormPruebaLab.get(
      'itemsComponentes',
    ) as FormArray;

    if (valoresArray.length === 0) {
      return false;
    }

    return true;
  }

  validarTipoMuestra(): boolean {
    const formValue = this.myFormPruebaLab.value;

    // Filtrar solo los checkboxes seleccionados de tipo muestra
    const tipoMuestraSeleccionado = Object.keys(formValue.tipoMuestra)
      .filter((key) => formValue.tipoMuestra[key])
      .map((key) => key); // Devuelve un array con las claves marcadas

    if (tipoMuestraSeleccionado.length > 0) {
      return true;
    }

    return false;
  }

  validarTipoEnvase(): boolean {
    const formValue = this.myFormPruebaLab.value;

    // Filtrar solo los checkboxes seleccionados de tipo muestra
    const tipoEnvaseSeleccionado = Object.keys(formValue.tipoTuboEnvase)
      .filter((key) => formValue.tipoTuboEnvase[key])
      .map((key) => key); // Devuelve un array con las claves marcadas

    if (tipoEnvaseSeleccionado.length > 0) {
      return true;
    }

    return false;
  }

  nuevaPrueba() {
    this.myFormPruebaLab.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario
    this.itemsComponentes.clear();
    this.dataSourceItemsSeleccionados.data = [];
    this.myFormPruebaLab.get('nombrePruebaLab')?.enable();
    this.myFormPruebaLab.get('areaLab')?.enable();
    //this.filaSeleccionadaPruebas = null;
    this.pruebaSeleccionada = false;
  }

  formSubmitted = false;

  registraPrueba() {
    if (this.myFormPruebaLab.invalid) {
      this.myFormPruebaLab.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    if (
      this.myFormPruebaLab.valid &&
      this.validarArrayItems() &&
      this.validarTipoMuestra() &&
      this.validarTipoEnvase()
    ) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de esta prueba?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Procede registro');
          const formValue = this.myFormPruebaLab.value;

          // Filtrar solo los checkboxes seleccionados de tipo muestra
          const tipoMuestraSeleccionado = Object.keys(formValue.tipoMuestra)
            .filter((key) => formValue.tipoMuestra[key])
            .map((key) => key); // Devuelve un array con las claves marcadas

          // Filtrar solo los checkboxes seleccionados de tipo tubo
          const tipoTuboEnvaseSeleccionado = Object.keys(
            formValue.tipoTuboEnvase,
          )
            .filter((key) => formValue.tipoTuboEnvase[key])
            .map((key) => key); // Devuelve un array con las claves marcadas

          const body: IPruebaLab = {
            ...formValue,
            tipoMuestra: tipoMuestraSeleccionado, //solo los seleccionados
            tipoTuboEnvase: tipoTuboEnvaseSeleccionado, //solo los seleccionados
          };

          this._pruebaLabService.registrarPruebaLab(body).subscribe((res) => {
            if (res !== 'ERROR') {
              Swal.fire({
                title: 'Confirmado',
                text: 'Prueba Registrado',
                icon: 'success',
                confirmButtonText: 'Ok',
              });
              this.ultimasPruebas();
              this.nuevaPrueba();
              //this._router.navigateByUrl('/auth/login');
            } else {
              console.log('No procede');
            }
          });
        }
      });
    } else {
      console.log('No Procede');
    }
  }

  actualizarPrueba() {
    if (this.myFormPruebaLab.invalid) {
      this.myFormPruebaLab.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    if (
      this.myFormPruebaLab.valid &&
      this.validarArrayItems() &&
      this.validarTipoMuestra() &&
      this.validarTipoEnvase()
    ) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la actualización de esta prueba?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Procede actualización');
          const formValue = this.myFormPruebaLab.value;

          // Filtrar solo los checkboxes seleccionados de tipo muestra
          const tipoMuestraSeleccionado = Object.keys(formValue.tipoMuestra)
            .filter((key) => formValue.tipoMuestra[key])
            .map((key) => key); // Devuelve un array con las claves marcadas

          // Filtrar solo los checkboxes seleccionados de tipo tubo
          const tipoTuboEnvaseSeleccionado = Object.keys(
            formValue.tipoTuboEnvase,
          )
            .filter((key) => formValue.tipoTuboEnvase[key])
            .map((key) => key); // Devuelve un array con las claves marcadas

          const body: IPruebaLab = {
            ...formValue,
            tipoMuestra: tipoMuestraSeleccionado, //solo los seleccionados
            tipoTuboEnvase: tipoTuboEnvaseSeleccionado, //solo los seleccionados
          };

          this._pruebaLabService
            .actualizarPruebaLab(body.codPruebaLab, body)
            .subscribe((res) => {
              if (res !== 'ERROR') {
                Swal.fire({
                  title: 'Confirmado',
                  text: 'Prueba Actualizado',
                  icon: 'success',
                  confirmButtonText: 'Ok',
                });
                this.ultimasPruebas();
                this.nuevaPrueba();
              } else {
                console.log('Error de servidor');
              }
            });
        }
      });
    } else {
      console.log('No Procede Actualización');
    }
  }

  pruebaSeleccionada = false;

  cargarPruebas(prueba: IPruebaLab) {
    this.pruebaSeleccionada = true;

    this.myFormPruebaLab.get('nombrePruebaLab')?.disable();
    this.myFormPruebaLab.get('areaLab')?.disable();

    this.myFormPruebaLab.patchValue({
      codPruebaLab: prueba.codPruebaLab,
      areaLab: prueba.areaLab,
      nombrePruebaLab: prueba.nombrePruebaLab,
      condPreAnalitPaciente: prueba.condPreAnalitPaciente,
      condPreAnalitRefer: prueba.condPreAnalitRefer,
      tiempoRespuesta: prueba.tiempoRespuesta,
      observPruebas: prueba.observPruebas,
      estadoPrueba: prueba.estadoPrueba,
    });

    // Actualizar los checkboxes de tipoTuboEnvase
    const tipoMuestraFormGroup = this.myFormPruebaLab.get(
      'tipoMuestra',
    ) as FormGroup;
    Object.keys(tipoMuestraFormGroup.controls).forEach((key) => {
      tipoMuestraFormGroup.get(key)?.setValue(prueba.tipoMuestra.includes(key));
    });

    // Actualizar los checkboxes de tipoTuboEnvase
    const tipoTuboEnvaseFormGroup = this.myFormPruebaLab.get(
      'tipoTuboEnvase',
    ) as FormGroup;
    Object.keys(tipoTuboEnvaseFormGroup.controls).forEach((key) => {
      tipoTuboEnvaseFormGroup
        .get(key)
        ?.setValue(prueba.tipoTuboEnvase.includes(key));
    });

    this.itemsComponentes.clear();

    // Agregar cada teléfono al FormArray
    prueba.itemsComponentes.forEach((item: any) => {
      this.itemsComponentes.push(this.crearItemFormGroup(item.itemLabId));
    });

    this.dataSourceItemsSeleccionados.data = this.itemsComponentes.controls.map(
      (control: AbstractControl) => control.value,
    );
  }
}
