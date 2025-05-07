import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

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
  templateUrl: './mant-recurso-humano.component.html',
  styleUrl: './mant-recurso-humano.component.scss'
})
export class MantRecursoHumanoComponent {

  private _fb = inject(FormBuilder);

  public myFormRecHumano:FormGroup  = this._fb.group({
    codRecHumano:'',
    tipoDoc: ['0', [Validators.required]],
    nroDoc: ['', [Validators.required,
                  documentValidator('tipoDoc')
                ]],
    nombreRecHumano: ['',[Validators.required,
                        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    apePatRecHumano:['',[Validators.required,
                        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    apeMatRecHumano:['',[Validators.required,
                        Validators.pattern(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
                      ]],
    fechaNacimiento: ['', [Validators.required,
                        this.fechaNoFuturaValidator()
                      ]],
    edad: [{ value: '', disabled: true }],
    sexoRecHumano:['0',[Validators.required]],
    departamentoRecHumano: ['15'],
    provinciaRecHumano: ['01'],
    distritoRecHumano: ['',[Validators.required]],
    direcRecHumano:[''],
    mailRecHumano: ['', [Validators.email]],
    phones: this._fb.array([], Validators.required),
    gradoInstruccion:['0'],
    profesionesRecurso: this._fb.array([]),
    profesionSolicitante: new FormControl(null),
    especialidadesRecurso: this._fb.array([]),
    esSolicitante: false
  });

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









  actualizarEdad(){

    console.log("Entro actualizar edad")
    const fecha = this.myFormRecHumano.get('fechaNacimiento')?.value;
    const edadCalculada = this.calcularEdad(fecha);
    this.myFormRecHumano.get('edad')?.setValue(edadCalculada);
  
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

}

export function documentValidator(tipoDocControlName: string): ValidatorFn {
  return (control: AbstractControl) => {
    const parent = control.parent; // Accede al formulario completo
    if (!parent) return null; // Verifica si existe un formulario padre

    const tipoDoc = parent.get(tipoDocControlName)?.value; // Obtén el valor de tipoDoc
    const nroDoc = control.value; // Obtén el valor del número de documento

    if (tipoDoc === '0') {
      // DNI: exactamente 8 dígitos numéricos
      if (!/^\d{8}$/.test(nroDoc)) {
        return { invalidDNI: true };
      }
    } else if (tipoDoc === '1') {
      // CE: máximo 13 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,13}$/.test(nroDoc)) {
        return { invalidCE: true };
      }
    } else if (tipoDoc === '2') {
      // Pasaporte: máximo 16 caracteres alfanuméricos
      if (!/^[a-zA-Z0-9]{1,16}$/.test(nroDoc)) {
        return { invalidPasaporte: true };
      }
    }

    return null; // Es válido
  };
}