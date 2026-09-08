import {
  AfterViewInit,
  Component,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';

import Swal from 'sweetalert2';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ITipoMuestra } from '../../../models/Mantenimiento/tipoMuestra.models';
import { TipoMuestraService } from '../../../services/mantenimiento/tipoMuestra/tipo-muestra.service';

@Component({
  selector: 'app-tipo-muestra',

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],

  templateUrl: './tipo-muestra.component.html',
  styleUrl: './tipo-muestra.component.scss',
})
export class TipoMuestraComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);

  private readonly _tipoMuestraService = inject(TipoMuestraService);

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  public formTipoMuestra: FormGroup = this._fb.group({
    codTipoMuestra: [null],
    nombreTipoMuestra: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    ],
    descripcionTipoMuestra: ['', [Validators.maxLength(250)]],
    estado: [true, Validators.required],
  });

  // ==========================================================
  // TABLA
  // ==========================================================

  @ViewChild('MatPaginatorTipoMuestra')
  paginatorTipoMuestra!: MatPaginator;

  private todosLosTiposMuestra: ITipoMuestra[] = [];

  public dataSourceTipoMuestra = new MatTableDataSource<ITipoMuestra>();

  public columnasTablaTipoMuestra: string[] = [
    'codigo',
    'nombre',
    'descripcion',
    'estado',
    'accion',
  ];

  public terminoBusqueda = new FormControl('');

  // ==========================================================
  // EDICIÓN
  // ==========================================================

  public modoEdicion = false;

  public tipoMuestraSeleccionado: ITipoMuestra | null = null;

  public filaSeleccionadaIndex: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.listarTiposMuestra();
  }

  ngAfterViewInit(): void {
    this.dataSourceTipoMuestra.paginator = this.paginatorTipoMuestra;
  }

  // ==========================================================
  // UTILIDAD DE ESTILO
  // ==========================================================

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  // ==========================================================
  // LISTAR
  // ==========================================================

  listarTiposMuestra(): void {
    this._tipoMuestraService.getTiposMuestra().subscribe({
      next: (tiposMuestra) => {
        this.todosLosTiposMuestra = tiposMuestra;

        this.dataSourceTipoMuestra.data = tiposMuestra;
      },

      error: () => {
        this.todosLosTiposMuestra = [];

        this.dataSourceTipoMuestra.data = [];

        Swal.fire(
          'Error',
          'No se pudieron cargar los tipos de muestra',
          'error',
        );
      },
    });
  }

  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  buscarTiposMuestra(): void {
    const termino = this.terminoBusqueda.value?.trim().toLowerCase() ?? '';

    this.dataSourceTipoMuestra.data = this.todosLosTiposMuestra;

    if (!termino) {
      this.dataSourceTipoMuestra.filter = '';
    } else {
      this.dataSourceTipoMuestra.filter = termino;
    }

    if (this.dataSourceTipoMuestra.paginator) {
      this.dataSourceTipoMuestra.paginator.firstPage();
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.setValue('');
    this.buscarTiposMuestra();
  }

  // ==========================================================
  // CONFIRMAR REGISTRO
  // ==========================================================

  guardarTipoMuestra(): void {
    if (this.formTipoMuestra.invalid) {
      this.formTipoMuestra.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Registrar tipo de muestra?',
      text: '¿Está seguro de registrar este tipo de muestra?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.crearTipoMuestra();
      }
    });
  }

  // ==========================================================
  // CREAR
  // ==========================================================

  crearTipoMuestra(): void {
    const tipoMuestra: ITipoMuestra = {
      nombreTipoMuestra: this.formTipoMuestra.get('nombreTipoMuestra')?.value,

      descripcionTipoMuestra:
        this.formTipoMuestra.get('descripcionTipoMuestra')?.value ?? '',

      estadoTipoMuestra: this.formTipoMuestra.get('estado')?.value
        ? 'ACTIVO'
        : 'INACTIVO',
    };

    this._tipoMuestraService.registrarTipoMuestra(tipoMuestra).subscribe({
      next: () => {
        Swal.fire(
          'Registrado',
          'Tipo de muestra registrado correctamente',
          'success',
        );

        this.cancelarEdicion();
        this.listarTiposMuestra();
      },

      error: (err) => {
        const mensaje =
          err?.error?.msg ||
          err?.message ||
          'No se pudo registrar el tipo de muestra';

        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  // ==========================================================
  // SELECCIONAR PARA EDICIÓN
  // ==========================================================

  editarTipoMuestra(tipoMuestra: ITipoMuestra, index: number): void {
    this.modoEdicion = true;
    this.tipoMuestraSeleccionado = tipoMuestra;
    this.filaSeleccionadaIndex = index;

    this.formTipoMuestra.patchValue({
      codTipoMuestra: tipoMuestra.codTipoMuestra,
      nombreTipoMuestra: tipoMuestra.nombreTipoMuestra,
      descripcionTipoMuestra: tipoMuestra.descripcionTipoMuestra ?? '',
      estado: tipoMuestra.estadoTipoMuestra === 'ACTIVO',
    });
  }

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  actualizarTipoMuestra(): void {
    if (this.formTipoMuestra.invalid || !this.tipoMuestraSeleccionado?._id) {
      this.formTipoMuestra.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Actualizar tipo de muestra?',
      text: '¿Está seguro de actualizar este tipo de muestra?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const tipoMuestra: ITipoMuestra = {
        nombreTipoMuestra: this.formTipoMuestra.get('nombreTipoMuestra')?.value,
        descripcionTipoMuestra:
          this.formTipoMuestra.get('descripcionTipoMuestra')?.value ?? '',
        estadoTipoMuestra: this.formTipoMuestra.get('estado')?.value
          ? 'ACTIVO'
          : 'INACTIVO',
      };

      this._tipoMuestraService
        .actualizarTipoMuestra(this.tipoMuestraSeleccionado!._id!, tipoMuestra)
        .subscribe({
          next: () => {
            Swal.fire(
              'Actualizado',
              'Tipo de muestra actualizado correctamente',
              'success',
            );

            this.cancelarEdicion();
            this.listarTiposMuestra();
          },

          error: (err) => {
            const mensaje =
              err?.error?.msg ||
              err?.message ||
              'No se pudo actualizar el tipo de muestra';

            Swal.fire({
              title: 'Error',
              text: mensaje,
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
    });
  }

  // ==========================================================
  // NUEVO / CANCELAR EDICIÓN
  // ==========================================================

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.tipoMuestraSeleccionado = null;
    this.filaSeleccionadaIndex = null;
    this.formTipoMuestra.reset({
      codTipoMuestra: null,
      nombreTipoMuestra: '',
      descripcionTipoMuestra: '',
      estado: true,
    });
  }
}
