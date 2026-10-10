import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IEtiquetaMuestra } from '../../../models/Gestion/etiqueta-muestra.models';

export interface IRespuestaImpresionLocal {
  ok: boolean;
  estado: 'ENVIADO_A_COLA';
  etiquetas: number;
  filas: number;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ImpresionEtiquetasLocalService {
  private readonly http = inject(HttpClient);
  private readonly url = 'http://127.0.0.1:18724/imprimir';

  // ====== Envio directo desde Angular local autorizado ======
  imprimir(etiquetas: IEtiquetaMuestra[]): Observable<IRespuestaImpresionLocal> {
    return this.http.post<IRespuestaImpresionLocal>(this.url, { etiquetas });
  }
}
