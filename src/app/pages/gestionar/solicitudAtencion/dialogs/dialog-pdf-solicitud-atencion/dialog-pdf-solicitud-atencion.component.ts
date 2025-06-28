import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HcPdfService } from '../../../../../services/utilitarios/pdf/historiaClinica/hc-pdf.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-pdf-solicitud-atencion',
  imports: [MatDialogModule, MatButtonModule, CommonModule],
  templateUrl: './dialog-pdf-solicitud-atencion.component.html',
  styleUrl: './dialog-pdf-solicitud-atencion.component.scss',
})
export class DialogPdfSolicitudAtencionComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { pdfSrc: any; solicitudData: any },
  ) {}
}
