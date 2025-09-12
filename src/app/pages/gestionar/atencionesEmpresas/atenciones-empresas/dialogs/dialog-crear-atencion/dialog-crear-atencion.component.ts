import { AtencionEmpresaService } from '../../../../../../services/gestion/atencionEmpresa/atencion-empresa.service';
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
import { CommonModule, formatDate } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  IEmpresa,
  IUbicacionSede,
  IPersonaContacto,
} from '../../../../../../models/Mantenimiento/empresa.models';
import { IServicio } from '../../../../../../models/Mantenimiento/servicios.models';
import { IRecHumano } from '../../../../../../models/Mantenimiento/recursoHumano.models';
import {
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { EmpresaService } from '../../../../../../services/mantenimiento/empresa/empresa.service';
import Swal from 'sweetalert2';
import { RecursoHumanoService } from '../../../../../../services/mantenimiento/recursoHumano/recurso-humano.service';
import { CotizacionEmpresaService } from '../../../../../../services/gestion/cotizaciones/cotizacionEmpresa/cotizacion-empresa.service';
import {
  ICotizacionEmpresa,
  IServicioCotizacionEmpresa,
} from '../../../../../../models/Gestion/cotizacionEmpresa.models';

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
  }

  private _fb = inject(FormBuilder);
  private dialog = inject(MatDialogRef<DialogCrearAtencionComponent>);
  private _empresaService = inject(EmpresaService); // Reemplaza con tu servicio real
  private _cotizacionService = inject(CotizacionEmpresaService);
  private _personalService = inject(RecursoHumanoService);
  isEditable = false;
  private _atencionEmpresaService = inject(AtencionEmpresaService);

  ngOnInit(): void {
    this.traerEmpresas();
    this.traerPersonal();
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
  personasContactoEmpresa: IPersonaContacto[] = []; // personas de contacto de la empresa seleccionada
  cotizacionesAprobadas: ICotizacionEmpresa[] = []; // cotizaciones aprobadas de la empresa seleccionada
  serviciosCotizacionSeleccionada: IServicioCotizacionEmpresa[] = []; // servicios de la cotización seleccionada

  empresasFiltradas$!: Observable<IEmpresa[]>;
  personalFiltrado$!: Observable<IRecHumano[]>;

  empresaSeleccionada?: IEmpresa;

  // Step 1
  groupEmpresa = this._fb.group({
    empresa: [null, Validators.required], // guarda objeto; luego puedes mapear a empresaId
    coordinadores: this._fb.array(
      [this.nuevoCoordinador()],
      [Validators.minLength(1)],
    ), // array de coordinadores/personas de contacto
    cotizacionAprobada: [null, Validators.required],
    observacion: [''],
  });

  @ViewChild('inputEmpresa') inputEmpresa!: ElementRef<HTMLInputElement>;
  filteredOptionsEmpresas: IEmpresa[];

  get coordinadores(): FormArray {
    return this.groupEmpresa.get('coordinadores') as FormArray;
  }

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

      // Cargar las personas de contacto de la empresa seleccionada
      this.personasContactoEmpresa = empresa.personasContacto || [];

      // Resetear la sede seleccionada cuando cambie la empresa
      this.groupProgramacion.get('sedeEmpresa')?.setValue(null);

      // Resetear los coordinadores seleccionados cuando cambie la empresa
      this.resetearCoordinadores();

      this._cotizacionService.obtenerCotizacionPorRuc(empresa.ruc).subscribe({
        next: (res) => {
          this.cotizacionesAprobadas = res;
        },
        error: (error) => {
          console.error('Error al obtener la cotización:', error);
        },
      });

      // console.log('Empresa seleccionada:', empresa);
      // console.log('Sedes disponibles:', this.sedes);
      // console.log(
      //   'Personas de contacto disponibles:',
      //   this.personasContactoEmpresa,
      // );
    } else {
      this.empresaSeleccionada = undefined;
      this.sedes = [];
      this.personasContactoEmpresa = [];
      this.groupProgramacion.get('sedeEmpresa')?.setValue(null);
      this.resetearCoordinadores();
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
      // console.log('Sede seleccionada:', sede);
    } else {
      this.groupProgramacion.get('direccion')?.setValue(null);
      this.groupProgramacion.get('linkMaps')?.setValue(null);
    }
  }

  // Método para manejar la selección de cotización
  onCotizacionSeleccionada(cotizacion: ICotizacionEmpresa | null) {
    if (cotizacion) {
      // Obtener la última versión del historial
      const ultimaVersion =
        cotizacion.historial[cotizacion.historial.length - 1];
      let servicios = ultimaVersion.serviciosCotizacion || [];
      if (
        ultimaVersion.aplicarPrecioGlobal &&
        ultimaVersion.cantidadGlobal != null
      ) {
        servicios = servicios.map((servicio) => ({
          ...servicio,
          cantidad: ultimaVersion.cantidadGlobal ?? 0,
        }));
      }
      this.serviciosCotizacionSeleccionada = servicios;

      // console.log('Cotización seleccionada:', cotizacion);
      // console.log(
      //   'Servicios de la cotización:',
      //   this.serviciosCotizacionSeleccionada,
      // );
    } else {
      this.serviciosCotizacionSeleccionada = [];
    }
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
    equipoPersonal: this._fb.array([this.nuevoPersonal()]),
    notas: [''],
  });

  get equipoPersonal(): FormArray {
    return this.groupEquipo.get('equipoPersonal') as FormArray;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  displayPersonal = (p?: IRecHumano) => (p ? p.nombreRecHumano : '');

  nuevosTurnos(): FormGroup {
    return this._fb.group({
      fecha: [null, Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
    });
  }

  nuevoPersonal(): FormGroup {
    return this._fb.group({
      personal: [null as IRecHumano | null],
    });
  }

  nuevoCoordinador(): FormGroup {
    return this._fb.group({
      coordinador: [null as IPersonaContacto | null, Validators.required],
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

  agregarCoordinador() {
    const nuevoCoordinadorForm = this.nuevoCoordinador();
    this.coordinadores.push(nuevoCoordinadorForm);
  }

  eliminarCoordinador(i: number) {
    if (this.coordinadores.length > 1) {
      this.coordinadores.removeAt(i);
    }
  }

  resetearCoordinadores() {
    // Limpiar todos los coordinadores
    while (this.coordinadores.length !== 0) {
      this.coordinadores.removeAt(0);
    }
    // Agregar un coordinador vacío
    this.coordinadores.push(this.nuevoCoordinador());
  }

  // Validar que no se repita el coordinador
  isCoordinadorYaSeleccionado(
    coordinador: IPersonaContacto,
    currentIndex: number,
  ): boolean {
    return this.coordinadores.controls.some((control, index) => {
      if (index === currentIndex) return false; // No comparar con sí mismo
      const coordinadorSeleccionado = control.get('coordinador')?.value;
      return (
        coordinadorSeleccionado &&
        coordinadorSeleccionado.nombre === coordinador.nombre &&
        coordinadorSeleccionado.telefono === coordinador.telefono
      );
    });
  }

  // Obtener coordinadores disponibles para un índice específico
  getCoordinadoresDisponibles(currentIndex: number): IPersonaContacto[] {
    return this.personasContactoEmpresa.filter((c) => {
      // No mostrar coordinadores ya seleccionados en otros índices
      const yaSeleccionado = this.isCoordinadorYaSeleccionado(c, currentIndex);
      return !yaSeleccionado;
    });
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

  traerPersonal() {
    this._personalService.getLastRecHumanos(100).subscribe((rrhh) => {
      this.personal = rrhh;
      // console.log(rrhh);
    });
  }

  crearAtencion() {
    if (
      this.groupEmpresa.invalid ||
      this.groupProgramacion.invalid ||
      this.groupEquipo.invalid
    ) {
      // console.log('Formulario inválido');
      return;
    }

    const empresaControl = this.groupEmpresa.get('empresa');
    const coordinadoresControl = this.groupEmpresa.get('coordinadores');

    if (
      !empresaControl?.value ||
      !coordinadoresControl?.value ||
      coordinadoresControl.value.length === 0
    ) {
      // console.log('Empresa o coordinadores no seleccionados');
      return;
    }

    const empresaObj = empresaControl.value as IEmpresa;
    const coordinadoresArray = coordinadoresControl.value
      .map((c: any) => c.coordinador)
      .filter((coord: any) => coord) as IPersonaContacto[];

    // Construir el objeto según el modelo IAtencionEmp
    const atencion: any = {
      empresaId: empresaObj._id,
      servicioTipo: 'Otro', // Ajustar según lógica de tu app
      fechaRegistro: new Date(),
      programaciones: [
        {
          fechas: this.turnos.value.map((turno: any) => ({
            fecha: turno.fecha,
            horaInicio: turno.horaInicio,
            horaFin: turno.horaFin,
          })),
          sedeEmpresa: this.groupProgramacion.get('sedeEmpresa')?.value || null,
          direccion: this.groupProgramacion.get('direccion')?.value || null,
          linkMaps: this.groupProgramacion.get('linkMaps')?.value || null,
          personalAsignado:
            this.equipoPersonal.value
              ?.map((ep: any) => ep.personal?._id)
              .filter((id: any) => id) || [],
          estado: 'PROGRAMADA',
          observacion: this.groupEmpresa.get('observacion')?.value || null,
          archivos: [],
        },
      ],
      contactosEmpresa: coordinadoresArray.map((coord) => ({
        nombre: coord.nombre,
        cargo: coord.cargo,
        telefono: coord.telefono,
        email: coord.email || null,
      })),
      // Puedes agregar más campos aquí según el modelo
    };

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la generación de esta atención?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._atencionEmpresaService.crearAtencionEmpresa(atencion).subscribe({
          next: (resp) => {
            //console.log('Atención creada:', resp);
            Swal.fire('Éxito', 'Atención creada correctamente', 'success');
            this.dialog.close(resp);
          },
          error: (err) => {
            //console.error('Error al crear atención:', err);
            Swal.fire('Error', 'No se pudo crear la atención', 'error');
          },
        });
      }
    });
  }

  // Método para mostrar información de la persona de contacto
  getPersonaContactoInfo(personaContacto: IPersonaContacto): string {
    let info = personaContacto.nombre;
    if (personaContacto.cargo) {
      info += ` - ${personaContacto.cargo}`;
    }
    if (personaContacto.telefono) {
      info += ` (📞 ${personaContacto.telefono})`;
    }
    return info;
  }

  // Método para obtener información del responsable
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
