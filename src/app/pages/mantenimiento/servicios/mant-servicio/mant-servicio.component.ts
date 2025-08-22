import {
  Component,
  inject,
  ViewChild,
  AfterViewInit,
  OnInit,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { catchError, distinctUntilChanged, of } from 'rxjs';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { customPaginatorIntl } from '../../../../services/utilitarios/mat-paginator-intl';
import { ServiciosService } from '../../../../services/mantenimiento/servicios/servicios.service';
import { ProfesionService } from '../../../../services/mantenimiento/profesion/profesion.service';
import { EspecialidadService } from '../../../../services/mantenimiento/especialidad/especialidad.service';
import { IServicio } from '../../../../models/Mantenimiento/servicios.models';

@Component({
  selector: 'app-mant-servicio',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTableModule,
    MatPaginator,
    CommonModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: customPaginatorIntl }],
  templateUrl: './mant-servicio.component.html',
  styleUrl: './mant-servicio.component.scss',
})
export class MantServicioComponent implements OnInit, AfterViewInit {
  constructor(private _servicioService: ServiciosService) {}

  ngOnInit(): void {
    this.escucharCambioTipo();
    this.traerServicios();
    this.listarProfesiones();
    this.listarEspecialidades();
  }

  private _fb = inject(FormBuilder);
  private _profesionService = inject(ProfesionService);
  private _especialidadService = inject(EspecialidadService);

  public myFormServicio: FormGroup = this._fb.group({
    codServicio: '',
    tipoServicio: ['', [Validators.required]],
    nombreServicio: ['', [Validators.required]],
    descripcionServicio: [''],
    precioServicio: ['', [Validators.required]],
    estadoServicio: [true],
    favoritoServicio: [false],
    favoritoServicioEmpresa: [false],
    examenesServicio: this._fb.array([]),
    profesionesAsociadas: this._fb.array([]),
  });

  get examenesServicio(): FormArray {
    return this.myFormServicio.get('examenesServicio') as FormArray;
  }

  get profesionesAsociadas(): FormArray {
    return this.myFormServicio.get('profesionesAsociadas') as FormArray;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorServicios') paginatorServicios!: MatPaginator;
  @ViewChild('MatPaginatorExamenes') paginatorExamenes!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceServicios.paginator = this.paginatorServicios;
    this.dataSourceExamenesDisponibles.paginator = this.paginatorExamenes;
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //Tabla items disponibles
  columnasDisponibles: string[] = ['codigo', 'nombre', 'accion'];
  dataSourceExamenesDisponibles = new MatTableDataSource<any>();

  //Tabla items seleccionados
  columnasSeleccionados: string[] = ['codigo', 'nombre', 'accion'];
  dataSourceExamenesSeleccionados = new MatTableDataSource<any>();

  //Tabla pruebas de laboratorio
  columnasServicios: string[] = ['codigo', 'nombre', 'precio'];
  dataSourceServicios = new MatTableDataSource<IServicio>();

  tipoServicioTabla = new FormControl('');
  todosLosExamenes: any[] = [];

  escucharCambioTipo() {
    this.tipoServicioTabla.valueChanges.subscribe((tipo) => {
      if (tipo) {
        this.obtenerExamenesPorTipo(tipo);
      } else {
        this.dataSourceExamenesDisponibles.data = [];
      }
    });
  }

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  private todasLosExamenesPorTipoMemoria: any[] = [];

  obtenerExamenesPorTipo(tipo: string) {
    this._servicioService
      .getExamenesPorTipo(tipo)
      .pipe(
        catchError((error) => {
          this.dataSourceExamenesDisponibles.data = [];
          this.todasLosExamenesPorTipoMemoria = [];
          console.error('Error al obtener exámenes por tipo:', error);
          return of({ ok: false, examenes: [] }); // devuelve array vacío para que igual entre en next
        }),
      )
      .subscribe((res: any) => {
        const examenes = res.examenes.map((examen: any) => ({
          codExamen:
            examen.codPruebaLab ||
            examen.codEcografia ||
            examen.codConsulta ||
            examen.codProcedimiento,
          nombreExamen:
            examen.nombrePruebaLab ||
            examen.nombreEcografia ||
            examen.nombreConsulta ||
            examen.nombreProcedimiento,
        }));
        this.dataSourceExamenesDisponibles.data = examenes;
        this.todasLosExamenesPorTipoMemoria = examenes;
      });
  }

  terminoBusquedaExamenes = new FormControl('');

  buscarExamenes() {
    const termino = this.terminoBusquedaExamenes.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todas las pruebas iniciales
      this.dataSourceExamenesDisponibles.data =
        this.todasLosExamenesPorTipoMemoria;
      this.dataSourceExamenesDisponibles.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceExamenesDisponibles.data =
        this.todasLosExamenesPorTipoMemoria; // Asegurar que tiene todos los datos
      this.dataSourceExamenesDisponibles.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceExamenesDisponibles.paginator) {
      this.dataSourceExamenesDisponibles.paginator.firstPage();
    }
  }

