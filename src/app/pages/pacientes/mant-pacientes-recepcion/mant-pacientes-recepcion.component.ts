import { Component, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
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
import { IPaciente } from '../../models/paciente.mdoles';
import { PacienteService } from '../../services/mantenimiento/paciente/paciente.service';
import { UbigeoService } from '../../services/utilitarios/ubigeo.service';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-mant-pacientes-recepcion',
  imports: [MatFormFieldModule,
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
            CommonModule,
            MatButtonModule
          ],
  templateUrl: './mant-pacientes-recepcion.component.html',
  styleUrl: './mant-pacientes-recepcion.component.scss'
})
export class MantPacientesRecepcionComponent implements OnInit {

  constructor(
    private readonly _pacienteService: PacienteService,
    private _ubigeoService: UbigeoService
  ){}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15')
    this.distritos = this._ubigeoService.getDistrito('15','01')
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosClientes();
  }

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.pacienteForm.get('departamentoCliente')?.valueChanges.subscribe(departamentoId => {
      // Obtener y cargar las provincias según el departamento seleccionado
      this.provincias = this._ubigeoService.getProvincia(departamentoId);
      this.distritos = this._ubigeoService.getDistrito(departamentoId,'01')
      // Reiniciar el select de provincias
      this.pacienteForm.get('provinciaCliente')?.setValue('01');  // Limpia la selección de provincias
    });
  }
    
  onProvinciaChange(): void {
    this.pacienteForm.get('provinciaCliente')?.valueChanges.subscribe(provinciaId => {
      
      const departamentoId = this.pacienteForm.get('departamentoCliente')?.value;
      this.distritos = this._ubigeoService.getDistrito(departamentoId, provinciaId);
      this.pacienteForm.get('distritoCliente')?.setValue('01');
      
    });
  }

  private _fb = inject(FormBuilder);

  public pacienteForm:FormGroup  = this._fb.group({

      hc: [''],
      tipoDoc: ['DNI', [Validators.required]],           // Valor por defecto: DNI
      nroDoc: ['', [Validators.required,
                  documentValidator('tipoDoc')
                ]],
      apePatCliente: ['', [Validators.required,
                      Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                    ]],
      apeMatCliente: ['', [Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                    ]],
      nombreCliente: ['', [Validators.required,
                      Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                    ]],
      fechaNacimiento: [''],
      edad: [{ value: '', disabled: true }],
      sexoCliente: [''],
      departamentoCliente: ['15'],
      provinciaCliente: ['01'],
      distritoCliente: [''],
      direcCliente:[''],
      mailCliente: [''],
      phones: this._fb.array([])
  });

  get phones(): FormArray {
    return this.pacienteForm.get('phones') as FormArray;
  }

  @ViewChild(MatTable) table!: MatTable<any>;
  displayedColumns: string[] = ['phoneNumber', 'descriptionPhone', 'acciones'];
  dataSourceTelefonos = new MatTableDataSource<FormGroup>();

  public addPhone: boolean = false;

  agregarTelefono() {

    if (this.phoneNumber.invalid || this.descriptionPhone.invalid) {
      this.phoneNumber.markAsTouched();
      this.descriptionPhone.markAsTouched();
      return;
    }
  
    const nuevoTelefono = this._fb.group({
      phoneNumber: this.phoneNumber.value,
      descriptionPhone: this.descriptionPhone.value
    });
    this.phones.push(nuevoTelefono);
    this.phoneNumber.reset();
    this.descriptionPhone.reset();
    this.dataSourceTelefonos.data = this.phones.controls as FormGroup[]; // importante
    this.table.renderRows(); // forza el refresco visual

  }
  
  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
    //this.dataSource.data = this.phones.controls as FormGroup[];
    //this.table.renderRows();
  }

  phoneNumber = this._fb.control('', [Validators.required]);
  descriptionPhone = this._fb.control('', [Validators.required]);

  //Tabla pacientes
  columnasTablaPaciente: string[] = ['nro', 'hc', 'nombreCompleto', 'tipoDoc', 'nroDoc'];
  dataSourcePacientes = new MatTableDataSource<IPaciente>();

  ultimosClientes(): void {
    this._pacienteService.getLastPatients(20).subscribe(pacientes => {
      this.dataSourcePacientes.data = pacientes;
    });
  }

  terminoBusqueda: any;

  // Método para buscar clientes
  buscarClientes() {
    if (this.terminoBusqueda.length >= 3) { 
      this._pacienteService.getPatient(this.terminoBusqueda).subscribe((res: IPaciente[]) => {
        this.dataSourcePacientes.data  = res;
      });
    }if (this.terminoBusqueda.length > 0) {
      this.dataSourcePacientes.data  = [];
    }else{
      this.ultimosClientes();
    }
  }

  //Carga los datos en los campos
  cargarCliente(paciente: IPaciente): void {

    this.pacienteForm.patchValue({ 
      hc: paciente.hc,
      tipoDoc: paciente.tipoDoc,
      nroDoc: paciente.nroDoc,
      nombreCliente: paciente.nombreCliente,
      apePatCliente: paciente.apePatCliente,
      apeMatCliente: paciente.apeMatCliente,
      fechaNacimiento: paciente.fechaNacimiento,
      sexoCliente: paciente.sexoCliente,
      departamentoCliente: paciente.departamentoCliente,
      provinciaCliente: paciente.provinciaCliente,
      distritoCliente: paciente.distritoCliente,
      direcCliente: paciente.direcCliente,
      mailCliente: paciente.mailCliente
    });
    // Limpiar el FormArray antes de llenarlo
    this.phones.clear();

    // Agregar cada teléfono al FormArray
    paciente.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });

    this.dataSourceTelefonos.data = this.phones.controls as FormGroup[]; // importante
    this.actualizarEdad();

  }

  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone]
    });
  }

  actualizarEdad(){

      console.log("Entro actualizar edad")
      const fecha = this.pacienteForm.get('fechaNacimiento')?.value;
      const edadCalculada = this.calcularEdad(fecha);
      this.pacienteForm.get('edad')?.setValue(edadCalculada);
    
  }

  calcularEdad(fechaNacimiento: Date | string): string {

    console.log("Entro calcular edad")
    console.log(fechaNacimiento)

    if (!fechaNacimiento) return '';

    console.log(fechaNacimiento)

    const birthDate = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
    if (isNaN(birthDate.getTime())) return '';

    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();

    // Calcular la diferencia en meses
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) {
      months += 12;
      years--;  // Si el mes del cumpleaños aún no ha pasado, restamos un año
    }

    // Calcular la diferencia en días
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) {
      months--;  // Si el día del cumpleaños aún no ha pasado, restamos un mes
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);  // Obtener el último día del mes anterior
      days += lastMonth.getDate();  // Sumamos los días del mes anterior
    }

    // Devolver el resultado en años, meses y días
    console.log(`${years} años, ${months} meses, y ${days} días`)
    return `${years} años, ${months} meses, y ${days} días`;

  }

  public formSubmitted: boolean = false;

  validarArrayTelefono(): boolean{
    
    const telefonos = this.pacienteForm.get('phones') as FormArray;

    if((telefonos.length > 0)){
      return true
    }
    return false

  }

  registraPaciente(){

    this.formSubmitted = true;
  
    if(this.pacienteForm.valid && this.validarArrayTelefono()){

      Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de este paciente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        
        if (result.isConfirmed) {

          console.log('Procede registro')
          const body: IPaciente = this.pacienteForm.value; //capturando los valores del component.ts
          
          console.log("capturando valores en component.ts")

          this._pacienteService.registrarPaciente(body).subscribe((res) => {
            if (res !== 'ERROR') {
              Swal.fire({
                title: 'Confirmado',
                text: 'Paciente Registrado',
                icon: 'success',
                confirmButtonText: 'Ok',
              });
              this.ultimosClientes();
              //this.nuevoCliente();
              //this._router.navigateByUrl('/auth/login');
            }else{
              //this.pacienteForm.get('fechaNacimiento')?.setValue(fechaSeleccionada);
            }
          });
        }
      })
    }else{
      console.log('No Procede')
    }

  }

  //Botón nuevo cliente
  nuevoCliente(): void {
    this.pacienteForm.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario 
    this.phones.clear();// Limpia el FormArray de teléfonos, si es necesario
    this.addPhone = false;
    this.pacienteForm.patchValue({
      tipoDoc: 'DNI',
      departamentoCliente: '15',
      provinciaCliente: '01',
      distritoCliente: '',
    });
    // this.edad = '';
    // this.filaSeleccionada = null;
  }

}

export function documentValidator(tipoDocControlName: string): ValidatorFn {
  return (control: AbstractControl) => {
    const parent = control.parent; // Accede al formulario completo
    if (!parent) return null; // Verifica si existe un formulario padre

    const tipoDoc = parent.get(tipoDocControlName)?.value; // Obtén el valor de tipoDoc
    const nroDoc = control.value; // Obtén el valor del número de documento

    if (tipoDoc === 'DNI') {
      // DNI: exactamente 8 dígitos numéricos
      if (!/^\d{8}$/.test(nroDoc)) {
        return { invalidDNI: true };
      }
    } else if (tipoDoc === 'CE') {
      // CE: máximo 13 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,13}$/.test(nroDoc)) {
        return { invalidCE: true };
      }
    } else if (tipoDoc === 'PASAPORTE') {
      // Pasaporte: máximo 16 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,16}$/.test(nroDoc)) {
        return { invalidPasaporte: true };
      }
    }

    return null; // Es válido
  };
}