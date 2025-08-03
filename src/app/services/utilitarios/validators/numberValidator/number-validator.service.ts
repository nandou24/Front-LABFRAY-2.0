import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NumberValidatorService {
  constructor() {}

  validarTeclaNumerica(event: KeyboardEvent): void {
    const tecla = event.key;

    // Permitir números, punto, backspace, delete, tab, flechas
    const teclasPermitidas = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '.',
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];

    if (!teclasPermitidas.includes(tecla)) {
      event.preventDefault();
    }

    // Evitar que escriban más de un punto decimal
    const input = event.target as HTMLInputElement;
    if (tecla === '.' && input.value.includes('.')) {
      event.preventDefault();
    }
  }
  validarNumeroEntero(event: KeyboardEvent): void {
    const tecla = event.key;
    //console.log('Tecla presionada:', tecla);

    // Permitir números, backspace, delete, tab, flechas
    const teclasPermitidas = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];

    if (!teclasPermitidas.includes(tecla)) {
      event.preventDefault();
    }
  }
}