  // filtrarExamenes() {
  //   const termino = this.terminoBusquedaExamenesControl.value || '';
  //   this.dataSourceExamenesDisponibles.filter = termino.trim().toLowerCase();
  // }

  // terminoBusquedaExamenes: any;

  // private inicializarBusquedaServicios(): void {
  //   this.terminoBusquedaExamenesControl.valueChanges
  //     .pipe(
  //       //debounceTime(300), // ⏱️ Espera 300 ms después del último cambio
  //       distinctUntilChanged(), // 🔄 Solo si el valor cambió
  //     )
  //     .subscribe((valor: string | null) => {
  //       this.terminoBusquedaExamenes = valor;
  //       this.filtrarExamenes();
  //     });
  // }

  agregarExamen(examen: any) {
    const existe = this.examenesServicio.controls.some(
      (control) => control.value.codExamen === examen.codExamen,
    );

    if (existe) {
      console.log('Servicio ya está agregado');
      return;
    }

    this.examenesServicio.push(this.crearExamenFormGroup(examen));
    this.dataSourceExamenesSeleccionados.data =
      this.examenesServicio.controls.map(
        (control: AbstractControl) => control.value,
      );
  }

  private crearExamenFormGroup(examen: any): FormGroup {
    return this._fb.group({
      codExamen: [examen.codExamen, Validators.required],
      nombreExamen: [examen.nombreExamen, Validators.required],
      //detalle: [examen.detalle],
    });
  }

  removerExamen(examen: any) {
    // Buscar el índice del item en el FormArray
    const index = this.examenesServicio.controls.findIndex(
      (control) => control.value.codItemLab === examen.codItemLab,
    );

    // Si se encuentra el índice, eliminarlo
    if (index !== -1) {
      this.examenesServicio.removeAt(index);

      // Actualizar el dataSource con los nuevos valores
      this.dataSourceExamenesSeleccionados.data =
        this.examenesServicio.controls.map(
          (control: AbstractControl) => control.value,
        );
    }
  }

  nuevoServicio() {
    this.myFormServicio.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario
    this.terminoBusquedaServicio.reset();
    this.terminoBusquedaExamenes.reset();
    this.tipoServicioTabla.reset();
    this.dataSourceServicios.filter = '';
    this.examenesServicio.clear();
    this.profesionesAsociadas.clear();
    this.especialidadesPorProfesion = {}; // Limpiar especialidades filtradas
    this.dataSourceExamenesSeleccionados.data = [];
    this.dataSourceExamenesDisponibles.data = [];
    this.myFormServicio.get('tipoServicio')?.enable();
    this.pruebaSeleccionada = false;
    this.filaSeleccionadaIndex = null; // Reinicia el índice de la fila seleccionada
  }

  formSubmitted = false;
  isLoading = false;

