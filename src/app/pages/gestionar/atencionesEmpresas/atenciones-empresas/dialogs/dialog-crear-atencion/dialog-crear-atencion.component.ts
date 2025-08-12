import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { map, Observable, of, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  IEmpresa,
  IUbicacionSede,
} from '../../../../../../models/Mantenimiento/empresa.models';
import { IServicio } from '../../../../../../models/Mantenimiento/servicios.models';
import { IRecHumano } from '../../../../../../models/Mantenimiento/recursoHumano.models';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
} from '@angular/material/core';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { ServiciosService } from '../../../../../../services/mantenimiento/servicios/servicios.service';

@Component({
  selector: 'app-dialog-crear-atencion',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatAutocompleteModule,
  ],
  templateUrl: './dialog-crear-atencion.component.html',
  styleUrl: './dialog-crear-atencion.component.scss',
})
export class DialogCrearAtencionComponent implements OnInit {
  constructor() {
    this.filteredOptionsEmpresas = this.empresas.slice();
    this.filteredOptionsServicios = this.serviciosdisponibles.slice();
  }

  private _fb = inject(FormBuilder);
  private dialog = inject(MatDialogRef<DialogCrearAtencionComponent>);
  private _empresaService = inject(EmpresaService); // Reemplaza con tu servicio real
  private _servicioService = inject(ServiciosService);
  isEditable = false;

  ngOnInit(): void {
    this._adapter.setLocale('es-PE');
    this.traerEmpresas();
    this.traerServicios();
    // Inicializar el filtro para el primer servicio
    this.initializeServicioFilter(0);
  }

  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  // formProgramacion = this._fb.group({
  //   empresa: this._fb.group({
  //     empresa: [null, Validators.required], // objeto seleccionado -> luego empresaId
  //     protocolo: [null, Validators.required],
  //     observacion: [''],
  //   }),
  //   programacion: this._fb.group({
  //     programaciones: this._fb.array([
  //       this._fb.group({
  //         fecha: [null, Validators.required],
  //         horaInicio: ['', Validators.required],
  //         horaFin: ['', Validators.required],
  //         sedeEmpresa: [null],
  //         direccion: [''],
  //         linkMaps: [''],
  //       }),
  //     ]),
  //   }),
  //   equipo: this._fb.group({
  //     sedeInterna: [null, Validators.required],
  //     responsable: [null, Validators.required],
  //     equipo: this._fb.control<any[]>([]),
  //     notas: [''],
  //   }),
  // });

  // get fEmp() {
  //   return this.formProgramacion.get('empresa') as FormGroup;
  // }
  // get fProg() {
  //   return this.formProgramacion.get('programacion') as FormGroup;
  // }
  // get fEq() {
  //   return this.formProgramacion.get('equipo') as FormGroup;
  // }
  // get programaciones() {
  //   return this.fProg.get('programaciones') as FormArray;
  // }

  // --- data sources (reemplaza por tus services) ---
  empresas: IEmpresa[] = []; // cargar desde API
  serviciosdisponibles: IServicio[] = []; // cargar desde API
  sedesInternas: IUbicacionSede[] = []; // cargar desde API
  personal: IRecHumano[] = []; // cargar desde API

  empresasFiltradas$!: Observable<IEmpresa[]>;
  serviciosFiltrados$!: Observable<IServicio[]>;
  personalFiltrado$!: Observable<IRecHumano[]>;

  empresaSeleccionada?: IEmpresa;

  // Arrays de filtrado independientes para cada servicio
  serviciosFiltradosPorIndice: { [index: number]: IServicio[] } = {};

  // Step 1
  groupEmpresa = this._fb.group({
    empresa: [null, Validators.required], // guarda objeto; luego puedes mapear a empresaId
    servicios: this._fb.array([this.nuevoServicio()]), // Inicia con un servicio
    observacion: [''],
  });

  get servicios(): FormArray {
    return this.groupEmpresa.get('servicios') as FormArray;
  }

  @ViewChild('inputEmpresa') inputEmpresa!: ElementRef<HTMLInputElement>;
  filteredOptionsEmpresas: IEmpresa[];

  //Filtra las empresas por razón social o RUC.
  filterEmpresas(): void {
    const filterValue = this.inputEmpresa.nativeElement.value.toLowerCase();
    this.filteredOptionsEmpresas = this.empresas.filter(
      (o) =>
        o.razonSocial.toLowerCase().includes(filterValue) ||
        o.ruc.toLowerCase().includes(filterValue),
    );
  }

  // Muestra la razón social y RUC de la empresa al momento de seleccionar
  displayFnEmpresas(empresa: IEmpresa): string {
    return empresa && empresa.razonSocial && empresa.ruc
      ? empresa.ruc + ' - ' + empresa.razonSocial
      : '';
  }

  @ViewChild('inputServicio') inputServicio!: ElementRef<HTMLInputElement>;
  filteredOptionsServicios: IServicio[];

  // Nuevo método: Filtra servicios para un campo específico por índice
  filterServiciosByIndex(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    const filterValue = target.value.toLowerCase();

    this.serviciosFiltradosPorIndice[index] = this.serviciosdisponibles.filter(
      (o) => o.nombreServicio.toLowerCase().includes(filterValue),
    );
  }

