import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class DocValidatorService {
  constructor() {}

  documentValidator(tipoDocControlName: string): ValidatorFn {
    return (control: AbstractControl) => {
      const parent = control.parent; // Accede al formulario completo
      if (!parent) return null; // Verifica si existe un formulario padre

      const tipoDoc = parent.get(tipoDocControlName)?.value; // Obtén el valor de tipoDoc
      const nroDoc = control.value; // Obtén el valor del número de documento

      if (tipoDoc === 'DNI') {
        // DNI: exactamente 8 dígitos numéricos
        if (nroDoc.length > 0 && !/^\d{8}$/.test(nroDoc)) {
          return { invalidDNI: true };
        }
      } else if (tipoDoc === 'CE') {
        // CE: máximo 13 caracteres alfanuméricos
        if (nroDoc.length > 0 && !/^[a-zA-Z0-9]{1,13}$/.test(nroDoc)) {
          return { invalidCE: true };
        }
      } else if (tipoDoc === 'PASAPORTE') {
        // Pasaporte: máximo 16 caracteres alfanuméricos
        if (nroDoc.length > 0 && !/^[a-zA-Z0-9]{1,16}$/.test(nroDoc)) {
          return { invalidPasaporte: true };
        }
      }

      return null; // Es válido
    };
  }
}
