import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class FechaValidatorService {
  constructor() {}

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

  calcularEdad(fechaNacimiento: Date | string): string {
    //console.log('Entro calcular edad');
    //console.log(fechaNacimiento);

    if (!fechaNacimiento) return '';

    //console.log(fechaNacimiento);

    const birthDate =
      typeof fechaNacimiento === 'string'
        ? new Date(fechaNacimiento)
        : fechaNacimiento;
    if (isNaN(birthDate.getTime())) return '';

    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();

    // Calcular la diferencia en meses
    let months = today.getMonth() - birthDate.getMonth();
    if (months < 0) {
      months += 12;
      years--; // Si el mes del cumpleaños aún no ha pasado, restamos un año
    }

    // Calcular la diferencia en días
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) {
      months--; // Si el día del cumpleaños aún no ha pasado, restamos un mes
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Obtener el último día del mes anterior
      days += lastMonth.getDate(); // Sumamos los días del mes anterior
    }

    // Devolver el resultado en años, meses y días
    //console.log(`${years} años, ${months} meses, y ${days} días`);
    return `${years} años, ${months} meses, y ${days} días`;
  }

  calcularEdadEnFecha(
    fechaNacimiento: Date | string,
    fechaEvaluacion: Date | string,
  ): string {
    if (!fechaNacimiento || !fechaEvaluacion) return '';

    const birthDate =
      typeof fechaNacimiento === 'string'
        ? new Date(fechaNacimiento)
        : fechaNacimiento;

    const evaluationDate =
      typeof fechaEvaluacion === 'string'
        ? new Date(fechaEvaluacion)
        : fechaEvaluacion;

    if (isNaN(birthDate.getTime()) || isNaN(evaluationDate.getTime()))
      return '';

    // Validar que la fecha de evaluación no sea anterior a la fecha de nacimiento
    if (evaluationDate < birthDate)
      return 'Fecha de evaluación no puede ser anterior a la fecha de nacimiento';

    let years = evaluationDate.getFullYear() - birthDate.getFullYear();

    // Calcular la diferencia en meses
    let months = evaluationDate.getMonth() - birthDate.getMonth();
    if (months < 0) {
      months += 12;
      years--; // Si el mes del cumpleaños aún no ha pasado, restamos un año
    }

    // Calcular la diferencia en días
    let days = evaluationDate.getDate() - birthDate.getDate();
    if (days < 0) {
      months--; // Si el día del cumpleaños aún no ha pasado, restamos un mes
      const lastMonth = new Date(
        evaluationDate.getFullYear(),
        evaluationDate.getMonth(),
        0,
      ); // Obtener el último día del mes anterior
      days += lastMonth.getDate(); // Sumamos los días del mes anterior
    }

    // Devolver el resultado en años, meses y días
    return `${years} años, ${months} meses, y ${days} días`;
  }
}
