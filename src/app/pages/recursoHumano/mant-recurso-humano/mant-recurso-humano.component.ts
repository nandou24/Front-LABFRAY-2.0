import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { UbigeoService } from '../../../services/utilitarios/ubigeo.service';
import { IRecHumano } from '../../../models/recursoHumano.models';
import { RecursoHumanoService } from '../../../services/mantenimiento/recursoHumano/recurso-humano.service';
import { customPaginatorIntl } from '../../../services/utilitarios/mat-paginator-intl';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mant-recurso-humano',
  imports: [
            MatFormFieldModule,
            MatInputModule,
            FormsModule,
            MatCardModule,
            MatSelectModule,
            ReactiveFormsModule,
            MatButtonModule,
            MatSlideToggleModule,
            MatIconModule,
            MatTableModule,
            MatPaginator,
            MatTabsModule,
            MatDatepickerModule,
            MatNativeDateModule,
            CommonModule
        ],
  providers: [
          { provide: MatPaginatorIntl,
            useFactory: customPaginatorIntl }
        ],
  templateUrl: './mant-recurso-humano.component.html',
  styleUrl: './mant-recurso-humano.component.scss'
})
export class MantRecursoHumanoComponent implements OnInit, AfterViewInit {

  constructor(
      private _recHumanoService: RecursoHumanoService,
      private _ubigeoService: UbigeoService
  ){}

  ngOnInit(): void {
    this.departamentos = this._ubigeoService.getDepartamento();
    this.provincias = this._ubigeoService.getProvincia('15')
    this.distritos = this._ubigeoService.getDistrito('15','01')
    this.onDepartamentoChange();
    this.onProvinciaChange();
    this.ultimosRecHumano();
    //this.traerRecHumanos();
  }

  private _fb = inject(FormBuilder);

