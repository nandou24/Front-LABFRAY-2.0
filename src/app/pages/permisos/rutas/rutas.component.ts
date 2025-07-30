import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
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
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
    MatPaginatorModule,
  ],
  templateUrl: './rutas.component.html',
  styleUrl: './rutas.component.scss',
})
export class RutasComponent implements OnInit, AfterViewInit {
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

  @ViewChild('MatPaginatorRutas') paginatorRutas!: MatPaginator;

  // Array para mantener todos los datos iniciales en memoria
  private todasLasRutas: IRuta[] = [];
  public dataSourceRutas = new MatTableDataSource<IRuta>();
  public columnasTablaRutas: string[] = ['codigo', 'nombre', 'url', 'estado', 'accion'];
  public modoEdicion: boolean = false;
  public rutaSeleccionada: IRuta | null = null;
  public filaSeleccionadaIndex: number | null = null;
  public terminoBusqueda = new FormControl('');

  constructor() {}

  ngOnInit(): void {
    this.listarRutas();
  }

  ngAfterViewInit() {
    this.dataSourceRutas.paginator = this.paginatorRutas;
  }

  listarRutas() {
    this._rutasService.getAllRutas().subscribe({
      next: (rutas) => {
        this.todasLasRutas = rutas; // Guardar todos los datos en memoria
        this.dataSourceRutas.data = rutas;
      },
      error: () => {
        this.todasLasRutas = [];
        this.dataSourceRutas.data = [];
      },
    });
  }

  buscarRutas() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todos los datos iniciales
      this.dataSourceRutas.data = this.todasLasRutas;
      this.dataSourceRutas.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceRutas.data = this.todasLasRutas; // Asegurar que tiene todos los datos
      this.dataSourceRutas.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceRutas.paginator) {
      this.dataSourceRutas.paginator.firstPage();
    }
  }

  limpiarBusqueda() {
    this.terminoBusqueda.setValue('');
    this.buscarRutas();
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

  editarRuta(ruta: IRuta, index: number) {
    this.modoEdicion = true;
    this.rutaSeleccionada = ruta;
    this.filaSeleccionadaIndex = index;
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
    this.filaSeleccionadaIndex = null; // Resetear la fila seleccionada
    this.formRuta.reset({ estado: true });
    this.terminoBusqueda.setValue(''); // Limpiar el campo de búsqueda
    this.buscarRutas(); // Volver a cargar todos los datos
  }

  onBuscarInput(event: any) {
    this.buscarRutas();
  }
}
