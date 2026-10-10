import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, ElementRef, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { firstValueFrom } from 'rxjs';
import { ImpresionEtiquetasLocalService } from '../../../../../services/gestion/impresionEtiquetas/impresion-etiquetas-local.service';

import { EtiquetaMuestraComponent } from '../../components/etiqueta-muestra/etiqueta-muestra.component';
import { IEtiquetaMuestra } from '../../../../../models/Gestion/etiqueta-muestra.models';

export interface IDialogEtiquetasMuestraData {
  etiquetas: IEtiquetaMuestra[];
}

@Component({
  selector: 'app-dialog-etiquetas-muestra',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    EtiquetaMuestraComponent,
  ],
  templateUrl: './dialog-etiquetas-muestra.component.html',
  styleUrl: './dialog-etiquetas-muestra.component.scss',
})
export class DialogEtiquetasMuestraComponent {
  readonly data = inject<IDialogEtiquetasMuestraData>(MAT_DIALOG_DATA);

  private readonly _impresionLocal = inject(ImpresionEtiquetasLocalService);
  imprimiendoLocal = false;

  private readonly _dialogRef = inject(
    MatDialogRef<DialogEtiquetasMuestraComponent>,
  );

  private readonly _document = inject(DOCUMENT);

  private readonly _elementRef =
    inject<ElementRef<HTMLElement>>(ElementRef);

  get tieneTiposPorDefinir(): boolean {
    return this.data.etiquetas.some(
      (etiqueta) => etiqueta.resolucionTipoMuestra === 'POR_DEFINIR',
    );
  }

  // ====== Vista individual ======

  get esVistaIndividual(): boolean {
    return this.data.etiquetas.length === 1;
  }

  // ====== Validar impresion individual ======

  get puedeImprimirIndividual(): boolean {
    return this.esVistaIndividual && !this.tieneTiposPorDefinir;
  }

  // ====== Validar impresion grupal ======

  get puedeImprimirTodas(): boolean {
    return (
      !this.esVistaIndividual &&
      this.data.etiquetas.length > 0 &&
      !this.tieneTiposPorDefinir
    );
  }

  // ====== Envio directo y reimpresion sin pedir clave ======
  private async enviarDirecto(etiquetas: IEtiquetaMuestra[]): Promise<void> {
    if (this.imprimiendoLocal) return;
    if (etiquetas.length > 100) {
      await Swal.fire('Demasiadas etiquetas', 'Maximo 100 etiquetas por trabajo.', 'warning');
      return;
    }
    this.imprimiendoLocal = true;
    try {
      const resultado = await firstValueFrom(this._impresionLocal.imprimir(etiquetas));
      await Swal.fire({
        icon: 'success',
        title: 'Trabajo enviado a Windows',
        text: `${resultado.etiquetas} etiqueta(s), ${resultado.filas} fila(s). Verifica la impresion fisica.`,
      });
    } catch (error: any) {
      const mensaje = typeof error?.error?.mensaje === 'string'
        ? error.error.mensaje
        : error?.status === 0
          ? 'No se pudo conectar al puente local. Revisa node servidor.js y el origen de Angular.'
          : 'No se pudo enviar el trabajo a Windows.';
      await Swal.fire({ icon: 'error', title: 'Impresion no disponible', text: mensaje });
    } finally {
      this.imprimiendoLocal = false;
    }
  }

  async imprimirEtiquetaDirecta(): Promise<void> {
    if (!this.puedeImprimirIndividual) return;
    await this.enviarDirecto([this.data.etiquetas[0]]);
  }

  // ====== Imprimir etiqueta individual por navegador ======