  public myFormRecHumano:FormGroup  = this._fb.group({
    codRecHumano:'',
    tipoDoc: ['', [Validators.required]],
    nroDoc: ['', [Validators.required,
                  documentValidator('tipoDoc')
                ]],
    nombreRecHumano: ['',[Validators.required,
                        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    apePatRecHumano:['',[Validators.required,
                        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    apeMatRecHumano:['',[Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    fechaNacimiento: ['', [Validators.required,
                        this.fechaNoFuturaValidator()
                      ]],
    edad: [{ value: '', disabled: true }],
    sexoRecHumano:['',[Validators.required]],
    departamentoRecHumano: ['15'],
    provinciaRecHumano: ['01'],
    distritoRecHumano: ['',[Validators.required]],
    direcRecHumano:[''],
    mailRecHumano: ['', [Validators.email]],
    phones: this._fb.array([], Validators.required),
    gradoInstruccion:['',[Validators.required]],
    profesionesRecurso: this._fb.array([]),
    profesionSolicitante: new FormControl(null),
    especialidadesRecurso: this._fb.array([]),
    esSolicitante: false,
    usuarioSistema: false,
    datosLogueo: this._fb.group({
      nombreUsuario: [''],
      correoLogin: ['', [Validators.email]],
      passwordHash: [''],
      rol: ['', [Validators.required]],
      sedeAsignada: [''],
      estado: ['Activo'] // puede ser ACTIVO / INACTIVO
    })
  });

  get phones(): FormArray {
    return this.myFormRecHumano.get('phones') as FormArray;
  }

  get profesionesRecurso(): FormArray {
    return this.myFormRecHumano.get('profesionesRecurso') as FormArray;
  }

  get especialidadesRecurso(): FormArray {
    return this.myFormRecHumano.get('especialidadesRecurso') as FormArray;
  }

  hidePassword = true;

  seleccionarTexto(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];

  // Método separado para manejar el cambio de departamento
  onDepartamentoChange(): void {
    this.myFormRecHumano.get('departamentoRecHumano')?.valueChanges.subscribe(departamentoId => {
      // Obtener y cargar las provincias según el departamento seleccionado
      this.provincias = this._ubigeoService.getProvincia(departamentoId);
      this.distritos = this._ubigeoService.getDistrito(departamentoId,'01')
      // Reiniciar el select de provincias
      this.myFormRecHumano.get('provinciaRecHumano')?.setValue('01');  // Limpia la selección de provincias
    });
  }
    
  onProvinciaChange(): void {
    this.myFormRecHumano.get('provinciaRecHumano')?.valueChanges.subscribe(provinciaId => {
      
      const departamentoId = this.myFormRecHumano.get('departamentoRecHumano')?.value;
      this.distritos = this._ubigeoService.getDistrito(departamentoId, provinciaId);
      this.myFormRecHumano.get('distritoRecHumano')?.setValue('01');
      
    });
  }

  fechaNoFuturaValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const fecha = control.value;
      if (!fecha) return null;
  
      const fechaActual = new Date();
      if (new Date(fecha) > fechaActual) {
        return { fechaFutura: true };
      }
  
      return null;
    };
  }

  //setear los anchos
  setFlex(valor: number, unidad: 'px' | '%' = 'px'): string {
    return `0 0 ${valor}${unidad}`;
  }

  //public addPhone: boolean = false;

  agregarTelefono() {

    const telefonoForm = this._fb.group({
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{9,11}$/)]],
      descriptionPhone: ['', [Validators.required, Validators.maxLength(30)]]
    });
  
    this.phones.push(telefonoForm);

  }

  eliminarTelefono(index: number) {
    this.phones.removeAt(index);
  }

  agregarProfesion() {

    const profesionForm = this._fb.group({
      nivelProfesion: ['', [Validators.required]],
      titulo: [''],
      profesion: ['', [Validators.required]],
      nroColegiatura: [''],
      centroEstudiosProfesion: [''],
      anioEgresoProfesion: [''],
    });
      
    this.profesionesRecurso.push(profesionForm);

  }

   eliminarProfesion(index: number) {
    this.profesionesRecurso.removeAt(index);
  }

  agregarEspecialidad() {

    const especialidadForm = this._fb.group({
      especialidad: ['', [Validators.required]],
      centroEstudiosEspecialidad: [''],
      rne: ['', [Validators.required]],
      anioEgresoEspecialidad: ['']
    });
  
    this.especialidadesRecurso.push(especialidadForm);

  }

  eliminarEspecialidad(index: number) {
    this.especialidadesRecurso.removeAt(index);
  }


  public formSubmitted: boolean = false;

  validarArrayTelefono(): boolean{
    
    const telefonos = this.myFormRecHumano.get('phones') as FormArray;

    if((telefonos.length > 0)){
      return true
    }
    return false

  }

  @ViewChild(MatTable) table!: MatTable<any>;
  @ViewChild('MatPaginatorRecHumano') paginatorRecHumano!: MatPaginator;
  ngAfterViewInit() {
      this.dataSourceRecursoHumano.paginator = this.paginatorRecHumano;
  }

  //Tabla rrhh
  columnasTablaRecursoHumano: string[] = ['nro', 'codigo', 'nombreCompleto', 'nroDoc'];
  dataSourceRecursoHumano = new MatTableDataSource<IRecHumano>();

  cargarRecursoHumano(recursoHumano: IRecHumano): void {

    this.recHumanoSeleccionado = true;

    this.myFormRecHumano.patchValue({ 
      codRecHumano: recursoHumano.codRecHumano,
      tipoDoc: recursoHumano.tipoDoc,
      nroDoc: recursoHumano.nroDoc,
      nombreRecHumano: recursoHumano.nombreRecHumano,
      apePatRecHumano: recursoHumano.apePatRecHumano,
      apeMatRecHumano: recursoHumano.apeMatRecHumano,
      fechaNacimiento: recursoHumano.fechaNacimiento,
      sexoRecHumano: recursoHumano.sexoRecHumano,
      departamentoRecHumano: recursoHumano.departamentoRecHumano,
      provinciaRecHumano: recursoHumano.provinciaRecHumano,
      distritoRecHumano: recursoHumano.distritoRecHumano,
      direcRecHumano: recursoHumano.direcRecHumano,
      mailRecHumano: recursoHumano.mailRecHumano
    });
    // Limpiar el FormArray antes de llenarlo
    this.phones.clear();

    // Agregar cada teléfono al FormArray
    recursoHumano.phones.forEach((phone: any) => {
      this.phones.push(this.crearTelefonoGroup(phone));
    });

    this.actualizarEdad();

    this.profesionesRecurso.clear();
    // Agregar cada profesión al FormArray
    recursoHumano.profesionesRecurso.forEach((profesion: any) => {
      const esSolicitante = recursoHumano.profesionSolicitante?.profesion === profesion.profesion;
      this.profesionesRecurso.push(this.crearProfesionGroup(profesion, esSolicitante));
    });

    this.especialidadesRecurso.clear();
    // Agregar cada especialidad al FormArray
    recursoHumano.especialidadesRecurso.forEach((especialidad: any) => {
      this.especialidadesRecurso.push(this.crearEspecialidadGroup(especialidad));
    });

  }

  private crearTelefonoGroup(phone: any): FormGroup {
    return this._fb.group({
      phoneNumber: [phone.phoneNumber],
      descriptionPhone: [phone.descriptionPhone]
    });
  }

  private crearProfesionGroup(profesion: any, esSolicitante: boolean): FormGroup {
    return this._fb.group({
      nivelProfesion: [profesion.nivelProfesion],
      titulo: [profesion.titulo],
      profesion: [profesion.profesion],
      nroColegiatura: [profesion.nroColegiatura],
      centroEstudiosProfesion: [profesion.centroEstudiosProfesion],
      anioEgresoProfesion: [profesion.anioEgresoProfesion],
      profesionSolicitante: [esSolicitante]
    });
  }

  private crearEspecialidadGroup(especialidad: any): FormGroup {
    return this._fb.group({
      especialidad: [especialidad.especialidad],
      rne: [especialidad.rne],
      centroEstudiosEspecialidad: [especialidad.centroEstudiosEspecialidad],
      anioEgresoEspecialidad: [especialidad.anioEgresoEspecialidad]
    });
  }


  ultimosRecHumano(): void {
    this._recHumanoService.getLastRecHumanos(0).subscribe(recHumano => {
      this.dataSourceRecursoHumano.data = recHumano;
    });
  }

  actualizarEdad(){

    const fecha = this.myFormRecHumano.get('fechaNacimiento')?.value;
    const edadCalculada = this.calcularEdad(fecha);
    this.myFormRecHumano.get('edad')?.setValue(edadCalculada);
  
  }

  calcularEdad(fechaNacimiento: Date | string): string {

    if (!fechaNacimiento) return '';

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
    return `${years} años, ${months} meses, y ${days} días`;

  }

  terminoBusquedaRecHumanoControl = new FormControl('');

  filtrarServicio() {
    const termino = this.terminoBusquedaRecHumanoControl.value || '';
    this.dataSourceRecursoHumano.filter = termino.trim().toLowerCase();
  }

  seleccionarProfesionSolicitante(index: number) {

    const grupo = this.profesionesRecurso.at(index);
    const estabaActivo = grupo.get('profesionSolicitante')?.value;

    if (estabaActivo) {
      // Si estaba activo, lo apago y limpio el principal
      grupo.get('profesionSolicitante')?.setValue(false);
      this.myFormRecHumano.get('profesionSolicitante')?.reset();
    } else {
      // Si estaba apagado, activo este y apago los demás
      this.profesionesRecurso.controls.forEach((group, i) => {
        group.get('profesionSolicitante')?.setValue(i === index);
      });

      const { profesion, nroColegiatura } = grupo.value;
      this.myFormRecHumano.get('profesionSolicitante')?.setValue({ profesion, nroColegiatura });
    }

  }

  recHumanoSeleccionado = false;

  registraRecHumano(){

    this.formSubmitted = true;

    if(this.myFormRecHumano.invalid){

      this.myFormRecHumano.markAllAsTouched();
      return
    }

    if(!this.validarArrayTelefono()){
      return
    }

    Swal.fire({
        title: '¿Estás seguro?',
        text: '¿Deseas confirmar la creación de este recuso humano?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {

        if (result.isConfirmed) {

          console.log('Procede registro')
          const body: IRecHumano = this.myFormRecHumano.value; 

          this._recHumanoService.registrarRecHumano(body).subscribe({
            next: (res) => {
              if (res.ok) {
                this.mostrarAlertaExito("Recurso registrado");
                this.ultimosRecHumano();
                this.nuevoRecHumano();
              } else {
                const mensaje = res.msg || 'Ocurrió un error inesperado.';
                this.mostrarAlertaError(mensaje);
              }
            },
            error: (error) => {
              const mensaje = error?.error?.msg || 'Error inesperado al registrar.';
              this.mostrarAlertaError(mensaje);
            }

          });

        }

      })

  }

  private mostrarAlertaExito(tipo: string): void {
    Swal.fire({
      title: 'Confirmado',
      text: tipo+' correctamente',
      icon: 'success',
      confirmButtonText: 'Ok'
    });
  }
  
  private mostrarAlertaError(mensaje: string): void {
    Swal.fire({
      title: 'ERROR!',
      text: mensaje,
      icon: 'error',
      confirmButtonText: 'Ok',
    });
  }

  actualizarRecHumano(){

    this.formSubmitted = true;

    if(this.myFormRecHumano.invalid){
    
      this.myFormRecHumano.markAllAsTouched();
      return
    }

    if(!this.validarArrayTelefono()){
      return
    }

    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas confirmar la actualización de este recurso humano?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
    
    if (result.isConfirmed) {
    
      console.log('Procede actualización')
      const formValue  = this.myFormRecHumano.value;

      this._recHumanoService.actualizarRecHumano(formValue.codRecHumano,formValue).subscribe({
        next: (res) => {
          if (res.ok) {
            this.mostrarAlertaExito("actualizado");
            this.ultimosRecHumano();
            this.nuevoRecHumano();
          } else {
            const mensaje = res.msg || 'Ocurrió un error inesperado.';
            this.mostrarAlertaError(mensaje);
          }
        },
        error: (error) => {
          const mensaje = error?.error?.msg || 'Error inesperado al registrar.';
          this.mostrarAlertaError(mensaje);
        }
      });

    }})
    
  }

  nuevoRecHumano(){

    this.myFormRecHumano.reset(); // Reinicia todos los campos del formulario
    this.formSubmitted = false; // Restablece el estado de validación del formulario 
    this.phones.clear();// Limpia el FormArray de teléfonos, si es necesario
    this.profesionesRecurso.clear();
    this.especialidadesRecurso.clear();
    this.myFormRecHumano.patchValue({
      departamentoRecHumano: '15',
      provinciaRecHumano: '01',
      distritoRecHumano: '',
      profesionSolicitante: { profesion: "", nroColegiatura: "" } 
    });
    this.recHumanoSeleccionado = false;

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