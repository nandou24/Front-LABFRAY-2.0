import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';

import { IEtiquetaMuestra } from '../../../../../models/Gestion/etiqueta-muestra.models';

interface IBarraCodigo128 {
  x: number;
  width: number;
}

@Component({
  selector: 'app-etiqueta-muestra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './etiqueta-muestra.component.html',
  styleUrl: './etiqueta-muestra.component.scss',
})
export class EtiquetaMuestraComponent implements OnChanges {
  @Input() etiqueta!: IEtiquetaMuestra;

  barrasCodigo128: IBarraCodigo128[] = [];
  anchoCodigo128 = 1;

  private readonly patronesCode128 = [
    '212222',
    '222122',
    '222221',
    '121223',
    '121322',
    '131222',
    '122213',
    '122312',
    '132212',
    '221213',
    '221312',
    '231212',
    '112232',
    '122132',
    '122231',
    '113222',
    '123122',
    '123221',
    '223211',
    '221132',
    '221231',
    '213212',
    '223112',
    '312131',
    '311222',
    '321122',
    '321221',
    '312212',
    '322112',
    '322211',
    '212123',
    '212321',
    '232121',
    '111323',
    '131123',
    '131321',
    '112313',
    '132113',
    '132311',
    '211313',
    '231113',
    '231311',
    '112133',
    '112331',
    '132131',
    '113123',
    '113321',
    '133121',
    '313121',
    '211331',
    '231131',
    '213113',
    '213311',
    '213131',
    '311123',
    '311321',
    '331121',
    '312113',
    '312311',
    '332111',
    '314111',
    '221411',
    '431111',
    '111224',
    '111422',
    '121124',
    '121421',
    '141122',
    '141221',
    '112214',
    '112412',
    '122114',
    '122411',
    '142112',
    '142211',
    '241211',
    '221114',
    '413111',
    '241112',
    '134111',
    '111242',
    '121142',
    '121241',
    '114212',
    '124112',
    '124211',
    '411212',
    '421112',
    '421211',
    '212141',
    '214121',
    '412121',
    '111143',
    '111341',
    '131141',
    '114113',
    '114311',
    '411113',
    '411311',
    '113141',
    '114131',
    '311141',
    '411131',
    '211412',
    '211214',
    '211232',
    '2331112',
  ];

  ngOnChanges(): void {
    this.generarCodigo128();
  }

  // ====== Número visual del recipiente ======

  obtenerNumeroRecipienteEtiqueta(): string {
    return String(this.etiqueta.numeroRecipiente).padStart(2, '0');
  }

  private generarCodigo128(): void {
    const valor = String(this.etiqueta?.codigoEtiqueta ?? '').trim();

    if (!valor) {
      this.barrasCodigo128 = [];
      this.anchoCodigo128 = 1;
      return;
    }

    const valores = [...valor].map((caracter) => {
      const codigo = caracter.charCodeAt(0);
      return codigo >= 32 && codigo <= 126 ? codigo - 32 : 31;
    });

    const startB = 104;
    let checksum = startB;

    valores.forEach((codigo, index) => {
      checksum += codigo * (index + 1);
    });

    checksum %= 103;

    const codigos = [startB, ...valores, checksum, 106];
    const quietZone = 10;
    const barras: IBarraCodigo128[] = [];
    let x = quietZone;

    codigos.forEach((codigo) => {
      const patron = this.patronesCode128[codigo];

      [...patron].forEach((anchoTexto, index) => {
        const width = Number(anchoTexto);

        if (index % 2 === 0) {
          barras.push({ x, width });
        }

        x += width;
      });
    });

    this.barrasCodigo128 = barras;
    this.anchoCodigo128 = x + quietZone;
  }
}
