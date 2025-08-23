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
import {
  IEmpresa,
  IPersonaContacto,
  IUbicacionSede,
} from '../../../../models/Mantenimiento/empresa.models';
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
    ruc: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]], // RUC debe tener 11 dígitos
    razonSocial: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
    ],
    nombreComercial: [
      null,
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    direccionFiscal: ['', [Validators.required, Validators.maxLength(200)]],
    departamento: ['15', Validators.required],
    provincia: ['01', Validators.required],
    distrito: ['', Validators.required],
    cantidadTrabajadores: [
      '',
      [Validators.required, Validators.min(1), Validators.max(10000)],
    ],
    email: [null, [Validators.email]],
    telefono: [null, [Validators.pattern(/^\d{7,11}$/)]],
    tipoEmpresa: ['Privada'],
    sector: [],
    observaciones: [null, [Validators.maxLength(500)]],
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
    const contacto = this.personasContacto.at(index);
    const contactoId = contacto.get('_id')?.value;
    const ruc = this.empresaForm.get('ruc')?.value;

    if (contactoId && ruc) {
      this._empresaService.eliminarContactoEmpresa(ruc, contactoId).subscribe({
        next: () => {
          this.personasContacto.removeAt(index);
        },
        error: (err) => {
          let mensaje = 'No se pudo eliminar el contacto. Intenta nuevamente.';

          if (err?.error?.errors) {
            // Si hay errores específicos de campos
            const errores = err.error.errors;
            const primerError = Object.keys(errores)[0]; // Tomar el primer error
            if (primerError && errores[primerError]?.msg) {
              mensaje = errores[primerError].msg;
            }
          } else if (err?.error?.msg) {
            // Si hay un mensaje general en error.msg
            mensaje = err.error.msg;
          } else if (err?.message) {
            // Si hay un mensaje en la propiedad message
            mensaje = err.message;
          }

          Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Ok',
          });
        },
      });
    }
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
      nombreSede: ['', [Validators.required, Validators.maxLength(100)]],
      direccionSede: ['', [Validators.required, Validators.maxLength(200)]],
      departamentoSede: ['15', Validators.required],
      provinciaSede: ['01', Validators.required],
      distritoSede: ['', Validators.required],
      referenciasSede: ['', [Validators.maxLength(200)]],
      coordenadasMaps: ['', [Validators.maxLength(500)]],
      telefonoSede: ['', [Validators.pattern(/^\d{7,11}$/)]],
      emailSede: ['', [Validators.email]],
      observacionesSede: ['', [Validators.maxLength(300)]],
    });

    this.ubicacionesSedes.push(ubicacionForm);
  }

  eliminarUbicacion(index: number) {
    this.ubicacionesSedes.removeAt(index);
  }

  // Método para abrir Google Maps con coordenadas
  abrirEnMaps(coordenadas: string) {
    console.log('Coordenadas recibidas:', coordenadas);
    if (!coordenadas || !this.validarCoordenadas(coordenadas)) {
      Swal.fire({
        title: 'Coordenadas inválidas',
        text: 'No hay coordenadas válidas para mostrar en el mapa. Formato requerido: latitud,longitud (ej: -12.0464,-77.0428)',
        icon: 'warning',
        confirmButtonText: 'Ok',
      });
      return;
    }

    // Usar las coordenadas directamente
    const [lat, lng] = coordenadas.split(',');
    const url = `https://www.google.com/maps?q=${lat.trim()},${lng.trim()}`;
    window.open(url, '_blank');
  }

  // Validar formato de coordenadas (lat,lng)
  validarCoordenadas(coordenadas: string): boolean {
    if (!coordenadas) return true; // Campo opcional

    const coordenadasLimpias = coordenadas.trim();
    if (!coordenadasLimpias) return true; // Si está vacío después de trim

    // Formato más flexible: permite espacios después de la coma y muchos decimales
    // Acepta: -12.027221945765662, -77.1018516597838 o -12.0272,-77.1019
    const regex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

    if (!regex.test(coordenadasLimpias)) return false;

    try {
      // Validar rangos de latitud y longitud
      const [lat, lng] = coordenadasLimpias.split(',');
      const latNum = parseFloat(lat.trim());
      const lngNum = parseFloat(lng.trim());

      // Verificar que sean números válidos
      if (isNaN(latNum) || isNaN(lngNum)) return false;

      // Latitud debe estar entre -90 y 90
      // Longitud debe estar entre -180 y 180
      return latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
    } catch (error) {
      return false;
    }
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

  private todosLasEmpresas: IEmpresa[] = [];

  ultimasEmpresas(): void {
    this._empresaService.getLastEmpresas(0).subscribe((empresas) => {
      this.dataSourceEmpresas.data = empresas;
      this.todosLasEmpresas = empresas; // Guardar todos los datos
    });
  }

  terminoBusqueda = new FormControl('');
  timeoutBusqueda: any;

  //Busca empresas en el frontend.... a futuro implementar búsqueda en el backend, cuando supere 1000 registros
  buscarEmpresas() {
    const termino = this.terminoBusqueda?.value?.trim() ?? '';

    if (termino === '') {
      // Si no hay término de búsqueda, mostrar todos los datos iniciales
      this.dataSourceEmpresas.data = this.todosLasEmpresas;
      this.dataSourceEmpresas.filter = '';
    } else {
      // Si hay término de búsqueda, aplicar filtro del dataSource
      this.dataSourceEmpresas.data = this.todosLasEmpresas; // Asegurar que tiene todos los datos
      this.dataSourceEmpresas.filter = termino.toLowerCase();
    }

    // Si hay un paginador, ir a la primera página cuando se filtra
    if (this.dataSourceEmpresas.paginator) {
      this.dataSourceEmpresas.paginator.firstPage();
    }
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
    empresa.personasContacto.forEach((contacto: IPersonaContacto) => {
      this.personasContacto.push(this.crearContactoGroup(contacto));
    });

    // Agregar cada ubicación al FormArray
    if (empresa.ubicacionesSedes) {
      empresa.ubicacionesSedes.forEach((ubicacion: IUbicacionSede) => {
        this.ubicacionesSedes.push(this.crearUbicacionGroup(ubicacion));
      });
    }
  }

  private crearContactoGroup(contacto: IPersonaContacto): FormGroup {
    return this._fb.group({
      _id: [contacto._id || null],
      nombre: [contacto.nombre],
      cargo: [contacto.cargo],
      telefono: [contacto.telefono],
      email: [contacto.email || null],
      principal: [contacto.principal || false],
    });
  }

  private crearUbicacionGroup(ubicacion: IUbicacionSede): FormGroup {
    return this._fb.group({
      _id: [ubicacion._id || null],
      nombreSede: [ubicacion.nombreSede],
      direccionSede: [ubicacion.direccionSede],
      departamentoSede: [ubicacion.departamentoSede],
      provinciaSede: [ubicacion.provinciaSede],
      distritoSede: [ubicacion.distritoSede],
      referenciasSede: [ubicacion.referenciasSede || null],
      coordenadasMaps: [ubicacion.coordenadasMaps || null],
      telefonoSede: [ubicacion.telefonoSede || null],
      emailSede: [ubicacion.emailSede || null],
      observacionesSede: [ubicacion.observacionesSede || null],
    });
  }

  public formSubmitted: boolean = false;

  validarArrayContactos(): boolean {
    const contactos = this.empresaForm.get('personasContacto') as FormArray;
    return contactos.length > 0;
  }

  validarArrayUbicaciones(): boolean {
    const ubicaciones = this.empresaForm.get('ubicacionesSedes') as FormArray;
    return ubicaciones.length > 0;
  }

  registrarEmpresa() {
    this.formSubmitted = true;

    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    if (this.empresaForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de esta empresa?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const empresa: IEmpresa = this.empresaForm.getRawValue();

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
              // Extraer mensaje específico del campo que falló
              let mensaje =
                'No se pudo registrar la empresa. Intenta nuevamente.';

              if (err?.error?.errors) {
                // Si hay errores específicos de campos
                const errores = err.error.errors;
                const primerError = Object.keys(errores)[0]; // Tomar el primer error
                if (primerError && errores[primerError]?.msg) {
                  mensaje = errores[primerError].msg;
                }
              } else if (err?.error?.msg) {
                // Si hay un mensaje general en error.msg
                mensaje = err.error.msg;
              } else if (err?.message) {
                // Si hay un mensaje en la propiedad message
                mensaje = err.message;
              }

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
    this.dataSourceEmpresas.data = this.todosLasEmpresas;
    this.dataSourceEmpresas.filter = ''; // Limpiar cualquier filtro aplicado
    this.empresaForm.get('ruc')?.enable();
  }

  //actualizar empresa
  actualizarEmpresa(): void {
    this.formSubmitted = true;

    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    if (this.empresaForm.valid) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la actualización de esta empresa?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const body: IEmpresa = this.empresaForm.getRawValue();
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
              //console.log('Error al actualizar la empresa:', err);

              // Extraer mensaje específico del campo que falló
              let mensaje =
                'No se pudo actualizar la empresa. Intenta nuevamente.';

              if (err?.error?.errors) {
                // Si hay errores específicos de campos
                const errores = err.error.errors;
                const primerError = Object.keys(errores)[0]; // Tomar el primer error
                if (primerError && errores[primerError]?.msg) {
                  mensaje = errores[primerError].msg;
                }
              } else if (err?.error?.msg) {
                // Si hay un mensaje general en error.msg
                mensaje = err.error.msg;
              } else if (err?.message) {
                // Si hay un mensaje en la propiedad message
                mensaje = err.message;
              }

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
