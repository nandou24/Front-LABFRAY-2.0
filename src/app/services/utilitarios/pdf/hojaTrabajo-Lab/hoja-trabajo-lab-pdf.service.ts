import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';

@Injectable({
  providedIn: 'root',
})
export class HojaTrabajoLabPdfService {
  constructor(private _sanitizer: DomSanitizer) {}

  generarHojaTrabajoLabPDF(
    data: any,
    pruebasLaboratorio: any,
  ): SafeResourceUrl | void {
    console.log(
      'Datos para generar PDF de Hoja de Trabajo de Laboratorio:',
      data,
    );
    console.log('Pruebas de laboratorio con items:', pruebasLaboratorio);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [148.5, 210], // width, height
    });

    doc.setFont('helvetica', 'bold');

    const imagenBase64 = '/images/logo labfray.png';
    let logoHeight = 14; // Alto de la imagen
    let logoWidth = logoHeight * 0.896; // Ancho de la imagen
    doc.addImage(imagenBase64, 'PNG', 10, 7, logoWidth, logoHeight); // (x, y, width, height)

    let y = 40;

    doc.setFontSize(14);
    doc.text('Solicitud de Laboratorio Clínico', 80, 15, {
      align: 'center',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 10, 25);
    doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 10, 30);
    doc.text(
      `Paciente: ${data.apePatCliente}${data.apeMatCliente} ${data.nombreCliente}`,
      10,
      35,
    );
    //doc.text(`Edad: ${data.paciente.edad}`, 10, 40);
    //doc.text(`Sexo: ${data.paciente.sexo}`, 10, 45);
    //doc.text(`Historia Clínica: ${data.paciente.hc}`, 10, 50);
    //doc.text(`Médico Solicitante: ${data.medico.nombre}`, 10, 55);

    for (const prueba of pruebasLaboratorio) {
      const items = prueba.itemsComponentes || [];

      // Mostrar encabezado solo si hay más de 1 ítem
      if (items.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(prueba.nombrePruebaLab, 10, y);
        y += 5;
      }

      for (const comp of items) {
        const item = comp.itemLabId;
        if (!item) continue;

        const nombreItem = item.nombreItemLab || 'Ítem sin nombre';
        const unidad = item.unidadesRef || '';
        const valoresRef = item.plantillaValores || '';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• ${nombreItem}`, 12, y);

        // Línea para escribir resultado a mano
        doc.line(65, y - 1.5, 105, y - 1.5); // ajustado al ancho disponible

        // Mostrar unidad y referencia (alineado a la derecha, en 2 columnas pequeñas)
        doc.setFontSize(7);
        const xInfo = 110;
        let infoText = '';
        if (unidad) infoText += `Unid: ${unidad}`;
        if (valoresRef) infoText += `  Ref: ${valoresRef}`;
        if (infoText) doc.text(infoText, xInfo, y);

        y += 6;

        // Salto de página si es necesario
        if (y >= 195) {
          doc.addPage();
          y = 20;
        }
      }

      y += 4; // espacio entre pruebas
    }

    return this._sanitizer.bypassSecurityTrustResourceUrl(
      doc.output('datauristring'),
    );
  }
}
