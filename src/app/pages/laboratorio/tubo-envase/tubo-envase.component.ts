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
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ITuboEnvase } from '../../../models/Mantenimiento/tuboEnvase.models';
import { TuboEnvaseService } from '../../../services/mantenimiento/tuboEnvase/tubo-envase.service';

@Component({
  selector: 'app-tubo-envase',

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
    MatSelectModule,
    MatTooltipModule,
  ],

  templateUrl: './tubo-envase.component.html',
  styleUrl: './tubo-envase.component.scss',
})
export class TuboEnvaseComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);

  private readonly _tuboEnvaseService = inject(TuboEnvaseService);

  // ==========================================================
  // UNIDADES DE CAPACIDAD
  // ==========================================================

  public unidadesCapacidad = ['uL', 'mL', 'L'];

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  public formTuboEnvase: FormGroup = this._fb.group({
    codTuboEnvase: [null],

    nombreTuboEnvase: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],

    descripcionTuboEnvase: ['', [Validators.maxLength(250)]],

    color: ['', [Validators.maxLength(50)]],

    aditivo: ['', [Validators.maxLength(100)]],

    capacidad: [null, [Validators.min(0)]],

    unidadCapacidad: [null],

    estado: [true, Validators.required],
  });

  // ==========================================================
  // TABLA
  // ==========================================================

  @ViewChild('MatPaginatorTuboEnvase')
  paginatorTuboEnvase!: MatPaginator;

  private todosLosTubosEnvases: ITuboEnvase[] = [];

  public dataSourceTuboEnvase = new MatTableDataSource<ITuboEnvase>();

  public columnasTablaTuboEnvase: string[] = [
    'codigo',
    'nombre',
    'color',
    'aditivo',
    'capacidad',
    'estado',
    'accion',
  ];

  public terminoBusqueda = new FormControl('');

  // ==========================================================
  // EDICIÓN
  // ==========================================================

  public modoEdicion = false;

  public tuboEnvaseSeleccionado: ITuboEnvase | null = null;

  public filaSeleccionadaIndex: number | null = null;

  constructor() {}

  ngOnInit(): void {
    this.listarTubosEnvases();
  }

  ngAfterViewInit(): void {
    this.dataSourceTuboEnvase.paginator = this.paginatorTuboEnvase;
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

  listarTubosEnvases(): void {
    this._tuboEnvaseService.getTubosEnvases().subscribe({
      next: (tubosEnvases) => {
        this.todosLosTubosEnvases = tubosEnvases;

        this.dataSourceTuboEnvase.data = tubosEnvases;
      },

      error: () => {
        this.todosLosTubosEnvases = [];

        this.dataSourceTuboEnvase.data = [];

        Swal.fire('Error', 'No se pudieron cargar los tubos/envases', 'error');
      },
    });
  }

  // ==========================================================
  // BÚSQUEDA
  // ==========================================================

  buscarTubosEnvases(): void {
    const termino = this.terminoBusqueda.value?.trim().toLowerCase() ?? '';

    this.dataSourceTuboEnvase.data = this.todosLosTubosEnvases;

    if (!termino) {
      this.dataSourceTuboEnvase.filter = '';
    } else {
      this.dataSourceTuboEnvase.filter = termino;
    }

    if (this.dataSourceTuboEnvase.paginator) {
      this.dataSourceTuboEnvase.paginator.firstPage();
    }
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.setValue('');
    this.buscarTubosEnvases();
  }

  // ==========================================================
  // CONFIRMAR REGISTRO
  // ==========================================================

  guardarTuboEnvase(): void {
    if (this.formTuboEnvase.invalid) {
      this.formTuboEnvase.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Registrar tubo/envase?',
      text: '¿Está seguro de registrar este tubo/envase?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.crearTuboEnvase();
      }
    });
  }

  // ==========================================================
  // CREAR
  // ==========================================================

  crearTuboEnvase(): void {
    const tuboEnvase = this.construirBody();

    this._tuboEnvaseService.registrarTuboEnvase(tuboEnvase).subscribe({
      next: () => {
        Swal.fire(
          'Registrado',
          'Tubo/envase registrado correctamente',
          'success',
        );

        this.cancelarEdicion();
        this.listarTubosEnvases();
      },

      error: (err) => {
        const mensaje =
          err?.error?.msg ||
          err?.message ||
          'No se pudo registrar el tubo/envase';

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

  editarTuboEnvase(tuboEnvase: ITuboEnvase, index: number): void {
    this.modoEdicion = true;

    this.tuboEnvaseSeleccionado = tuboEnvase;

    this.filaSeleccionadaIndex = index;

    this.formTuboEnvase.patchValue({
      codTuboEnvase: tuboEnvase.codTuboEnvase,

      nombreTuboEnvase: tuboEnvase.nombreTuboEnvase,

      descripcionTuboEnvase: tuboEnvase.descripcionTuboEnvase ?? '',

      color: tuboEnvase.color ?? '',

      aditivo: tuboEnvase.aditivo ?? '',

      capacidad: tuboEnvase.capacidad ?? null,

      unidadCapacidad: tuboEnvase.unidadCapacidad ?? null,

      estado: tuboEnvase.estadoTuboEnvase === 'ACTIVO',
    });
  }

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  actualizarTuboEnvase(): void {
    if (this.formTuboEnvase.invalid || !this.tuboEnvaseSeleccionado?._id) {
      this.formTuboEnvase.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: '¿Actualizar tubo/envase?',
      text: '¿Está seguro de actualizar este tubo/envase?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const tuboEnvase = this.construirBody();

      this._tuboEnvaseService
        .actualizarTuboEnvase(this.tuboEnvaseSeleccionado!._id!, tuboEnvase)
        .subscribe({
          next: () => {
            Swal.fire(
              'Actualizado',
              'Tubo/envase actualizado correctamente',
              'success',
            );

            this.cancelarEdicion();
            this.listarTubosEnvases();
          },

          error: (err) => {
            const mensaje =
              err?.error?.msg ||
              err?.message ||
              'No se pudo actualizar el tubo/envase';

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
  // CONSTRUIR BODY
  // ==========================================================

  private construirBody(): ITuboEnvase {
    const capacidad = this.formTuboEnvase.get('capacidad')?.value;

    return {
      nombreTuboEnvase: this.formTuboEnvase.get('nombreTuboEnvase')?.value,

      descripcionTuboEnvase:
        this.formTuboEnvase.get('descripcionTuboEnvase')?.value ?? '',

      color: this.formTuboEnvase.get('color')?.value ?? '',

      aditivo: this.formTuboEnvase.get('aditivo')?.value ?? '',

      capacidad:
        capacidad === '' || capacidad === null || capacidad === undefined
          ? null
          : Number(capacidad),

      unidadCapacidad:
        this.formTuboEnvase.get('unidadCapacidad')?.value ?? null,

      estadoTuboEnvase: this.formTuboEnvase.get('estado')?.value
        ? 'ACTIVO'
        : 'INACTIVO',
    };
  }

  // ==========================================================
  // NUEVO / CANCELAR EDICIÓN
  // ==========================================================

  cancelarEdicion(): void {
    this.modoEdicion = false;

    this.tuboEnvaseSeleccionado = null;

    this.filaSeleccionadaIndex = null;

    this.formTuboEnvase.reset({
      codTuboEnvase: null,
      nombreTuboEnvase: '',
      descripcionTuboEnvase: '',
      color: '',
      aditivo: '',
      capacidad: null,
      unidadCapacidad: null,
      estado: true,
    });
  }
}
