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
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import Swal from 'sweetalert2';

import {
  EstadoLaboratorioReferencia,
  IContactoLaboratorioReferencia,
  ILaboratorioReferencia,
  TipoContactoLaboratorioReferencia,
} from '../../../models/Mantenimiento/laboratorioReferencia.models';

import { LaboratorioReferenciaService } from '../../../services/mantenimiento/laboratorioReferencia/laboratorio-referencia.service';

@Component({
  selector: 'app-mant-laboratorio-referencia',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './laboratorio-referencia.component.html',
  styleUrl: './laboratorio-referencia.component.scss',
})
export class LaboratorioReferenciaComponent implements OnInit, AfterViewInit {
  private readonly _fb = inject(FormBuilder);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _laboratorioReferenciaService = inject(
    LaboratorioReferenciaService,
  );

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  // ====== Estado del componente ======

  public formSubmitted = false;

  public laboratorioSeleccionadoId: string | null = null;

  public modoEdicion = false;

  // ====== Tipos de contacto ======

  public tiposContacto: {
    value: TipoContactoLaboratorioReferencia;
    label: string;
  }[] = [
    {
      value: 'CENTRAL_PROGRAMACION',
      label: 'Central / Programación',
    },
    {
      value: 'AREA_LABORATORIO',
      label: 'Área de Laboratorio',
    },
    {
      value: 'SECTORISTA',
      label: 'Sectorista',
    },
    {
      value: 'FACTURACION',
      label: 'Facturación',
    },
    {
      value: 'OTRO',
      label: 'Otro',
    },
  ];

  // ====== Formulario ======

  public myFormLaboratorioReferencia: FormGroup = this._fb.group({
    codLaboratorioReferencia: [
      {
        value: '',
        disabled: true,
      },
    ],

    nombreLaboratorio: ['', [Validators.required, Validators.maxLength(150)]],

    razonSocial: ['', [Validators.maxLength(200)]],

    ruc: ['', [Validators.pattern(/^[0-9]{11}$/)]],

    codigoCliente: ['', [Validators.maxLength(50)]],

    direccion: ['', [Validators.maxLength(250)]],

    contactos: this._fb.array([]),

    observacion: ['', [Validators.maxLength(500)]],

    // En el formulario usamos boolean.
    estadoLaboratorioReferencia: [true, [Validators.required]],
  });

  // ====== Contactos ======

  get contactos(): FormArray {
    return this.myFormLaboratorioReferencia.get('contactos') as FormArray;
  }

  private crearContacto(contacto?: IContactoLaboratorioReferencia): FormGroup {
    return this._fb.group({
      _id: [contacto?._id ?? null],

      tipoContacto: [contacto?.tipoContacto ?? '', [Validators.required]],

      nombreContacto: [
        contacto?.nombreContacto ?? '',
        [Validators.maxLength(150)],
      ],

      cargo: [contacto?.cargo ?? '', [Validators.maxLength(100)]],

      telefono: [
        contacto?.telefono ?? '',
        [Validators.pattern(/^[0-9+\-() ]{7,20}$/)],
      ],

      correo: [
        contacto?.correo ?? '',
        [Validators.email, Validators.maxLength(150)],
      ],

      principal: [contacto?.principal ?? false],

      observacion: [contacto?.observacion ?? '', [Validators.maxLength(250)]],
    });
  }

  public agregarContacto(): void {
    this.contactos.push(this.crearContacto());
  }

  public eliminarContacto(index: number): void {
    this.contactos.removeAt(index);
  }

  // ====== Contacto principal ======

