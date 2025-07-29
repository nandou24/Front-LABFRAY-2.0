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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
    MatPaginatorModule,
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
    // this.inicializarBusquedaItems();
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
  @ViewChild('MatPaginatorPruebas') paginatorPruebas!: MatPaginator;
  @ViewChild('MatPaginatorItems') paginatorItems!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourcePruebas.paginator = this.paginatorPruebas;
    this.dataSourceItemsDisponibles.paginator = this.paginatorItems;
  }

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
      nombreInforme: [item.nombreInforme, Validators.required],
      perteneceA: [item.perteneceAPrueba],
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

  // Array para mantener todas las pruebas en memoria
  private todasLasPruebasMemoria: IPruebaLab[] = [];

  ultimasPruebas(): void {
    this._pruebaLabService.getLastPruebasLab().subscribe((pruebas) => {
      this.todasLasPruebasMemoria = pruebas; // Guardar todas las pruebas en memoria
      this.dataSourcePruebas.data = pruebas;
      console.log('Pruebas de laboratorio obtenidas:', pruebas);
    });
  }

  // Array para mantener todos los datos iniciales en memoria
  private todosLosItems: IItemLab[] = [];

  // Método últimos 20* pacientes
  ultimosItems(): void {
    this._itemLabService.getLastItemsLab().subscribe({
      next: (res: IItemLab[]) => {
        this.todosLosItems = res; // Guardar todos los items en memoria
        this.dataSourceItemsDisponibles.data = res;
        console.log('Items de laboratorio disponibles:', res);
      },
      error: (err) => {
        console.error('Error al obtener las pruebas:', err);
      },
    });
  }

  terminoBusqueda = new FormControl('');
  terminoBusquedaItems = new FormControl('');

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

  buscarItems(): void {
    const termino = this.terminoBusquedaItems?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todos los items iniciales
      this.dataSourceItemsDisponibles.data = this.todosLosItems;
      this.dataSourceItemsDisponibles.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceItemsDisponibles.data = this.todosLosItems; // Asegurar que tiene todos los datos
      this.dataSourceItemsDisponibles.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceItemsDisponibles.paginator) {
      this.dataSourceItemsDisponibles.paginator.firstPage();
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
    this.pruebaSeleccionada = false;
    this.filaSeleccionadaIndex = null;
    this.terminoBusqueda.setValue(''); // Limpia el campo de búsqueda
    this.terminoBusquedaItems.setValue(''); // Limpia el campo de búsqueda de
    this.buscarItems(); // Vuelve a cargar los items disponibles
    this.buscarPrueba(); // Vuelve a cargar las pruebas disponibles
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

          this._pruebaLabService.registrarPruebaLab(body).subscribe({
            next: (res) => {
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
            .subscribe({
              next: (res) => {
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
        }
      });
    } else {
      console.log('No Procede Actualización');
    }
  }

  pruebaSeleccionada = false;
  filaSeleccionadaIndex: number | null = null;

  cargarPruebas(prueba: IPruebaLab, index: number) {
    this.pruebaSeleccionada = true;
    this.filaSeleccionadaIndex = index;

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
      ordenImpresion: prueba.ordenImpresion,
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
