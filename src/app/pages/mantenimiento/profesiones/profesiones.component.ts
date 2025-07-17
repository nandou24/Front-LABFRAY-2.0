import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IProfesion } from '../../../models/Mantenimiento/profesion.models';
import Swal from 'sweetalert2';
import { ProfesionService } from '../../../services/mantenimiento/profesion/profesion.service';
import { MatCardModule } from '@angular/material/card';
import { IEspecialidad } from '../../../models/Mantenimiento/especialidad.models';
import { EspecialidadService } from '../../../services/mantenimiento/especialidad/especialidad.service';

@Component({
  selector: 'app-especialidades',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './profesiones.component.html',
  styleUrl: './profesiones.component.scss',
})
export class ProfesionesComponent implements OnInit {
  ngOnInit(): void {
    this.listarProfesiones();
    this.listarEspecialidades();
  }
  private _fb = inject(FormBuilder);
  private _profesionService = inject(ProfesionService);
  private _especialidadService = inject(EspecialidadService);

  profesionesForm: FormGroup = this._fb.group({
    nombreProfesion: ['', Validators.required],
    estadoProfesion: [true, Validators.required],
  });

  especialidadesForm: FormGroup = this._fb.group({
    codProfesion: [null, Validators.required],
    nombreEspecialidad: ['', Validators.required],
    estadoEspecialidad: [true, Validators.required],
  });

  dataSourceProfesiones = new MatTableDataSource<IProfesion>([]);
  displayedColumns: string[] = [
    'codigoProfesion',
    'nombreProfesion',
    'activo',
    'fechaCreacion',
    'acciones',
  ];

  profesionesDisponibles: IProfesion[] = [];
  public profesionSeleccionada: IProfesion | null = null;
  public modoEdicion: boolean = false;

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  limpiarProfesion() {
    this.modoEdicion = false;
    this.profesionSeleccionada = null;
    this.profesionesForm.reset();
    this.profesionesForm.get('estadoProfesion')?.setValue(true);
  }

  crearProfesion() {
    if (this.profesionesForm.invalid) {
      this.profesionesForm.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: '¿Registrar profesión?',
      text: '¿Está seguro de registrar esta profesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const profesion: IProfesion = {
          ...this.profesionesForm.value,
        };
        this._profesionService.registrarProfesion(profesion).subscribe({
          next: () => {
            Swal.fire(
              'Registrado',
              'Profesión registrada correctamente',
              'success',
            );
            this.profesionesForm.reset({ estado: true });
            this.listarProfesiones();
            this.limpiarProfesion();
          },
          error: (err) => {
            const mensaje =
              err?.error?.msg ||
              err.message ||
              'No se pudo registrar la profesion. Intenta nuevamente.';
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

  editarProfesion(profesion: IProfesion) {
    this.modoEdicion = true;
    this.profesionSeleccionada = profesion;
    this.profesionesForm.patchValue(profesion);
  }

  actualizarProfesion() {
    if (this.profesionesForm.invalid || !this.profesionSeleccionada) {
      this.profesionesForm.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: '¿Actualizar profesión?',
      text: '¿Está seguro de actualizar esta profesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const profesion: IProfesion = this.profesionesForm.value;
        this._profesionService
          .actualizarProfesion(
            this.profesionSeleccionada!.codProfesion,
            profesion,
          )
          .subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Profesión actualizada correctamente',
                'success',
              );
              this.limpiarProfesion();
              this.listarProfesiones();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo actualizar la profesión. Intenta nuevamente.';

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

  eliminarProfesion(profesion: IProfesion) {
    Swal.fire({
      title: '¿Eliminar profesión?',
      text: `¿Está seguro de eliminar la profesión ${profesion.nombreProfesion}?`,
      icon: 'warning',
      iconColor: '#dd1313ff',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#dd1313ff',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._profesionService
          .eliminarProfesion(profesion.codProfesion)
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminado',
                'Profesión eliminada correctamente',
                'success',
              );
              this.listarProfesiones();
              this.limpiarProfesion();
            },
            error: () =>
              Swal.fire('Error', 'No se pudo eliminar la profesión', 'error'),
          });
      }
    });
  }