  registraServicio() {
    if (this.myFormServicio.invalid) {
      this.myFormServicio.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la creación de este servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede registro');
        const formValue = this.myFormServicio.value;

        const servicio: IServicio = {
          ...formValue,
        };

        this._servicioService.registrarServicio(servicio).subscribe({
          next: (res) => {
            if (res.ok) {
              this.mostrarAlertaExito('registrado');
              this.traerServicios();
              this.nuevoServicio();
            } else {
              const mensaje = res.msg || 'Ocurrió un error inesperado.';
              this.mostrarAlertaError(mensaje);
            }
          },
          error: (error) => {
            const mensaje =
              error?.error?.msg || 'Error inesperado al registrar.';
            this.mostrarAlertaError(mensaje);
          },
        });
      }
    });
  }

  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: 'Confirmado',
      text: 'Servicio ' + tipo + ' correctamente',
      icon: 'success',
      confirmButtonText: 'Ok',
    });
  }

  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'ERROR!',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Ok',
    });
  }

  actualizarServicio() {
    if (this.myFormServicio.invalid) {
      this.myFormServicio.markAllAsTouched();
      return;
    }

    this.formSubmitted = true;

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este servicio?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        console.log('Procede actualización');
        const formValue = this.myFormServicio.value;

        this._servicioService
          .actualizarServicio(formValue.codServicio, formValue)
          .subscribe({
            next: (res) => {
              if (res.ok) {
                this.mostrarAlertaExito('actualizado');
                this.traerServicios();
                this.nuevoServicio();
              } else {
                const mensaje = res.msg || 'Ocurrió un error inesperado.';
                this.mostrarAlertaError(mensaje);
              }
            },
            error: (error) => {
              const mensaje =
                error?.error?.msg || 'Error inesperado al registrar.';
              this.mostrarAlertaError(mensaje);
            },
          });
      }
    });
  }

  private todasLosServiciosMemoria: IServicio[] = [];

  traerServicios() {
    this._servicioService.getAllServicios().subscribe({
      next: (res: IServicio[]) => {
        this.dataSourceServicios.data = res;
        this.todasLosServiciosMemoria = res;
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }

  terminoBusquedaServicio = new FormControl('');

  buscarServicio() {
    const termino = this.terminoBusquedaServicio?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todas las pruebas iniciales
      this.dataSourceServicios.data = this.todasLosServiciosMemoria;
      this.dataSourceServicios.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceServicios.data = this.todasLosServiciosMemoria; // Asegurar que tiene todos los datos
      this.dataSourceServicios.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceServicios.paginator) {
      this.dataSourceServicios.paginator.firstPage();
    }
  }

  pruebaSeleccionada = false;
  filaSeleccionadaIndex: number | null = null;

  cargarServicio(servicio: IServicio, index: number) {
    this.filaSeleccionadaIndex = index;
    this.pruebaSeleccionada = true;

    this.myFormServicio.get('tipoServicio')?.disable();

    this.myFormServicio.patchValue(servicio);

    this.examenesServicio.clear();

    // Agregar cada teléfono al FormArray
    servicio.examenesServicio.forEach((servicio: any) => {
      this.examenesServicio.push(this.crearExamenFormGroup(servicio));
    });

    this.profesionesAsociadas.clear();
    servicio.profesionesAsociadas.forEach((profesion: any, index: number) => {
      const profesionFormGroup = this.crearProfesionAsociada();
      this.profesionesAsociadas.push(profesionFormGroup);

      // Primero filtrar las especialidades para esta profesión (sin limpiar la especialidad)
      if (profesion.profesionId) {
        this.onProfesionChange(profesion.profesionId, index);
      }

      // Luego cargar los valores (incluyendo la especialidad)
      profesionFormGroup.patchValue(profesion);
    });

    this.dataSourceExamenesSeleccionados.data =
      this.examenesServicio.controls.map(
        (control: AbstractControl) => control.value,
      );
  }

  profesiones: any[] = [];
  especialidades: any[] = [];
  especialidadesPorProfesion: { [key: number]: any[] } = {}; // Objeto para almacenar especialidades por índice

  listarProfesiones() {
    this._profesionService.getAllProfesions().subscribe({
      next: (profesiones) => {
        this.profesiones = profesiones;
      },
      error: () => {
        this.profesiones = [];
      },
    });
  }

  listarEspecialidades() {
    this._especialidadService.getAllEspecialidad().subscribe({
      next: (especialidades) => {
        this.especialidades = especialidades;
      },
      error: () => {
        this.profesiones = [];
      },
    });
  }

  onProfesionChange(profesionId: any, index: number): void {
    // Filtrar especialidades por profesión seleccionada para el índice específico
    this.especialidadesPorProfesion[index] = this.especialidades.filter(
      (especialidad) => especialidad.profesionRef._id === profesionId,
    );
  }

  // Método para obtener las especialidades filtradas por índice
  getEspecialidadesPorIndex(index: number): any[] {
    return this.especialidadesPorProfesion[index] || [];
  }

  agregarProfesionAsociada() {
    this.profesionesAsociadas.push(this.crearProfesionAsociada());
  }

  eliminarProfesionAsociada(index: number) {
    this.profesionesAsociadas.removeAt(index);
  }

  crearProfesionAsociada(): FormGroup {
    return this._fb.group({
      profesionId: [],
      especialidadId: [],
    });
  }

  validaarrayProfesion(): boolean {
    const profesion = this.myFormServicio.get(
      'profesionesAsociadas',
    ) as FormArray;
    if (profesion.length > 0) {
      return true;
    }
    return false;
  }
}
