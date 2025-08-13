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
import { MatTimepickerModule } from '@angular/material/timepicker';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
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
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import { ServiciosService } from '../../../../../../services/mantenimiento/servicios/servicios.service';
import Swal from 'sweetalert2';
import { RecursoHumanoService } from '../../../../../../services/mantenimiento/recursoHumano/recurso-humano.service';

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
    MatTimepickerModule,
  ],
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-PE' },
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
  private _personalService = inject(RecursoHumanoService);
  isEditable = false;

  ngOnInit(): void {
    this.traerEmpresas();
    this.traerServicios();
    this.traerPersonal();
    // Inicializar el filtro para el primer servicio
    this.initializeServicioFilter(0);
  }

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
  sedes: IUbicacionSede[] = []; // cargar desde API
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

  onEmpresaSeleccionada(empresa: IEmpresa | null) {
    if (empresa) {
      this.empresaSeleccionada = empresa;
      this.sedes = empresa.ubicacionesSedes || [];
      // Resetear la sede seleccionada cuando cambie la empresa
      this.groupProgramacion.get('sedeEmpresa')?.setValue(null);
      console.log('Empresa seleccionada:', empresa);
      console.log('Sedes disponibles:', this.sedes);
    } else {
      this.empresaSeleccionada = undefined;
      this.sedes = [];
      this.groupProgramacion.get('sedeEmpresa')?.setValue(null);
    }
  }

  onSedeSeleccionada(sede: IUbicacionSede | null) {
    if (sede) {
      // Auto-completar dirección si está disponible en la sede
      if (sede.direccionSede) {
        this.groupProgramacion.get('direccion')?.setValue(sede.direccionSede);
      }
      // Auto-completar link de Maps si está disponible
      if (sede.coordenadasMaps) {
        this.groupProgramacion.get('linkMaps')?.setValue(sede.coordenadasMaps);
      }
      console.log('Sede seleccionada:', sede);
    } else {
      this.groupProgramacion.get('direccion')?.setValue(null);
      this.groupProgramacion.get('linkMaps')?.setValue(null);
    }
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
    sedeEmpresa: [null as IUbicacionSede | null, Validators.required],
    direccion: [null as string | null, Validators.required],
    linkMaps: [null as string | null, Validators.required],
    turnos: this._fb.array([this.nuevosTurnos()]),
  });

  get turnos(): FormArray {
    return this.groupProgramacion.get('turnos') as FormArray;
  }

  // Step 3
  groupEquipo = this._fb.group({
    responsable: [null as IRecHumano | null, Validators.required],
    equipoPersonal: this._fb.array(
      [this.nuevoPersonal()],
      [Validators.minLength(1)],
    ),
    notas: [''],
  });

  get equipoPersonal(): FormArray {
    return this.groupEquipo.get('equipoPersonal') as FormArray;
  }

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
  nuevoServicio(): FormGroup {
    return this._fb.group({
      //_id: [null, Validators.required],
      nombreServicio: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });
  }

  nuevosTurnos(): FormGroup {
    return this._fb.group({
      fecha: [null, Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  nuevoPersonal(): FormGroup {
    return this._fb.group({
      personal: [null as IRecHumano | null, Validators.required],
    });
  }

  agregarTurno() {
    this.turnos.push(this.nuevosTurnos());
  }

  eliminarTurno(i: number) {
    this.turnos.removeAt(i);
  }

  agregarPersonal() {
    const nuevoPersonalForm = this.nuevoPersonal();
    this.equipoPersonal.push(nuevoPersonalForm);
  }

  eliminarPersonal(i: number) {
    if (this.equipoPersonal.length > 1) {
      this.equipoPersonal.removeAt(i);
    }
  }

  // Validar que no se repita el personal
  isPersonalYaSeleccionado(
    personal: IRecHumano,
    currentIndex: number,
  ): boolean {
    return this.equipoPersonal.controls.some((control, index) => {
      if (index === currentIndex) return false; // No comparar con sí mismo
      const personalSeleccionado = control.get('personal')?.value;
      return personalSeleccionado && personalSeleccionado._id === personal._id;
    });
  }

  // Obtener personal disponible para un índice específico
  getPersonalDisponible(currentIndex: number): IRecHumano[] {
    const responsable = this.groupEquipo.get('responsable')?.value;

    return this.personal.filter((p) => {
      // No mostrar personal ya seleccionado en otros índices
      const yaSeleccionado = this.isPersonalYaSeleccionado(p, currentIndex);

      // No mostrar al responsable en la lista de personal del equipo
      const esResponsable = responsable && responsable._id === p._id;

      return !yaSeleccionado && !esResponsable;
    });
  }

  // Método para mostrar información del personal
  getPersonalInfo(personal: IRecHumano): string {
    return `${personal.tipoDoc} ${personal.nroDoc} ${personal.apePatRecHumano} ${personal.apeMatRecHumano}, ${personal.nombreRecHumano}`;
  }

  // Método para obtener el teléfono del personal
  getPersonalTelefono(personal: IRecHumano): string {
    if (personal.phones && personal.phones.length > 0) {
      // Buscar el primer teléfono que no esté vacío
      for (const phone of personal.phones) {
        if (
          phone &&
          (phone as any).phoneNumber &&
          (phone as any).phoneNumber.trim()
        ) {
          // Si hay descripción, mostrarla junto al número
          const phoneObj = phone as any;
          const description = phoneObj.descriptionPhone
            ? ` (${phoneObj.descriptionPhone})`
            : '';
          return `${phoneObj.phoneNumber.trim()}${description}`;
        }
      }
    }
    return 'No disponible';
  }

  // Método para abrir Google Maps con coordenadas
  abrirEnMaps() {
    const coordenadas = this.groupProgramacion.get('linkMaps')?.value;
    console.log('Coordenadas recibidas:', coordenadas);
    if (!coordenadas) {
      Swal.fire({
        title: 'Coordenadas inválidas',
        text: 'No hay coordenadas válidas para mostrar en el mapa. Formato requerido: latitud,longitud (ej: -12.0464,-77.0428)',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Usar las coordenadas directamente
    const [lat, lng] = coordenadas.split(',');
    const url = `https://www.google.com/maps?q=${lat.trim()},${lng.trim()}`;
    window.open(url, '_blank');
  }

  cancelar() {
    this.dialog.close();
  }

  traerEmpresas() {
    this._empresaService.getLastEmpresas(0).subscribe((empresas) => {
      this.empresas = empresas;
      //console.log(empresas);
    });
  }

  traerServicios() {
    this._servicioService.getAllServicios().subscribe((servicios) => {
      this.serviciosdisponibles = servicios;
      // Inicializar filtros para servicios existentes
      for (let i = 0; i < this.servicios.length; i++) {
        this.initializeServicioFilter(i);
      }
      //console.log(servicios);
    });
  }

  traerPersonal() {
    this._personalService.getLastRecHumanos(100).subscribe((rrhh) => {
      this.personal = rrhh;
      console.log(rrhh);
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

  // Obtener la información del responsable
  getResponsableInfo(): IRecHumano | null {
    const responsable = this.groupEquipo.get('responsable')?.value;
    return responsable || null;
  }

  // Validación personalizada para evitar duplicados
  validarPersonalUnico(): { [key: string]: any } | null {
    const personalArray = this.equipoPersonal;
    const responsable = this.groupEquipo.get('responsable')?.value;

    if (!personalArray || !personalArray.value) {
      return null;
    }

    // Verificar duplicados en el array de personal
    const personalIds = personalArray.value.map((p: IRecHumano) => p._id);
    const duplicados = personalIds.filter(
      (id: string, index: number) => personalIds.indexOf(id) !== index,
    );

    // Verificar si el responsable está en el array de personal
    const responsableEnPersonal =
      responsable && personalIds.includes(responsable._id);

    if (duplicados.length > 0 || responsableEnPersonal) {
      return { personalDuplicado: true };
    }

    return null;
  }
}