  listarProfesiones() {
    this._profesionService.getAllProfesions().subscribe({
      next: (especialidades) => {
        this.dataSourceProfesiones.data = especialidades;
        this.profesionesDisponibles = especialidades;
      },
      error: () => {
        this.dataSourceProfesiones.data = [];
      },
    });
  }

  //Especialidad
  dataSourceEspecialidades = new MatTableDataSource<IEspecialidad>([]);
  displayedColumnsEspecialidades: string[] = [
    'codigoEspecialidad',
    'nombreEspecialidad',
    'nombreProfeEspecialidad',
    'activo',
    'fechaCreacion',
    'acciones',
  ];

  public modoEdicionEspecialidad: boolean = false;
  public especialidadSeleccionada: IEspecialidad | null = null;

  limpiarEspecialidad() {
    this.especialidadesForm.reset();
    this.especialidadesForm.get('estadoEspecialidad')?.setValue(true);
  }

  crearEspecialidad() {
    if (this.especialidadesForm.invalid) {
      this.especialidadesForm.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: '¿Registrar especialidad?',
      text: '¿Está seguro de registrar esta especialidad?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const especialidad: IEspecialidad = {
          ...this.especialidadesForm.value,
        };
        this._especialidadService
          .registrarEspecialidad(especialidad)
          .subscribe({
            next: () => {
              Swal.fire(
                'Registrado',
                'Especialidad registrada correctamente',
                'success',
              );
              this.especialidadesForm.reset({ estado: true });
              this.listarEspecialidades();
              this.limpiarEspecialidad();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo registrar la especialidad. Intenta nuevamente.';
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

  actualizarEspecialidad() {
    if (this.especialidadesForm.invalid || !this.especialidadSeleccionada) {
      this.especialidadesForm.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: '¿Actualizar Especialidad?',
      text: '¿Está seguro de actualizar esta especialidad?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const especialidad: IEspecialidad = this.especialidadesForm.value;
        this._especialidadService
          .actualizarEspecialidad(
            this.especialidadSeleccionada!.codEspecialidad,
            especialidad,
          )
          .subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Especialidad actualizada correctamente',
                'success',
              );
              this.listarEspecialidades();
              this.limpiarEspecialidad();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo actualizar la especialidad. Intenta nuevamente.';

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

  editarEspecialidad(especialidad: IEspecialidad) {
    this.modoEdicionEspecialidad = true;
    this.especialidadSeleccionada = especialidad;
    this.especialidadesForm.patchValue(especialidad);
    this.especialidadesForm
      .get('codProfesion')
      ?.setValue(especialidad.profesionRef.codProfesion);
  }

  eliminarEspecialidad(especialidad: IEspecialidad) {
    Swal.fire({
      title: '¿Eliminar especialidad?',
      text: `¿Está seguro de eliminar la especialidad ${especialidad.nombreEspecialidad}?`,
      icon: 'warning',
      iconColor: '#dd1313ff',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      confirmButtonColor: '#dd1313ff',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._especialidadService
          .eliminarEspecialidad(especialidad.codEspecialidad)
          .subscribe({
            next: () => {
              Swal.fire(
                'Eliminado',
                'Especialidad eliminada correctamente',
                'success',
              );
              this.listarEspecialidades();
              this.limpiarEspecialidad();
            },
            error: () =>
              Swal.fire(
                'Error',
                'No se pudo eliminar la especialidad',
                'error',
              ),
          });
      }
    });
  }

  listarEspecialidades() {
    this._especialidadService.getAllEspecialidad().subscribe({
      next: (especialidades) => {
        this.dataSourceEspecialidades.data = especialidades;
        console.log('Especialidades obtenidas:', especialidades);
      },
      error: () => {
        this.dataSourceProfesiones.data = [];
      },
    });
  }
}