  public cambiarPrincipal(index: number): void {
    const contacto = this.contactos.at(index) as FormGroup;

    const principal = contacto.get('principal')?.value === true;

    if (!principal) {
      return;
    }

    const tipoContacto = contacto.get('tipoContacto')?.value;

    if (!tipoContacto) {
      contacto.get('principal')?.setValue(false);

      Swal.fire({
        title: 'Seleccione el tipo de contacto',
        text: 'Antes de marcarlo como principal debe seleccionar el tipo de contacto.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return;
    }

    this.contactos.controls.forEach((contactoControl, contactoIndex) => {
      if (contactoIndex === index) {
        return;
      }

      const mismoTipo =
        contactoControl.get('tipoContacto')?.value === tipoContacto;

      if (mismoTipo) {
        contactoControl.get('principal')?.setValue(false, {
          emitEvent: false,
        });
      }
    });
  }

  public cambiarTipoContacto(index: number): void {
    const contacto = this.contactos.at(index) as FormGroup;

    const principal = contacto.get('principal')?.value === true;

    if (!principal) {
      return;
    }

    this.cambiarPrincipal(index);
  }

  // ====== Validar contactos ======

  private validarContactos(): boolean {
    const principales = new Set<TipoContactoLaboratorioReferencia>();

    for (let i = 0; i < this.contactos.length; i++) {
      const contacto = this.contactos.at(i) as FormGroup;
      const tipoContacto = contacto.get('tipoContacto')
        ?.value as TipoContactoLaboratorioReferencia;
      const telefono = contacto.get('telefono')?.value?.trim() ?? '';
      const correo = contacto.get('correo')?.value?.trim() ?? '';
      const principal = contacto.get('principal')?.value === true;

      // ====== Teléfono o correo obligatorio ======

      if (!telefono && !correo) {
        Swal.fire({
          title: 'Contacto incompleto',
          text: `El contacto ${i + 1} debe tener al menos un teléfono o correo electrónico.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }

      // ====== Principal requiere tipo ======

      if (principal && !tipoContacto) {
        Swal.fire({
          title: 'Contacto principal',
          text: `Seleccione el tipo de contacto en el contacto ${i + 1}.`,
          icon: 'warning',
          confirmButtonText: 'Ok',
        });

        return false;
      }

      // ====== Un principal por tipo ======

      if (principal) {
        if (principales.has(tipoContacto)) {
          Swal.fire({
            title: 'Contactos principales',
            text: `Existe más de un contacto principal para ${this.obtenerNombreTipoContacto(
              tipoContacto,
            )}.`,
            icon: 'warning',
            confirmButtonText: 'Ok',
          });

          return false;
        }

        principales.add(tipoContacto);
      }
    }

    return true;
  }

  public obtenerNombreTipoContacto(
    tipo: TipoContactoLaboratorioReferencia | string,
  ): string {
    const tipoEncontrado = this.tiposContacto.find(
      (item) => item.value === tipo,
    );

    return tipoEncontrado?.label ?? tipo;
  }

  // ====== Tabla ======

  public columnasLaboratorios: string[] = [
    'codigo',
    'nombre',
    'codigoCliente',
    'estado',
  ];

  public dataSourceLaboratorios =
    new MatTableDataSource<ILaboratorioReferencia>();

  public terminoBusqueda = new FormControl('', {
    nonNullable: true,
  });

  ngOnInit(): void {
    this.cargarLaboratorios();

    this.terminoBusqueda.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((termino) => {
        this.buscarLaboratorios(termino);
      });
  }

  ngAfterViewInit(): void {
    this.dataSourceLaboratorios.paginator = this.paginator;
  }

  // ====== Cargar laboratorios ======

  private cargarLaboratorios(): void {
    this._laboratorioReferenciaService.getLaboratoriosReferencia().subscribe({
      next: (laboratorios) => {
        this.dataSourceLaboratorios.data = laboratorios;

        if (this.dataSourceLaboratorios.paginator) {
          this.dataSourceLaboratorios.paginator.firstPage();
        }
      },

      error: (error) => {
        console.error('Error al cargar laboratorios de referencia:', error);

        Swal.fire({
          title: 'ERROR!',
          text:
            error.error?.msg ??
            'Error al cargar los laboratorios de referencia.',
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  // ====== Buscar laboratorios ======

  private buscarLaboratorios(termino: string): void {
    const terminoNormalizado = termino.trim();

    if (terminoNormalizado.length === 0) {
      this.cargarLaboratorios();
      return;
    }

    this._laboratorioReferenciaService
      .buscarLaboratoriosReferencia(terminoNormalizado)
      .subscribe({
        next: (laboratorios) => {
          this.dataSourceLaboratorios.data = laboratorios;

          if (this.dataSourceLaboratorios.paginator) {
            this.dataSourceLaboratorios.paginator.firstPage();
          }
        },

        error: (error) => {
          console.error('Error al buscar laboratorios de referencia:', error);
        },
      });
  }

  // ====== Seleccionar laboratorio ======

  public seleccionarLaboratorio(laboratorio: ILaboratorioReferencia): void {
    this.formSubmitted = false;
    this.modoEdicion = true;
    this.laboratorioSeleccionadoId = laboratorio._id ?? null;
    this.myFormLaboratorioReferencia.patchValue({
      codLaboratorioReferencia: laboratorio.codLaboratorioReferencia ?? '',
      nombreLaboratorio: laboratorio.nombreLaboratorio ?? '',
      razonSocial: laboratorio.razonSocial ?? '',
      ruc: laboratorio.ruc ?? '',
      codigoCliente: laboratorio.codigoCliente ?? '',
      direccion: laboratorio.direccion ?? '',
      observacion: laboratorio.observacion ?? '',
      estadoLaboratorioReferencia:
        laboratorio.estadoLaboratorioReferencia === 'ACTIVO',
    });

    // ====== Reconstruir contactos ======

    this.contactos.clear();

    (laboratorio.contactos ?? []).forEach((contacto) => {
      this.contactos.push(this.crearContacto(contacto));
    });
  }

  // ====== Nuevo laboratorio ======

  public nuevoLaboratorio(): void {
    this.formSubmitted = false;

    this.modoEdicion = false;

    this.laboratorioSeleccionadoId = null;

    this.contactos.clear();

    this.myFormLaboratorioReferencia.reset({
      codLaboratorioReferencia: '',

      nombreLaboratorio: '',

      razonSocial: '',

      ruc: '',

      codigoCliente: '',

      direccion: '',

      observacion: '',

      estadoLaboratorioReferencia: true,
    });
  }

  // ====== Construcción del body ======

  private construirBody(): ILaboratorioReferencia {
    const formValue = this.myFormLaboratorioReferencia.getRawValue();

    const estadoLaboratorioReferencia: EstadoLaboratorioReferencia =
      formValue.estadoLaboratorioReferencia ? 'ACTIVO' : 'INACTIVO';

    return {
      nombreLaboratorio: formValue.nombreLaboratorio?.trim() ?? '',

      razonSocial: formValue.razonSocial?.trim() ?? '',

      ruc: formValue.ruc?.trim() ?? '',

      codigoCliente: formValue.codigoCliente?.trim() ?? '',

      direccion: formValue.direccion?.trim() ?? '',

      contactos: (formValue.contactos ?? []).map(
        (contacto: IContactoLaboratorioReferencia) => ({
          ...(contacto._id
            ? {
                _id: contacto._id,
              }
            : {}),

          tipoContacto: contacto.tipoContacto,

          nombreContacto: contacto.nombreContacto?.trim() ?? '',

          cargo: contacto.cargo?.trim() ?? '',

          telefono: contacto.telefono?.trim() ?? '',

          correo: contacto.correo?.trim() ?? '',

          principal: contacto.principal ?? false,

          observacion: contacto.observacion?.trim() ?? '',
        }),
      ),

      observacion: formValue.observacion?.trim() ?? '',

      estadoLaboratorioReferencia,
    };
  }

  // ====== Registrar ======

  public registrarLaboratorio(): void {
    this.formSubmitted = true;

    if (this.myFormLaboratorioReferencia.invalid) {
      this.myFormLaboratorioReferencia.markAllAsTouched();
      return;
    }

    if (!this.validarContactos()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas registrar este laboratorio de referencia?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();

      this._laboratorioReferenciaService
        .registrarLaboratorioReferencia(body)
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Confirmado',
              text: 'Laboratorio de referencia registrado correctamente.',
              icon: 'success',
              confirmButtonText: 'Ok',
            });

            this.cargarLaboratorios();

            this.nuevoLaboratorio();
          },

          error: (error) => {
            console.error(
              'Error al registrar laboratorio de referencia:',
              error,
            );

            Swal.fire({
              title: 'ERROR!',
              text:
                error.error?.msg ??
                'Error al registrar el laboratorio de referencia.',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
    });
  }

  // ====== Actualizar ======

  public actualizarLaboratorio(): void {
    this.formSubmitted = true;

    if (!this.laboratorioSeleccionadoId) {
      Swal.fire({
        title: 'Laboratorio no seleccionado',
        text: 'Seleccione un laboratorio para actualizar.',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });

      return;
    }

    if (this.myFormLaboratorioReferencia.invalid) {
      this.myFormLaboratorioReferencia.markAllAsTouched();
      return;
    }

    if (!this.validarContactos()) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas actualizar este laboratorio de referencia?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const body = this.construirBody();

      this._laboratorioReferenciaService
        .actualizarLaboratorioReferencia(this.laboratorioSeleccionadoId!, body)
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Confirmado',
              text: 'Laboratorio de referencia actualizado correctamente.',
              icon: 'success',
              confirmButtonText: 'Ok',
            });

            this.cargarLaboratorios();

            this.nuevoLaboratorio();
          },

          error: (error) => {
            console.error(
              'Error al actualizar laboratorio de referencia:',
              error,
            );

            Swal.fire({
              title: 'ERROR!',
              text:
                error.error?.msg ??
                'Error al actualizar el laboratorio de referencia.',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
    });
  }

  // ====== Cambiar estado ======

  public cambiarEstado(laboratorio: ILaboratorioReferencia): void {
    if (!laboratorio._id) {
      return;
    }

    const nuevoEstado: EstadoLaboratorioReferencia =
      laboratorio.estadoLaboratorioReferencia === 'ACTIVO'
        ? 'INACTIVO'
        : 'ACTIVO';

    const accion = nuevoEstado === 'ACTIVO' ? 'activar' : 'inactivar';

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas ${accion} el laboratorio ${laboratorio.nombreLaboratorio}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this._laboratorioReferenciaService
        .cambiarEstadoLaboratorioReferencia(laboratorio._id!, nuevoEstado)
        .subscribe({
          next: () => {
            Swal.fire({
              title: 'Confirmado',
              text:
                nuevoEstado === 'ACTIVO'
                  ? 'Laboratorio activado correctamente.'
                  : 'Laboratorio inactivado correctamente.',
              icon: 'success',
              confirmButtonText: 'Ok',
            });

            this.cargarLaboratorios();

            if (this.laboratorioSeleccionadoId === laboratorio._id) {
              this.nuevoLaboratorio();
            }
          },

          error: (error) => {
            console.error('Error al cambiar estado del laboratorio:', error);

            Swal.fire({
              title: 'ERROR!',
              text:
                error.error?.msg ??
                'Error al cambiar el estado del laboratorio.',
              icon: 'error',
              confirmButtonText: 'Ok',
            });
          },
        });
    });
  }

  // ====== Utilidades ======

  public setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }
}
