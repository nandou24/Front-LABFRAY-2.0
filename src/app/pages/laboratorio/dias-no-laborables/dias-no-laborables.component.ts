import {
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';

import {
  EstadoDiaNoLaborable,
  IDiaNoLaborable,
  TipoDiaNoLaborable,
} from '../../../models/Mantenimiento/diaNoLaborable.models';
import { DiaNoLaborableService } from '../../../services/mantenimiento/diaNoLaborable/dia-no-laborable.service';

@Component({
  selector: 'app-dias-no-laborables',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './dias-no-laborables.component.html',
  styleUrl: './dias-no-laborables.component.scss',
})
export class DiasNoLaborablesComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _diaNoLaborableService = inject(DiaNoLaborableService);

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  public modoEdicion = false;
  public diaSeleccionadoId: string | null = null;
  public guardando = false;
  public cargando = false;

  public readonly tipos: {
    value: TipoDiaNoLaborable;
    label: string;
  }[] = [
    { value: 'FERIADO_NACIONAL', label: 'Feriado nacional' },
    { value: 'FERIADO_LOCAL', label: 'Feriado local' },
    { value: 'CIERRE_INSTITUCIONAL', label: 'Cierre institucional' },
    { value: 'OTRO', label: 'Otro día no laborable' },
  ];

  public readonly estados: {
    value: EstadoDiaNoLaborable | '';
    label: string;
  }[] = [
    { value: '', label: 'Todos' },
    { value: 'ACTIVO', label: 'Activos' },
    { value: 'INACTIVO', label: 'Inactivos' },
  ];

  public readonly myFormDiaNoLaborable = this._fb.group({
    fecha: [null as Date | null, [Validators.required]],
    descripcion: ['', [Validators.required, Validators.maxLength(180)]],
    tipo: ['FERIADO_NACIONAL' as TipoDiaNoLaborable, [Validators.required]],
    observacion: ['', [Validators.maxLength(500)]],
    estadoDiaNoLaborable: [true, [Validators.required]],
  });

  public readonly anioFiltro = new FormControl(new Date().getFullYear(), {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1900), Validators.max(2200)],
  });

  public readonly estadoFiltro = new FormControl<EstadoDiaNoLaborable | ''>('', {
    nonNullable: true,
  });

  public readonly terminoBusqueda = new FormControl('', {
    nonNullable: true,
  });

  public readonly columnas: string[] = [
    'fecha',
    'descripcion',
    'tipo',
    'estado',
    'acciones',
  ];

  public readonly dataSource = new MatTableDataSource<IDiaNoLaborable>();

  ngOnInit(): void {
    this.cargarDias();

    this.terminoBusqueda.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => this.cargarDias());

    this.anioFiltro.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.cargarDias());

    this.estadoFiltro.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.cargarDias());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  // ====== Cargar calendario ======

  public cargarDias(): void {
    if (this.anioFiltro.invalid) {
      return;
    }

    this.cargando = true;

    this._diaNoLaborableService
      .getDiasNoLaborables({
        anio: this.anioFiltro.value,
        estado: this.estadoFiltro.value,
        search: this.terminoBusqueda.value,
      })
      .subscribe({
        next: (dias) => {
          this.dataSource.data = dias;
          this.cargando = false;

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }
        },
        error: (error) => {
          this.cargando = false;

          Swal.fire({
            title: 'ERROR!',
            text: error.error?.msg ?? 'No se pudo cargar el calendario.',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
  }

  // ====== Guardar ======

  public guardar(): void {
    if (this.myFormDiaNoLaborable.invalid) {
      this.myFormDiaNoLaborable.markAllAsTouched();
      return;
    }

    const body = this.construirBody();

    if (!body) {
      Swal.fire({
        title: 'Fecha no válida',
        text: 'Seleccione una fecha válida.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    this.guardando = true;

    const peticion =
      this.modoEdicion && this.diaSeleccionadoId
        ? this._diaNoLaborableService.actualizarDiaNoLaborable(
            this.diaSeleccionadoId,
            body,
          )
        : this._diaNoLaborableService.crearDiaNoLaborable(body);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;

        const anioGuardado = Number(body.fecha.slice(0, 4));
        this.anioFiltro.setValue(anioGuardado, { emitEvent: false });

        Swal.fire({
          title: 'Correcto',
          text:
            respuesta.msg ??
            (this.modoEdicion
              ? 'Día no laborable actualizado correctamente.'
              : 'Día no laborable registrado correctamente.'),
          icon: 'success',
          confirmButtonText: 'Ok',
        });

        this.nuevo();
        this.cargarDias();
      },
      error: (error) => {
        this.guardando = false;

        Swal.fire({
          title: 'ERROR!',
          text: error.error?.msg ?? 'No se pudo guardar el día no laborable.',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  // ====== Editar ======

  public editar(dia: IDiaNoLaborable): void {
    if (!dia._id) {
      return;
    }

    this.diaSeleccionadoId = dia._id;
    this.modoEdicion = true;

    this.myFormDiaNoLaborable.reset({
      fecha: this.isoAFechaLocal(dia.fecha),
      descripcion: dia.descripcion,
      tipo: dia.tipo,
      observacion: dia.observacion ?? '',
      estadoDiaNoLaborable: dia.estadoDiaNoLaborable === 'ACTIVO',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ====== Nuevo / cancelar ======

  public nuevo(): void {
    this.diaSeleccionadoId = null;
    this.modoEdicion = false;

    this.myFormDiaNoLaborable.reset({
      fecha: null,
      descripcion: '',
      tipo: 'FERIADO_NACIONAL',
      observacion: '',
      estadoDiaNoLaborable: true,
    });
  }

  // ====== Cambiar estado ======

  public async cambiarEstado(dia: IDiaNoLaborable): Promise<void> {
    if (!dia._id) {
      return;
    }

    const nuevoEstado: EstadoDiaNoLaborable =
      dia.estadoDiaNoLaborable === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    const confirmacion = await Swal.fire({
      title:
        nuevoEstado === 'ACTIVO'
          ? '¿Activar día no laborable?'
          : '¿Inactivar día no laborable?',
      text:
        nuevoEstado === 'INACTIVO'
          ? 'Al inactivarlo dejará de excluirse del cálculo de plazos.'
          : 'Al activarlo se excluirá del cálculo de plazos.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: nuevoEstado === 'ACTIVO' ? 'Activar' : 'Inactivar',
      cancelButtonText: 'Cancelar',
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    this._diaNoLaborableService
      .cambiarEstadoDiaNoLaborable(dia._id, nuevoEstado)
      .subscribe({
        next: () => this.cargarDias(),
        error: (error) => {
          Swal.fire({
            title: 'ERROR!',
            text: error.error?.msg ?? 'No se pudo cambiar el estado.',
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
  }

  // ====== Presentación ======

  public etiquetaTipo(tipo: TipoDiaNoLaborable | string): string {
    return this.tipos.find((item) => item.value === tipo)?.label ?? tipo;
  }

  public formatearFecha(fecha: string): string {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? '');

    if (!coincidencia) {
      return fecha || '-';
    }

    return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  }

  // ====== Body ======

  private construirBody(): IDiaNoLaborable | null {
    const valor = this.myFormDiaNoLaborable.getRawValue();
    const fecha = this.fechaAISO(valor.fecha);

    if (!fecha) {
      return null;
    }

    return {
      fecha,
      descripcion: String(valor.descripcion ?? '').trim(),
      tipo: valor.tipo as TipoDiaNoLaborable,
      observacion: String(valor.observacion ?? '').trim(),
      estadoDiaNoLaborable:
        valor.estadoDiaNoLaborable === true ? 'ACTIVO' : 'INACTIVO',
    };
  }

  private fechaAISO(valor: Date | string | null): string | null {
    if (!valor) {
      return null;
    }

    if (typeof valor === 'string') {
      return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : null;
    }

    if (!(valor instanceof Date) || !Number.isFinite(valor.getTime())) {
      return null;
    }

    return [
      valor.getFullYear(),
      String(valor.getMonth() + 1).padStart(2, '0'),
      String(valor.getDate()).padStart(2, '0'),
    ].join('-');
  }

  private isoAFechaLocal(fecha: string): Date | null {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? '');

    if (!coincidencia) {
      return null;
    }

    return new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3]),
    );
  }
}
