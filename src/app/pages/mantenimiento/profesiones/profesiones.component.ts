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

@Component({
  selector: 'app-profesiones',
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
  }
  private _fb = inject(FormBuilder);
  private _profesionService = inject(ProfesionService);

  profesionesForm: FormGroup = this._fb.group({
    nombreProfesion: ['', Validators.required],
    estadoProfesion: [true, Validators.required],
  });

  especialidadesForm: FormGroup = this._fb.group({
    codProfEspecialidad: [null, Validators.required],
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

  seSeleccionoCotizacion: boolean = false;

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
      title: '¿Registrar rol?',
      text: '¿Está seguro de registrar este rol?',
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
            Swal.fire('Registrado', 'Rol registrado correctamente', 'success');
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
      title: '¿Actualizar ruta?',
      text: '¿Está seguro de actualizar esta ruta?',
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
                'No se pudo registrar la profesión. Intenta nuevamente.';

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
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
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
            },
            error: () =>
              Swal.fire('Error', 'No se pudo eliminar la profesión', 'error'),
          });
      }
    });
  }

  listarProfesiones() {
    this._profesionService.getAllProfesions().subscribe({
      next: (profesiones) => {
        this.dataSourceProfesiones.data = profesiones;
        this.profesionesDisponibles = profesiones;
      },
      error: () => {
        this.dataSourceProfesiones.data = [];
      },
    });
  }

  //Especialidad
  dataSourceEspecialidades = new MatTableDataSource<FormGroup>([]);
  displayedColumnsEspecialidades: string[] = [
    'codigoEspecialidad',
    'nombreEspecialidad',
    'activo',
    'fechaCreacion',
    'acciones',
  ];

  limpiarEspecialidad() {
    this.especialidadesForm.reset();
    this.especialidadesForm.get('estadoEspecialidad')?.setValue(true);
  }

  crearEspecialidad() {}

  actualizarEspecialidad() {}
}
