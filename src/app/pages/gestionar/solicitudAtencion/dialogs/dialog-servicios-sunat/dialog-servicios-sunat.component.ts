import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dialog-servicios-sunat',
  templateUrl: './dialog-servicios-sunat.component.html',
  styleUrls: ['./dialog-servicios-sunat.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogServiciosSunatComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogServiciosSunatComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { serviciosTexto: string }
  ) {}

  copiarAlPortapapeles() {
    navigator.clipboard.writeText(this.data.serviciosTexto);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
