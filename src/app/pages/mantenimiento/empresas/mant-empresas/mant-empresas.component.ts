import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { IEmpresa } from '../../../../models/Mantenimiento/empresa.models';
import { EmpresaService } from '../../../../services/mantenimiento/empresa/empresa.service';
import { UbigeoService } from '../../../../services/utilitarios/ubigeo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mant-empresas',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    CommonModule,
    MatButtonModule,
  ],
  templateUrl: './mant-empresas.component.html',
  styleUrl: './mant-empresas.component.scss',
})
export class MantEmpresasComponent implements OnInit, AfterViewInit {
  constructor(
    private readonly _empresaService: EmpresaService,
    private _ubigeoService: UbigeoService,
  ) {}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimasEmpresas();
  }

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  // Opciones para los campos select
  tiposEmpresa = [
    { value: 'Privada', label: 'Privada' },
    { value: 'Publica', label: 'Pública' },
    { value: 'Mixta', label: 'Mixta' },
  ];

  sectores = [
    { value: 'Salud', label: 'Salud' },
    { value: 'Educacion', label: 'Educación' },
    { value: 'Mineria', label: 'Minería' },
    { value: 'Construccion', label: 'Construcción' },
    { value: 'Manufactura', label: 'Manufactura' },
    { value: 'Servicios', label: 'Servicios' },
    { value: 'Comercio', label: 'Comercio' },
    { value: 'Tecnologia', label: 'Tecnología' },
    { value: 'Otros', label: 'Otros' },
  ];

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.empresaForm
      .get('departamento')
      ?.valueChanges.subscribe((departamentoId) => {
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        this.empresaForm.get('provincia')?.setValue('01');
      });
  }

  onProvinciaChange(): void {
    this.empresaForm.get('provincia')?.valueChanges.subscribe((provinciaId) => {
      const departamentoId = this.empresaForm.get('departamento')?.value;
      this.distritos = this._ubigeoService.getDistrito(
        departamentoId,
        provinciaId,
      );
      this.empresaForm.get('distrito')?.setValue('01');
    });
  }

  private _fb = inject(FormBuilder);

  public empresaForm: FormGroup = this._fb.group({
    _id: [null],
    ruc: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{11}$/), // RUC debe tener 11 dígitos
      ],
    ],
    razonSocial: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
    ],
    nombreComercial: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(150)],
    ],
    direccionFiscal: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200),
      ],
    ],
    departamento: ['15', Validators.required],
    provincia: ['01', Validators.required],
    distrito: ['', Validators.required],
    cantidadTrabajadores: [
      '',
      [Validators.required, Validators.min(1), Validators.max(10000)],
    ],
    email: ['', [Validators.email]],
    telefono: ['', [Validators.pattern(/^\d{7,11}$/)]],
    tipoEmpresa: ['Privada'],
    sector: ['Otros'],
    observaciones: ['', [Validators.maxLength(500)]],
    estado: [true],
    personasContacto: this._fb.array([]),
    ubicacionesSedes: this._fb.array([]),
  });

  get personasContacto(): FormArray {
    return this.empresaForm.get('personasContacto') as FormArray;
  }

  get ubicacionesSedes(): FormArray {
    return this.empresaForm.get('ubicacionesSedes') as FormArray;
  }

  public addContacto: boolean = false;
  public addUbicacion: boolean = false;

  agregarContacto() {
    const contactoForm = this._fb.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/),
          Validators.maxLength(100),
        ],
      ],
      cargo: ['', [Validators.required, Validators.maxLength(50)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{7,11}$/)]],
      email: ['', [Validators.email]],
      principal: [false],
    });

    this.personasContacto.push(contactoForm);
  }

  eliminarContacto(index: number) {
    this.personasContacto.removeAt(index);
  }

  marcarContactoPrincipal(index: number) {
    // Desmarcar todos los contactos como principales
    this.personasContacto.controls.forEach((control, i) => {
      control.get('principal')?.setValue(i === index);
    });
  }

  // Métodos para gestionar ubicaciones/sedes
  agregarUbicacion() {
    const ubicacionForm = this._fb.group({
      nombreSede: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      direccionSede: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200),
        ],
      ],
      departamentoSede: ['15', Validators.required],
      provinciaSede: ['01', Validators.required],
      distritoSede: ['', Validators.required],
      referenciasSede: ['', [Validators.maxLength(200)]],
      coordenadasMaps: ['', [Validators.maxLength(500)]],
      telefonoSede: ['', [Validators.pattern(/^\d{7,11}$/)]],
      emailSede: ['', [Validators.email]],
      responsableSede: [
        '',
        [
          Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]*$/),
          Validators.maxLength(100),
        ],
      ],
      cargoResponsable: ['', [Validators.maxLength(50)]],
      observacionesSede: ['', [Validators.maxLength(300)]],
      activa: [true],
    });

    this.ubicacionesSedes.push(ubicacionForm);
  }

  eliminarUbicacion(index: number) {
    this.ubicacionesSedes.removeAt(index);
  }

  // Método para abrir Google Maps con la dirección
  abrirEnMaps(direccion: string, nombreSede: string) {
    if (direccion) {
      const query = encodeURIComponent(`${nombreSede} ${direccion}`);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  }

  // Validar formato de coordenadas (lat,lng)
  validarCoordenadas(coordenadas: string): boolean {
    if (!coordenadas) return true; // Campo opcional
    const regex = /^-?\d+\.?\d*,-?\d+\.?\d*$/;
    return regex.test(coordenadas.trim());
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorEmpresas') paginatorEmpresas!: MatPaginator;

  ngAfterViewInit() {
    this.dataSourceEmpresas.paginator = this.paginatorEmpresas;
  }

  //Tabla empresas
  columnasTablaPrincipal: string[] = [
    'nro',
    'ruc',
    'razonSocial',
    'nombreComercial',
    'cantidadTrabajadores',
  ];
  dataSourceEmpresas = new MatTableDataSource<IEmpresa>();

  ultimasEmpresas(): void {
    this._empresaService.getLastEmpresas(100).subscribe((empresas) => {
      this.dataSourceEmpresas.data = empresas;
    });
  }

  terminoBusqueda = new FormControl('');
  timeoutBusqueda: any;

  buscarEmpresas() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusqueda.value?.trim() || '';

      if (termino.length >= 3) {
        this._empresaService
          .getEmpresa(termino)
          .subscribe((res: IEmpresa[]) => {
            this.dataSourceEmpresas.data = res;
          });
      } else if (termino.length > 0) {
        this.dataSourceEmpresas.data = [];
      } else {
        this.ultimasEmpresas();
      }
    }, 200);
  }

  filaSeleccionadaIndex: number | null = null;

  //Carga los datos en los campos
  cargarEmpresa(empresa: IEmpresa, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.empresaForm.patchValue(empresa);

    // Limpiar los FormArrays antes de llenarlos
    this.personasContacto.clear();
    this.ubicacionesSedes.clear();

    this.empresaForm.get('ruc')?.disable();

    // Agregar cada persona de contacto al FormArray
    empresa.personasContacto.forEach((contacto: any) => {
      this.personasContacto.push(this.crearContactoGroup(contacto));
    });

    // Agregar cada ubicación al FormArray
    if (empresa.ubicacionesSedes) {
      empresa.ubicacionesSedes.forEach((ubicacion: any) => {
        this.ubicacionesSedes.push(this.crearUbicacionGroup(ubicacion));
      });
    }
  }

  private crearContactoGroup(contacto: any): FormGroup {
    return this._fb.group({
      nombre: [contacto.nombre],
      cargo: [contacto.cargo],
      telefono: [contacto.telefono],
      email: [contacto.email || ''],
      principal: [contacto.principal || false],
    });
  }

  private crearUbicacionGroup(ubicacion: any): FormGroup {
    return this._fb.group({
      nombreSede: [ubicacion.nombreSede],
      direccionSede: [ubicacion.direccionSede],
      departamentoSede: [ubicacion.departamentoSede],
      provinciaSede: [ubicacion.provinciaSede],
      distritoSede: [ubicacion.distritoSede],
      referenciasSede: [ubicacion.referenciasSede || ''],
      coordenadasMaps: [ubicacion.coordenadasMaps || ''],
      telefonoSede: [ubicacion.telefonoSede || ''],
      emailSede: [ubicacion.emailSede || ''],
      responsableSede: [ubicacion.responsableSede || ''],
      cargoResponsable: [ubicacion.cargoResponsable || ''],
      observacionesSede: [ubicacion.observacionesSede || ''],
      activa: [ubicacion.activa !== undefined ? ubicacion.activa : true],
    });
  }

  public formSubmitted: boolean = false;

  validarArrayContactos(): boolean {
    const contactos = this.empresaForm.get('personasContacto') as FormArray;
    return contactos.length > 0;
  }

  registrarEmpresa() {
    this.formSubmitted = true;

    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    if (this.empresaForm.valid && this.validarArrayContactos()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de esta empresa?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const empresa: IEmpresa = this.empresaForm.value;
          empresa.fechaRegistro = new Date();

          this._empresaService.registrarEmpresa(empresa).subscribe({
            next: () => {
              Swal.fire(
                'Registrado',
                'Empresa registrada correctamente',
                'success',
              );
              this.nuevaEmpresa();
              this.ultimasEmpresas();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo registrar la empresa. Intenta nuevamente.';

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
    } else {
      console.log('No Procede - Faltan contactos o formulario inválido');
    }
  }

  //Botón nueva empresa
  nuevaEmpresa(): void {
    this.empresaForm.reset();
    this.formSubmitted = false;
    this.personasContacto.clear();
    this.ubicacionesSedes.clear();
    this.addContacto = false;
    this.addUbicacion = false;
    this.empresaForm.patchValue({
      departamento: '15',
      provincia: '01',
      distrito: '',
      tipoEmpresa: 'Privada',
      sector: 'Otros',
      estado: true,
    });
    this.filaSeleccionadaIndex = null;
    this.terminoBusqueda.setValue('');
    this.empresaForm.get('ruc')?.enable();
  }

  //actualizar empresa
  actualizarEmpresa(): void {
    this.formSubmitted = true;

    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    if (this.empresaForm.valid && this.validarArrayContactos()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la actualización de esta empresa?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const body: IEmpresa = this.empresaForm.value;
          this._empresaService.actualizarEmpresa(body).subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Empresa actualizada correctamente',
                'success',
              );
              this.nuevaEmpresa();
              this.ultimasEmpresas();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo actualizar la empresa. Intenta nuevamente.';

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
    } else {
      console.log('No Procede Actualización');
    }
  }
}
