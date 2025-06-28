import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ISolicitudAtencion } from '../../../../models/solicitudAtencion.models';

@Injectable({
  providedIn: 'root',
})
export class HcPdfService {
  constructor(private _sanitizer: DomSanitizer) {}

  generarHistoriaClinicaPDF(data: ISolicitudAtencion): SafeResourceUrl | void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [210, 148.5], // width, height
    });

    doc.setFont('helvetica', 'bold');

    const imagenBase64 = '/images/logo labfray.png';
    let logoHeight = 14; // Alto de la imagen
    let logoWidth = logoHeight * 0.896; // Ancho de la imagen
    doc.addImage(imagenBase64, 'PNG', 10, 7, logoWidth, logoHeight); // (x, y, width, height)

    //guias
    //doc.line(105, 0, 105, 148.5); // x1, y1, x2, y2 vertical line
    //doc.line(0, 74.25, 210, 74.25); // x1, y1, x2, y2 horizontal line

    //constantes
    const margin = 5; // Margen del documento
    const headerHeight = 23; // Altura del encabezado
    const altofila = 4.8; // Altura de cada fila

    //ARMANDO ESQUELETO
    // Encabezado
    doc.setDrawColor(0, 70, 175); // RGB azul oscuro
    //doc.setFillColor(0, 70, 175); // RGB azul oscuro
    doc.rect(margin, margin, 200, 138.5, 'S');

    doc.line(5, headerHeight, 205, headerHeight); // Línea horizontal encabezado
    for (let i = 1; i < 23; i++) {
      doc.line(
        5,
        headerHeight + i * altofila,
        205,
        headerHeight + i * altofila,
      );
    }
    doc.line(105, 5, 105, 23);
    doc.line(105, 17, 205, 17);
    doc.line(105, 109.4, 105, 143.5);
    doc.line(
      5,
      headerHeight + 23 * altofila,
      105,
      headerHeight + 23 * altofila,
    );
    doc.line(
      5,
      headerHeight + 24 * altofila,
      105,
      headerHeight + 24 * altofila,
    );

    //AGREGANDO TEXTO
    doc.setTextColor(0, 70, 175);
    doc.setFontSize(13);
    doc.text('EVOLUCIÓN AMBULATORIA', 30, 12);
    doc.setFontSize(12);
    doc.text(`Nro HC:`, 35, 19);
    doc.text(`${data.hc}`, 55, 19);

    // Paciente y doctor
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.tipoDocumento}`, 108, 9.5);
    doc.text(`Fecha:`, 170, 9.5);
    doc.text(`Paciente`, 108, 14.5);
    doc.text(`Médico`, 108, 21);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.nroDocumento}`, 127, 9.5);
    doc.text('18/05/25', 185, 9.5);
    doc.text(data.pacienteNombre, 127, 14.5);
    doc.text('JOSE CIPRIANO GOMEZ BARBOZA', 127, 21);

    //primera fila Sexo, Talla, Peso, Edad
    const fila1Y = 26.7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Sexo:`, 10, fila1Y);
    doc.text(`Talla:`, 50, fila1Y);
    doc.text(`Peso:`, 80, fila1Y);
    doc.text(`Edad:`, 110, fila1Y);

    //segunda fila Motivo de Consulta, Tipo de Enfermedad
    doc.text(`Motivo de consulta:`, 10, fila1Y + altofila);
    doc.text(`Tipo de Enfermedad:`, 110, fila1Y + altofila);

    //tercera fila FUR Y RAM
    doc.text(`FUR:`, 10, fila1Y + altofila * 6);
    doc.text(`RAM:`, 80, fila1Y + altofila * 6);

    //cuarta fila, antecedentes
    doc.text(`Antecedentes:`, 10, fila1Y + altofila * 7);

    //quinta fila, examen clínico
    doc.text(`Examen Clínico:`, 10, fila1Y + altofila * 10);
    doc.text(`FR:`, 50, fila1Y + altofila * 10);
    doc.text(`FC:`, 80, fila1Y + altofila * 10);
    doc.text(`PA:`, 108, fila1Y + altofila * 10);
    doc.text(`T°:`, 140, fila1Y + altofila * 10);

    //sexta fila, diagnóstico, CIE10
    doc.text(`Diagnóstico:`, 10, fila1Y + altofila * 14);
    doc.text(`CIE10:`, 108, fila1Y + altofila * 14);
    doc.text(`CIE10:`, 108, fila1Y + altofila * 15);
    doc.text(`CIE10:`, 108, fila1Y + altofila * 16);

    //septima fila, exámenes auxiliares
    doc.text(`Exámenes Auxiliares:`, 10, fila1Y + altofila * 17);
    doc.text(`Lab`, 50, fila1Y + altofila * 17);
    doc.roundedRect(
      57,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Rx`, 65, fila1Y + altofila * 17);
    doc.roundedRect(
      71,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Ecog`, 79, fila1Y + altofila * 17);
    doc.roundedRect(
      88,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Mamog`, 96, fila1Y + altofila * 17);
    doc.roundedRect(
      108,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`D.O.`, 116, fila1Y + altofila * 17);
    doc.roundedRect(
      124,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`TAC`, 132, fila1Y + altofila * 17);
    doc.roundedRect(
      140,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`RMN`, 148, fila1Y + altofila * 17);
    doc.roundedRect(
      157,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`NO`, 165, fila1Y + altofila * 17);
    doc.roundedRect(
      171,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Otros`, 180, fila1Y + altofila * 17);
    doc.roundedRect(
      190,
      fila1Y + altofila * 17 - altofila / 2,
      3,
      2.5,
      0.5,
      0.5,
      'S',
    );

    //octava fila, tratamiento
    doc.text(`Medicación:`, 10, fila1Y + altofila * 18);
    doc.text(`N° días:`, 60, fila1Y + altofila * 18);
    doc.text(`Procedimiento:`, 108, fila1Y + altofila * 18);

    //novena fila, interconsulta
    doc.text(`Interconsulta:`, 108, fila1Y + altofila * 20);
    // décima fila, descanso medico
    doc.text(`Descanso Médico:`, 108, fila1Y + altofila * 21);
    doc.text(`Desde:`, 140, fila1Y + altofila * 21);
    doc.text(`hasta:`, 173, fila1Y + altofila * 21);
    // undécima fila, firma
    doc.text(`Firma y sello:`, 108, fila1Y + altofila * 22);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    //doc.save(`HC_${data.codigoSolicitud}.pdf`);

    return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
  }
}
