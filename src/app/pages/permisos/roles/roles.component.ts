import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { RolesService } from '../../../services/permisos/roles/roles.service';
import { RutasService } from '../../../services/permisos/rutas/rutas.service';
import { IRol } from '../../../models/permisos/roles.models';
import { IRuta } from '../../../models/permisos/rutas.models';
import Swal from 'sweetalert2';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-roles',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatSelectModule,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private _fb = inject(FormBuilder);
  private _rolesService = inject(RolesService);
  private _rutasService = inject(RutasService);

  public formRol: FormGroup = this._fb.group({
    codRol: [null],
    nombreRol: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    descripcionRol: [''],
    estado: [true, Validators.required],
    rutasPermitidas: this._fb.array([]), // Nuevo control para rutas asignadas
  });

  get rutasPermitidas(): FormArray {
    return this.formRol.get('rutasPermitidas') as FormArray;
  }

  public roles: IRol[] = [];
  //private rolesOriginal: IRol[] = [];
  public modoEdicion: boolean = false;
  terminoBusqueda = new FormControl('');
  public rolSeleccionado: IRol | null = null;
  public rutasDisponibles: IRuta[] = [];

  ngOnInit(): void {
    this.listarRoles();
    this.listarRutasDisponibles();
  }

  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  @ViewChild('paginatorRol') paginatorRol!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourceRol.paginator = this.paginatorRol;
  }

  //Tabla roles
  columnasTablaRol: string[] = ['codigo', 'nombre', 'estado', 'accion'];
  dataSourceRol = new MatTableDataSource<IRol>();

  listarRoles() {
    this._rolesService.getAllRoles().subscribe({
      next: (roles) => {
        this.dataSourceRol.data = roles;
        //console.log('Roles obtenidos:', roles);
      },
      error: () => {
        this.dataSourceRol.data = [];
      },
    });
  }

  filtrar() {
    const termino = this.terminoBusqueda.value || '';
    this.dataSourceRol.filter = termino.trim().toLowerCase();
  }

  listarRutasDisponibles() {
    this._rutasService.getAllRutas().subscribe({
      next: (rutas) => {
        this.rutasDisponibles = rutas;
      },
      error: () => {
        this.rutasDisponibles = [];
      },
    });
  }

  guardarRol() {
    if (this.formRol.invalid) {
      this.formRol.markAllAsTouched();
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
        this.crearRol();
      }
    });
  }

  crearRol() {
    const rol: IRol = {
      ...this.formRol.value,
    };
    this._rolesService.registrarRol(rol).subscribe({
      next: () => {
        Swal.fire('Registrado', 'Rol registrado correctamente', 'success');
        this.formRol.reset({ estado: true });
        this.listarRoles();
        this.cancelarEdicion();
      },
      error: (err) => {
        const mensaje =
          err?.error?.msg ||
          err.message ||
          'No se pudo registrar el rol. Intenta nuevamente.';
        Swal.fire({
          title: 'Error',
          text: mensaje,
          icon: 'error',
          confirmButtonText: 'Ok',
        });
      },
    });
  }

  actualizarRol() {
    if (this.formRol.invalid || !this.rolSeleccionado) {
      this.formRol.markAllAsTouched();
      return;
    }
    Swal.fire({
      title: '¿Actualizar rol?',
      text: '¿Está seguro de actualizar este rol?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        const rol: IRol = {
          ...this.formRol.value,
        };
        this._rolesService
          .actualizarRol(this.rolSeleccionado!.codRol, rol)
          .subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Rol actualizado correctamente',
                'success',
              );
              this.cancelarEdicion();
              this.listarRoles();
            },
            error: () =>
              Swal.fire('Error', 'No se pudo actualizar el rol', 'error'),
          });
      }
    });
  }

  editarRol(rol: IRol) {
    this.modoEdicion = true;
    this.rolSeleccionado = rol;

    this.rutasPermitidas.clear();

    // Agregar las rutasPermitidas al FormArray
    rol.rutasPermitidas.forEach((ruta) => {
      const grupo = this._fb.group({
        _id: [ruta._id, Validators.required],
        codRuta: [ruta.codRuta, Validators.required],
        urlRuta: [{ value: ruta.urlRuta, disabled: true }],
      });
      this.rutasPermitidas.push(grupo);
    });

    this.formRol.patchValue({
      codRol: rol.codRol,
      nombreRol: rol.nombreRol,
      descripcionRol: rol.descripcionRol,
      estado: rol.estado,
    });
  }

  eliminarRol(rol: IRol) {
    Swal.fire({
      title: '¿Eliminar rol?',
      text: `¿Está seguro de eliminar el rol ${rol.nombreRol}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this._rolesService.eliminarRol(rol.codRol).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Rol eliminado correctamente', 'success');
            this.listarRoles();
            this.cancelarEdicion();
          },
          error: () =>
            Swal.fire('Error', 'No se pudo eliminar el rol', 'error'),
        });
      }
    });
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.rolSeleccionado = null;
    this.formRol.reset({ estado: true });
    this.rutasPermitidas.clear();
  }

  agregarRuta() {
    const grupo = this._fb.group({
      _id: ['', Validators.required],
      codRuta: ['', Validators.required],
      urlRuta: [{ value: '', disabled: true }],
    });
    this.rutasPermitidas.push(grupo);
  }

  eliminarRuta(index: number) {
    this.rutasPermitidas.removeAt(index);
  }

  onRutaSeleccionada(index: number) {
    const codRutaSeleccionada = this.rutasPermitidas
      .at(index)
      .get('codRuta')?.value;

    // Validar si ya fue seleccionada en otra fila
    const yaExiste = this.rutasPermitidas.controls.some((control, i) => {
      return (
        i !== index && control.get('codRuta')?.value === codRutaSeleccionada
      );
    });

    if (yaExiste) {
      Swal.fire({
        title: 'Ruta ya seleccionada',
        text: 'Esta ruta ya fue agregada. Por favor, elija otra.',
        icon: 'warning',
      });

      // Limpia los valores del select en esa fila
      this.rutasPermitidas.at(index).patchValue({
        codRuta: '',
        urlRuta: '',
        _id: '',
      });

      return;
    }

    const ruta = this.rutasDisponibles.find(
      (r) => r.codRuta === codRutaSeleccionada,
    );
    this.rutasPermitidas
      .at(index)
      .get('urlRuta')
      ?.setValue(ruta?.urlRuta || '');
    this.rutasPermitidas
      .at(index)
      .get('_id')
      ?.setValue(ruta?._id || '');
  }
}