  // Método para obtener servicios filtrados por índice
  getServiciosFiltrados(index: number): IServicio[] {
    if (!this.serviciosFiltradosPorIndice[index]) {
      this.serviciosFiltradosPorIndice[index] =
        this.serviciosdisponibles.slice();
    }
    return this.serviciosFiltradosPorIndice[index];
  }

  // Método para inicializar el filtro de un nuevo servicio
  initializeServicioFilter(index: number): void {
    this.serviciosFiltradosPorIndice[index] = this.serviciosdisponibles.slice();
  }

  // Muestra el nombre del servicio al momento de seleccionar
  displayFnServicios(servicio: IServicio): string {
    return servicio && servicio.nombreServicio ? servicio.nombreServicio : '';
  }

  // Step 2
  groupProgramacion = this._fb.group({
    sedeEmpresa: [null, Validators.required],
    direccion: [null, Validators.required],
    linkMaps: [null, Validators.required],
    turnos: this._fb.array([this.nuevaProg()]),
  });

  get turnos(): FormArray {
    return this.groupProgramacion.get('turnos') as FormArray;
  }

  // Step 3
  groupEquipo = this._fb.group({
    sedeInterna: [null, Validators.required],
    responsable: [null, Validators.required], // 1 responsable
    equipo: [[]], // array (chips)
    notas: [''],
  });

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  displayPersonal = (p?: IRecHumano) => (p ? p.nombreRecHumano : '');

  agregarServicio() {
    const servicio = this.nuevoServicio();
    const nuevoIndice = this.servicios.length;
    this.servicios.push(servicio);
    // Inicializar el filtro para el nuevo servicio
    this.initializeServicioFilter(nuevoIndice);
  }

  eliminarServicios(i: number) {
    this.servicios.removeAt(i);
    // Limpiar el filtro del índice eliminado
    delete this.serviciosFiltradosPorIndice[i];
    // Reorganizar los filtros restantes
    const nuevosServiciosFiltrados: { [index: number]: IServicio[] } = {};
    Object.keys(this.serviciosFiltradosPorIndice).forEach((key) => {
      const index = parseInt(key);
      if (index > i) {
        nuevosServiciosFiltrados[index - 1] =
          this.serviciosFiltradosPorIndice[index];
      } else if (index < i) {
        nuevosServiciosFiltrados[index] =
          this.serviciosFiltradosPorIndice[index];
      }
    });
    this.serviciosFiltradosPorIndice = nuevosServiciosFiltrados;
  }

  onEmpresaSelected(e: IEmpresa) {
    this.empresaSeleccionada = e;
    // opcional: autoseleccionar su primera sede para cada programación
    this.turnos.controls.forEach((ctrl) =>
      ctrl.get('sedeEmpresa')?.setValue(null),
    );
  }

  nuevoServicio(): FormGroup {
    return this._fb.group({
      //_id: [null, Validators.required],
      nombreServicio: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });
  }

  nuevaProg(): FormGroup {
    return this._fb.group({
      fecha: [null, Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      sedeEmpresa: [null], // una de las sedes de la empresa
      direccion: [''],
      linkMaps: [''],
    });
  }
  agregarProg() {
    this.turnos.push(this.nuevaProg());
  }
  eliminarProg(i: number) {
    this.turnos.removeAt(i);
  }

  cancelar() {
    this.dialog.close();
  }

  traerEmpresas() {
    this._empresaService.getLastEmpresas(0).subscribe((empresas) => {
      this.empresas = empresas;
      console.log(empresas);
    });
  }

  traerServicios() {
    this._servicioService.getAllServicios().subscribe((servicios) => {
      this.serviciosdisponibles = servicios;
      // Inicializar filtros para servicios existentes
      for (let i = 0; i < this.servicios.length; i++) {
        this.initializeServicioFilter(i);
      }
      console.log(servicios);
    });
  }

  crear() {
    // if (
    //   this.fgEmpresa.invalid ||
    //   this.fgProgramacion.invalid ||
    //   this.fgEquipo.invalid
    // )
    //   return;
    // const empresaObj: IEmpresa = this.fgEmpresa.value.empresa;
    // const protocoloObj: IServicio = this.fgEmpresa.value.protocolo;
    // const dto = {
    //   empresaId: empresaObj._id,
    //   protocoloId: protocoloObj._id,
    //   observacion: this.fgEmpresa.value.observacion,
    //   programaciones: this.programaciones.value.map((p: any) => ({
    //     fecha: p.fecha,
    //     horaInicio: p.horaInicio,
    //     horaFin: p.horaFin,
    //     sedeEmpresaId: p.sedeEmpresa?._id || null,
    //     direccion: p.direccion || null,
    //     linkMaps: p.linkMaps || null,
    //   })),
    //   sedeInternaId: this.fgEquipo.value.sedeInterna._id,
    //   responsableId: this.fgEquipo.value.responsable._id,
    //   equipoIds: (this.fgEquipo.value.equipo || []).map(
    //     (x: IRecHumano) => x._id,
    //   ),
    //   notas: this.fgEquipo.value.notas || null,
    // };
    // this.dialog.close(dto); // el padre llama a tu service para persistir
  }
}
