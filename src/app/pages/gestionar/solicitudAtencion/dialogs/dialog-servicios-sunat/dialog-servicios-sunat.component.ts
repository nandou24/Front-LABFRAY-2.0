import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-servicios-sunat',
  templateUrl: './dialog-servicios-sunat.component.html',
  styleUrls: ['./dialog-servicios-sunat.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CommonModule],
})
export class DialogServiciosSunatComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogServiciosSunatComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { serviciosTexto: string; subtotal: number },
  ) {}

  copiarAlPortapapeles() {
    navigator.clipboard.writeText(this.data.serviciosTexto);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
