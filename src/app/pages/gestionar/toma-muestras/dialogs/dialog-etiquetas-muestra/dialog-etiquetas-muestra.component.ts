import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

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

  private readonly _dialogRef = inject(
    MatDialogRef<DialogEtiquetasMuestraComponent>,
  );

  get tieneTiposPorDefinir(): boolean {
    return this.data.etiquetas.some(
      (etiqueta) => etiqueta.resolucionTipoMuestra === 'POR_DEFINIR',
    );
  }

  cerrar(): void {
    this._dialogRef.close();
  }
}
