import { Component, inject, OnInit } from '@angular/core';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { IPaciente } from '../../../../models/Mantenimiento/paciente.models';
import { PacienteService } from '../../../../services/mantenimiento/paciente/paciente.service';
import { UbigeoService } from '../../../../services/utilitarios/ubigeo.service';
import Swal from 'sweetalert2';
import { FechaValidatorService } from '../../../../services/utilitarios/validators/fechasValidator/fecha-validator.service';
import { DocValidatorService } from '../../../../services/utilitarios/validators/docValidator/doc-validator.service';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  standalone: true,
  selector: 'app-mant-pacientes-recepcion',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-PE' }],
  templateUrl: './mant-pacientes-recepcion.component.html',
  styleUrl: './mant-pacientes-recepcion.component.scss',
})
export class MantPacientesRecepcionComponent implements OnInit {
  constructor(
    private readonly _pacienteService: PacienteService,
    private _ubigeoService: UbigeoService,
  ) {}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15');
    this.distritos = this._ubigeoService.getDistrito('15', '01');
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosClientes();
    this._adapter.setLocale('es-PE'); // Establecer el locale para el adaptador de fecha
  }

  private _fechaService = inject(FechaValidatorService);
  private _documentValidator = inject(DocValidatorService);
  private readonly _adapter =
    inject<DateAdapter<unknown, unknown>>(DateAdapter);

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.pacienteForm
      .get('departamentoCliente')
      ?.valueChanges.subscribe((departamentoId) => {
        // Obtener y cargar las provincias según el departamento seleccionado
        this.provincias = this._ubigeoService.getProvincia(departamentoId);
        this.distritos = this._ubigeoService.getDistrito(departamentoId, '01');
        // Reiniciar el select de provincias
        this.pacienteForm.get('provinciaCliente')?.setValue('01'); // Limpia la selección de provincias
      });
  }

  onProvinciaChange(): void {
    this.pacienteForm
      .get('provinciaCliente')
      ?.valueChanges.subscribe((provinciaId) => {
        const departamentoId = this.pacienteForm.get(
          'departamentoCliente',
        )?.value;
        this.distritos = this._ubigeoService.getDistrito(
          departamentoId,
          provinciaId,
        );
        this.pacienteForm.get('distritoCliente')?.setValue('01');
      });
  }

  private _fb = inject(FormBuilder);

  public pacienteForm: FormGroup = this._fb.group({
    _id: [null],
    hc: [null],
    tipoDoc: ['DNI', [Validators.required]], // Valor por defecto: DNI
    nroDoc: [
      '',
      [
        Validators.required,
        this._documentValidator.documentValidator('tipoDoc'),
      ],
    ],
    apePatCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    apeMatCliente: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)]],
    nombreCliente: [
      '',
      [Validators.required, Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)],
    ],
    fechaNacimiento: ['', [this._fechaService.fechaNoFuturaValidator()]],
    edad: [{ value: '', disabled: true }],
    sexoCliente: [],
    departamentoCliente: ['15'],
    provinciaCliente: ['01'],
    distritoCliente: ['', Validators.required],
    direcCliente: [''],
    mailCliente: ['', Validators.email],
    phones: this._fb.array([]),
  });

  get phones(): FormArray {
    return this.pacienteForm.get('phones') as FormArray;
  }

  public addPhone: boolean = false;

  agregarTelefono() {
    const telefonoForm = this._fb.group({
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{9,11}$/)],
      ],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]],
    });

    this.phones.push(telefonoForm);
  }

  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorPacientes') paginatorPacientes!: MatPaginator;
  ngAfterViewInit() {
    this.dataSourcePacientes.paginator = this.paginatorPacientes;
  }

  //Tabla pacientes
  columnasTablaPaciente: string[] = [
    'nro',
    'hc',
    'nombreCompleto',
    'documento',
  ];
  dataSourcePacientes = new MatTableDataSource<IPaciente>();

  ultimosClientes(): void {
    this._pacienteService.getLastPatients(100).subscribe((pacientes) => {
      this.dataSourcePacientes.data = pacientes;
    });
  }

  //terminoBusqueda: string = '';
  terminoBusqueda = new FormControl('');
  timeoutBusqueda: any;

  buscarClientes() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      const termino = this.terminoBusqueda.value?.trim() || '';

      if (termino.length >= 3) {
        this._pacienteService
          .getPatient(termino)
          .subscribe((res: IPaciente[]) => {
            this.dataSourcePacientes.data = res;
          });
      } else if (termino.length > 0) {
        this.dataSourcePacientes.data = [];
      } else {
        this.ultimosClientes();
      }
    }, 200);
  }

  filaSeleccionadaIndex: number | null = null;

  //Carga los datos en los campos
  cargarCliente(paciente: IPaciente, index: number): void {
    this.filaSeleccionadaIndex = index;
    this.pacienteForm.patchValue(paciente);
    // Limpiar el FormArray antes de llenarlo
    this.phones.clear();

    this.pacienteForm.get('tipoDoc')?.disable();
    this.pacienteForm.get('nroDoc')?.disable();

    // Agregar cada teléfono al FormArray
    paciente.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });

    this.actualizarEdad();
  }

  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone],
    });
  }

  actualizarEdad() {
    const fecha = this.pacienteForm.get('fechaNacimiento')?.value;
    const edadCalculada = this._fechaService.calcularEdad(fecha);
    this.pacienteForm.get('edad')?.setValue(edadCalculada);
  }

  public formSubmitted: boolean = false;

  validarArrayTelefono(): boolean {
    const telefonos = this.pacienteForm.get('phones') as FormArray;

    if (telefonos.length > 0) {
      return true;
    }
    return false;
  }

  registraPaciente() {
    this.formSubmitted = true;

    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      return;
    }

    if (this.pacienteForm.valid && this.validarArrayTelefono()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          console.log('Procede registro');
          const paciente: IPaciente = this.pacienteForm.value; //capturando los valores del component.ts

          this._pacienteService.registrarPaciente(paciente).subscribe({
            next: () => {
              Swal.fire(
                'Registrado',
                'Paciente registrado correctamente',
                'success',
              );
              this.nuevoCliente();
              this.ultimosClientes();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo registrar el paciente. Intenta nuevamente.';

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
      console.log('No Procede');
    }
  }

  //Botón nuevo cliente
  nuevoCliente(): void {
    this.pacienteForm.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario
    this.phones.clear(); // Limpia el FormArray de teléfonos, si es necesario
    this.addPhone = false;
    this.pacienteForm.patchValue({
      tipoDoc: 'DNI',
      departamentoCliente: '15',
      provinciaCliente: '01',
      distritoCliente: '',
    });
    this.filaSeleccionadaIndex = null;
    this.terminoBusqueda.setValue(''); // Limpiar el campo de búsqueda
    this.pacienteForm.get('tipoDoc')?.enable();
    this.pacienteForm.get('nroDoc')?.enable();
  }

  //actualizar cliente
  actualizarPaciente(): void {
    this.formSubmitted = true;

    if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      return;
    }

    if (this.pacienteForm.valid && this.validarArrayTelefono()) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la actualización de este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          const body: IPaciente = this.pacienteForm.value;
          this._pacienteService.actualizarPaciente(body).subscribe({
            next: () => {
              Swal.fire(
                'Actualizado',
                'Paciente actualizado correctamente',
                'success',
              );
              this.nuevoCliente();
              this.ultimosClientes();
            },
            error: (err) => {
              const mensaje =
                err?.error?.msg ||
                err.message ||
                'No se pudo registrar el paciente. Intenta nuevamente.';

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
