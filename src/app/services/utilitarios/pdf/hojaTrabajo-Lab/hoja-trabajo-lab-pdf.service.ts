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
    let logoHeight = 12; // Alto de la imagen
    let logoWidth = logoHeight * 0.896; // Ancho de la imagen
    doc.addImage(imagenBase64, 'PNG', 10, 7, logoWidth, logoHeight); // (x, y, width, height)

    //Constantes datos superiores
    let xLabelSuperior = 75;
    let yLabelSuperior = 10;
    let xValueSuperior = 97;
    let yValueSuperior = yLabelSuperior;

    let xLabelDatosPaciente = 10;
    let yLabelDatosPaciente = 27;
    let xValueDatosPaciente = 28;
    let yValueDatosPaciente = yLabelDatosPaciente;
    let y = 41;

    doc.setFontSize(12);
    doc.text('Solicitud de', 48, 13, {
      align: 'center',
    });
    doc.text('Laboratorio Clínico', 48, 18, {
      align: 'center',
    });

    const fecha = new Date(data.fechaEmision);
    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    // Extraer hora de data.fechaEmision
    const horaFormateada = fecha.toTimeString().slice(0, 5); // formato HH:MM

    // Información superior derecha
    doc.setFontSize(8);
    doc.text(`Cod. Solicitud:`, xLabelSuperior, yLabelSuperior);
    doc.text(`Fecha:`, xLabelSuperior, yLabelSuperior + 4);
    doc.text(`Hora:`, xLabelSuperior, yLabelSuperior + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.codSolicitud}`, xValueSuperior, yValueSuperior);
    doc.text(`${fechaFormateada}`, xValueSuperior, yValueSuperior + 4);
    doc.text(`${horaFormateada}`, xValueSuperior, yValueSuperior + 8);

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    const squareX = 118;
    const squareY = yLabelSuperior - 4;
    const rectWidth = 22;
    const rectHeight = 14;
    doc.rect(squareX, squareY, rectWidth, rectHeight);

    doc.setLineWidth(0.3);
    doc.line(10, 23, 142, 23); // línea horizontal debajo del encabezado

    // Información del paciente
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente:`, xLabelDatosPaciente, yLabelDatosPaciente);
    doc.text(`Sexo:`, xLabelDatosPaciente, yLabelDatosPaciente + 4);
    doc.text(`Edad:`, xLabelDatosPaciente + 50, yLabelDatosPaciente + 4);
    doc.text(`Solicitante:`, xLabelDatosPaciente, yLabelDatosPaciente + 8);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.apePatCliente}${data.apeMatCliente} ${data.nombreCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente,
    );

    doc.setLineWidth(0.3);
    doc.line(10, 37, 142, 37); // línea horizontal debajo del encabezado

    for (const prueba of pruebasLaboratorio) {
      const items = prueba.itemsComponentes || [];

      // Mostrar encabezado solo si hay más de 1 ítem
      if (items.length > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text(prueba.nombrePruebaLab, 10, y);
        y += 4;
      }

      for (const comp of items) {
        const item = comp.itemLabId;
        if (!item) continue;

        const nombreItem = item.nombreItemLab || 'Ítem sin nombre';
        const unidad = item.unidadesRef || '';
        const valoresRef = item.plantillaValores || '';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`• ${nombreItem}`, 10, y);

        // Línea para escribir resultado a mano
        doc.line(31, y, 43, y); // ajustado al ancho disponible

        // Mostrar unidad y referencia (alineado a la derecha, en 2 columnas pequeñas)
        doc.setFontSize(6);
        const xValuesRef = 45;
        let valoresRefText = '';
        if (valoresRef) valoresRefText += `${valoresRef}`;
        if (valoresRefText) doc.text(valoresRefText, xValuesRef, y);
        const xInfo = 63;
        let infoText = '';
        if (unidad) infoText += `${unidad}`;
        if (infoText) doc.text(infoText, xInfo, y);

        y += 5;

        // Salto de página si es necesario
        if (y >= 195) {
          doc.addPage();
          y = 20;
        }
      }

      y += 1; // espacio entre pruebas
    }

    return this._sanitizer.bypassSecurityTrustResourceUrl(
      doc.output('datauristring'),
    );
  }
}
