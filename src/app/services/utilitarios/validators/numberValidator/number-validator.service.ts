import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class NumberValidatorService {
  constructor() {}

  private readonly allowedKeys = new Set([
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
    'Tab',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
  ]);

  validarTeclaNumerica(event: KeyboardEvent): void {
    const tecla = event.key;

    if (!this.allowedKeys.has(tecla)) {
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

    this.allowedKeys.delete('.');

    if (!this.allowedKeys.has(tecla)) {
      event.preventDefault();
    }
  }

  validarNumeroDouble(valor: string): boolean {
    // Permite números con punto decimal opcional y hasta dos decimales
    const regex = /^\d+(\.\d{0,2})?$/;
    return regex.test(valor);
  }

  validarTeclaDoublePositivo(event: KeyboardEvent): void {
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
      'Home',
      'End',
      // No agregar ninguna tecla adicional aquí para evitar el símbolo "+"
    ];

    if (!teclasPermitidas.includes(tecla)) {
      event.preventDefault();
    }

    // Evitar más de un punto decimal
    const input = event.target as HTMLInputElement;
    if (tecla === '.' && input.value.includes('.')) {
      event.preventDefault();
    }

    // Si la primera tecla es un punto, agregar un 0 antes del punto
    if (tecla === '.' && input.value.length === 0) {
      input.value = '0';
    }

    // Si ya hay 3 decimales, eliminar automáticamente el último dígito
    const valor = input.value;
    console.log('Valor actual:', valor);
    const partes = valor.split('.');
    console.log('Partes:', partes);
    if (
      partes.length === 2 &&
      partes[1].length >= 2 &&
      tecla !== 'Backspace' &&
      tecla !== 'Delete' &&
      tecla !== 'Tab' &&
      tecla !== 'ArrowLeft' &&
      tecla !== 'ArrowRight'
    ) {
      // Eliminar el último dígito decimal
      input.value = partes[0] + '.' + partes[1].slice(0, 2);
      event.preventDefault();
    }
  }

  // /** keydown: bloquea letras, signos y segundo punto; soporta reemplazo con selección. */
  // onKeyDownDecimal(
  //   event: KeyboardEvent,
  //   maxDecimals = 2,
  //   maxIntegers = 12,
  // ): void {
  //   const key = event.key;
  //   const input = event.target as HTMLInputElement;

  //   // Atajos del sistema
  //   if (
  //     (event.ctrlKey || event.metaKey) &&
  //     ['a', 'c', 'v', 'x'].includes(key.toLowerCase())
  //   )
  //     return;

  //   // Aceptar teclas de control o dígitos/punto
  //   if (!this.allowedKeys.has(key)) {
  //     event.preventDefault();
  //     return;
  //   }

  //   // Solo un punto decimal
  //   if (key === '.' && input.value.includes('.')) {
  //     event.preventDefault();
  //     return;
  //   }

  //   // Simular el siguiente valor considerando la selección actual
  //   // Obtiene la posición inicial del cursor o selección en el input.
  //   // Si no está disponible (por compatibilidad), usa la longitud total del valor.
  //   const selectionStart = input.selectionStart ?? input.value.length;
  //   const selectionEnd = input.selectionEnd ?? input.value.length;

  //   const next =
  //     input.value.slice(0, selectionStart) +
  //     key +
  //     input.value.slice(selectionEnd);

  //   // Limitar enteros
  //   const [intPart = '', decPart = ''] = next.split('.');
  //   const intLen = intPart.replace(/^0+(?=\d)/, '').length; // sin ceros a la izquierda
  //   if (key !== '.' && !next.includes('.') && intLen > maxIntegers) {
  //     event.preventDefault();
  //     return;
  //   }

  //   // Limitar decimales
  //   if (
  //     key >= '0' &&
  //     key <= '9' &&
  //     next.includes('.') &&
  //     decPart.length > maxDecimals
  //   ) {
  //     // si el cursor está en la parte decimal y ya excede
  //     if (selectionStart > next.indexOf('.')) {
  //       event.preventDefault();
  //       return;
  //     }
  //   }

  //   // Evitar que empiece por '.'
  //   if (key === '.' && selectionStart === 0 && !input.value) {
  //     input.value = '0';
  //   }
  // }

  /** input: sanitiza (teclado, pegado, drag&drop, auto-complete) */
  onInputSanitize(event: Event, maxDecimals = 2, maxIntegers = 12): void {
    const input = event.target as HTMLInputElement;
    const old = input.value;
    const caret = input.selectionStart ?? old.length;

    let v = old;

    // 1) quita todo lo que no sea dígito o punto
    v = v.replace(/[^0-9.]/g, '');

    // 2) un solo punto
    const parts = v.split('.');
    if (parts.length > 2)
      v = parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '');

    // 3) limitar enteros (sin ceros a la izquierda salvo "0.x")
    const [int = '', dec = ''] = v.split('.');
    const intTrim = int.replace(/^0+(?=\d)/, '');
    const intLimited = intTrim.slice(0, maxIntegers);

    // 4) limitar decimales
    const decLimited = (dec ?? '').slice(0, maxDecimals);

    // 5) reconstruir
    v =
      dec !== undefined
        ? `${intLimited || '0'}${decLimited !== '' || old.endsWith('.') ? '.' : ''}${decLimited}`
        : intLimited;

    if (v !== old) {
      input.value = v;
      // reposicionar caret (simple: al final)
      const pos = Math.min(v.length, caret);
      queueMicrotask(() => input.setSelectionRange(pos, pos));
    }
  }

  /** paste: evita caracteres no válidos y normaliza coma decimal a punto si llega a pasar. */
  onPasteSanitize(event: ClipboardEvent, maxDecimals = 2): void {
    const data = event.clipboardData?.getData('text') ?? '';
    // Si contiene algo distinto a dígitos, punto o coma, previene y deja que 'input' lo limpie
    if (/[^0-9.,\s]/.test(data)) {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      const cleaned = data.replace(/[^\d.,]/g, '').replace(',', '.');
      document.execCommand('insertText', false, cleaned);
    }
    // Si solo tiene números y coma/punto, deja pasar; 'input' lo acabará de normalizar.
  }

  /** Validador para Reactive Forms: número positivo con hasta `dec` decimales */
  twoDecimalsValidator(dec = 2) {
    const regex = new RegExp(`^\\d+(\\.\\d{0,${dec}})?$`);
    return (ctrl: AbstractControl): ValidationErrors | null => {
      const v = (ctrl.value ?? '').toString().trim();
      if (v === '') return null; // maneja 'required' aparte
      return regex.test(v) ? null : { twoDecimals: true };
    };
  }

  /** Solo enteros positivos (para otros campos) */
  onKeyDownInteger(event: KeyboardEvent): void {
    const key = event.key;
    const allowed = new Set([
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
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ]);
    if (
      (event.ctrlKey || event.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(key.toLowerCase())
    )
      return;
    if (!allowed.has(key)) event.preventDefault();
  }
}
