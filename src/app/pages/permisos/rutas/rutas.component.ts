import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { RutasService } from '../../../services/permisos/rutas/rutas.service';
import { IRuta } from '../../../models/permisos/rutas.models';

@Component({
  selector: 'app-rutas',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSlideToggle,
  ],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.scss',
})
export class RutasComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _rutasService = inject(RutasService);

  public formRuta: FormGroup = this._fb.group({
    codRuta: [null],
    nombreRuta: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    nombreMostrar: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    descripcionRuta: [''],
    urlRuta: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    iconoRuta: ['', [Validators.required]],
    estado: [true, Validators.required],
  });

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  public rutas: IRuta[] = [];
  private rutasOriginal: IRuta[] = [];
  public modoEdicion: boolean = false;
  public terminoBusqueda: string = '';
  public rutaSeleccionada: IRuta | null = null;

  constructor() {}

  ngOnInit(): void {
    this.listarRutas();
  }

  listarRutas() {
    this._rutasService.getAllRutas().subscribe({
      next: (rutas) => {
        this.rutas = rutas;
        this.rutasOriginal = rutas;
      },
      error: () => {
        this.rutas = [];
        this.rutasOriginal = [];
      },
    });
  }

  buscarRutas() {
    const termino = this.terminoBusqueda.trim().toLowerCase();
    if (!termino) {
      this.rutas = [...this.rutasOriginal];
      return;
    }
    this.rutas = this.rutasOriginal.filter(
      (ruta) =>
        //ruta.codRuta?.toLowerCase().includes(termino) ||
        ruta.nombreRuta?.toLowerCase().includes(termino) ||
        ruta.urlRuta?.toLowerCase().includes(termino) ||
        ruta.nombreMostrar?.toLowerCase().includes(termino) ||
        ruta.descripcionRuta?.toLowerCase().includes(termino),
    );
  }

  guardarRuta() {
    if (this.formRuta.invalid) {
      this.formRuta.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Registrar ruta?',
      text: '¿Está seguro de registrar esta ruta?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.crearRuta();
      }
    });
  }

  crearRuta() {
    const ruta: IRuta = this.formRuta.value;
    this._rutasService.registrarRuta(ruta).subscribe({
      next: () => {
        Swal.fire('Registrado', 'Ruta registrada correctamente', 'success');
        this.formRuta.reset({ estado: true });
        this.listarRutas();
      },
      error: (err) => {
        const mensaje =
          err?.error?.msg ||
          err.message ||
          'No se pudo registrar la ruta. Intenta nuevamente.';

        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  actualizarRuta() {
    if (this.formRuta.invalid || !this.rutaSeleccionada) {
      this.formRuta.markAllAsTouched();
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
        const ruta: IRuta = this.formRuta.value;
        this._rutasService
          .actualizarRuta(this.rutaSeleccionada!.codRuta, ruta)
          .subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Ruta actualizada correctamente',
                'success',
              );
              this.cancelarEdicion();
              this.listarRutas();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo registrar la ruta. Intenta nuevamente.';

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

  editarRuta(ruta: IRuta) {
    this.modoEdicion = true;
    this.rutaSeleccionada = ruta;
    this.formRuta.patchValue(ruta);
  }

  eliminarRuta(ruta: IRuta) {
    Swal.fire({
      title: '¿Eliminar ruta?',
      text: `¿Está seguro de eliminar la ruta ${ruta.nombreRuta}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._rutasService.eliminarRuta(ruta.codRuta).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Ruta eliminada correctamente', 'success');
            this.listarRutas();
          },
          error: () =>
            Swal.fire('Error', 'No se pudo eliminar la ruta', 'error'),
        });
      }
    });
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.rutaSeleccionada = null;
    this.formRuta.reset({ estado: true });
  }

  onBuscarInput(event: any) {
    this.terminoBusqueda = event.target.value;
    this.buscarRutas();
  }
}
