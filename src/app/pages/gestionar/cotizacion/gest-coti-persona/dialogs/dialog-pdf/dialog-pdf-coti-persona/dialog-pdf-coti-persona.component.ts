import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CotiPersonaPdfServiceService } from '../../../../../../../services/utilitarios/pdf/cotizacion/coti-persona-pdf.service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-pdf-coti-persona',
  imports: [
    MatDialogModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './dialog-pdf-coti-persona.component.html',
  styleUrl: './dialog-pdf-coti-persona.component.scss'
})
export class DialogPdfCotiPersonaComponent {

   constructor(
    @Inject(MAT_DIALOG_DATA) public data: { pdfSrc: any, cotizacionData: any },
    private _pdfService: CotiPersonaPdfServiceService
  ) {}

    descargarPDF() {
    if (this.data.cotizacionData) {
      this._pdfService.generarPDFCotizacion(this.data.cotizacionData, false); // preview = false → descarga
    }
  }

}
