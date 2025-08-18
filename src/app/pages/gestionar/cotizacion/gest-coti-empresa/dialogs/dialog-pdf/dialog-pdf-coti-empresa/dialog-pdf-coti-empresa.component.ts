import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CotiEmpresaPdfService } from '../../../../../../../services/utilitarios/pdf/cotizacion/coti-empresas/coti-empresa-pdf.service';

@Component({
  selector: 'app-dialog-pdf-coti-empresa',
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './dialog-pdf-coti-empresa.component.html',
  styleUrl: './dialog-pdf-coti-empresa.component.scss',
})
export class DialogPdfCotiEmpresaComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { pdfSrc: any; cotizacionData: any },
    private _pdfService: CotiEmpresaPdfService,
  ) {}

  descargarPDF() {
    if (this.data.cotizacionData) {
      this._pdfService.generarPDFCotizacion(this.data.cotizacionData, false); // preview = false → descarga
    }
  }
}