  imprimirEtiqueta(): void {
    if (!this.puedeImprimirIndividual) {
      return;
    }

    const etiquetaOrigen =
      this._elementRef.nativeElement.querySelector<HTMLElement>(
        'app-etiqueta-muestra',
      );

    const ventana = this._document.defaultView;

    if (!etiquetaOrigen || !ventana) {
      return;
    }

    this._document
      .querySelectorAll('.etiqueta-print-clone, #etiqueta-print-style')
      .forEach((elemento) => elemento.remove());

    const etiquetaImpresion = etiquetaOrigen.cloneNode(true) as HTMLElement;
    etiquetaImpresion.classList.add('etiqueta-print-clone');

    const estiloImpresion = this._document.createElement('style');
    estiloImpresion.id = 'etiqueta-print-style';
    estiloImpresion.textContent = `
      @page {
        size: 50mm 25mm;
        margin: 0;
      }

      .etiqueta-print-clone {
        display: none !important;
      }

      @media print {
        html,
        body {
          width: 50mm !important;
          height: 25mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }

        body > *:not(.etiqueta-print-clone) {
          display: none !important;
        }

        .etiqueta-print-clone {
          display: block !important;
          position: fixed !important;
          inset: 0 auto auto 0 !important;
          width: 50mm !important;
          height: 25mm !important;
          margin: 0 !important;
          padding: 0 !important;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `;

    this._document.head.appendChild(estiloImpresion);
    this._document.body.appendChild(etiquetaImpresion);

    const limpiar = (): void => {
      etiquetaImpresion.remove();
      estiloImpresion.remove();
    };

    ventana.addEventListener('afterprint', limpiar, { once: true });

    ventana.setTimeout(() => {
      ventana.print();
    }, 50);
  }

  // ====== Impresion y reimpresion grupal directa ======
  async imprimirTodasEtiquetasDirectas(): Promise<void> {
    if (!this.puedeImprimirTodas) return;
    await this.enviarDirecto(this.data.etiquetas);
  }

  // ====== Imprimir todas las etiquetas por navegador ======

  imprimirTodasEtiquetas(): void {
    if (!this.puedeImprimirTodas) {
      return;
    }

    const etiquetasOrigen = Array.from(
      this._elementRef.nativeElement.querySelectorAll<HTMLElement>(
        'app-etiqueta-muestra',
      ),
    );

    const ventana = this._document.defaultView;

    if (etiquetasOrigen.length !== this.data.etiquetas.length || !ventana) {
      return;
    }

    this._document
      .querySelectorAll(
        '.etiqueta-print-clone, .etiquetas-print-root, #etiqueta-print-style',
      )
      .forEach((elemento) => elemento.remove());

    const contenedorImpresion = this._document.createElement('div');
    contenedorImpresion.classList.add('etiquetas-print-root');

    etiquetasOrigen.forEach((etiquetaOrigen) => {
      const pagina = this._document.createElement('div');
      pagina.classList.add('etiqueta-print-page');

      const etiquetaImpresion =
        etiquetaOrigen.cloneNode(true) as HTMLElement;

      pagina.appendChild(etiquetaImpresion);
      contenedorImpresion.appendChild(pagina);
    });

    const estiloImpresion = this._document.createElement('style');
    estiloImpresion.id = 'etiqueta-print-style';
    estiloImpresion.textContent = `
      @page {
        size: 50mm 25mm;
        margin: 0;
      }

      .etiquetas-print-root {
        display: none !important;
      }

      @media print {
        html,
        body {
          width: 50mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
        }

        body > *:not(.etiquetas-print-root) {
          display: none !important;
        }

        .etiquetas-print-root {
          display: block !important;
          width: 50mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .etiqueta-print-page {
          box-sizing: border-box !important;
          width: 50mm !important;
          height: 25mm !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          break-after: page;
          page-break-after: always;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }

        .etiqueta-print-page:last-child {
          break-after: auto;
          page-break-after: auto;
        }

        .etiqueta-print-page > app-etiqueta-muestra {
          display: block !important;
          width: 50mm !important;
          height: 25mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }
    `;

    this._document.head.appendChild(estiloImpresion);
    this._document.body.appendChild(contenedorImpresion);

    const limpiar = (): void => {
      contenedorImpresion.remove();
      estiloImpresion.remove();
    };

    ventana.addEventListener('afterprint', limpiar, { once: true });

    ventana.setTimeout(() => {
      ventana.print();
    }, 50);
  }

  cerrar(): void {
    this._dialogRef.close();
  }
}
