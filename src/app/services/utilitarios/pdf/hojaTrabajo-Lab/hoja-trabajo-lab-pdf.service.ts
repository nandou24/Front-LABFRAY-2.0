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
    let xLabelSuperior = 97;
    let yLabelSuperior = 10;
    let xValueSuperior = 121;
    let yValueSuperior = yLabelSuperior;

    let xLabelDatosPaciente = 10;
    let yLabelDatosPaciente = 27;
    let xValueDatosPaciente = 30;
    let yValueDatosPaciente = yLabelDatosPaciente;
    let y = 41;

    doc.setFontSize(12);
    doc.text('Solicitud de Laboratorio Clínico', 60, 15, {
      align: 'center',
    });

    const fecha = new Date(data.fechaEmision);
    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    // Extraer hora de data.fechaEmision
    const horaFormateada = fecha.toTimeString().slice(0, 5); // formato HH:MM

    // Información superior derecha
    doc.setFontSize(9);
    doc.text(`Cod. Solicitud:`, xLabelSuperior, yLabelSuperior);
    doc.text(`Fecha:`, xLabelSuperior, yLabelSuperior + 5);
    doc.text(`Hora:`, xLabelSuperior, yLabelSuperior + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.codSolicitud}`, xValueSuperior, yValueSuperior);
    doc.text(`${fechaFormateada}`, xValueSuperior, yValueSuperior + 5);
    doc.text(`${horaFormateada}`, xValueSuperior, yValueSuperior + 10);

    doc.setLineWidth(0.3);
    doc.line(10, 23, 142, 23); // línea horizontal debajo del encabezado

    // Información del paciente
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente:`, xLabelDatosPaciente, yLabelDatosPaciente);
    doc.text(`Sexo:`, xLabelDatosPaciente, yLabelDatosPaciente + 5);
    doc.text(`Edad:`, xLabelDatosPaciente + 50, yLabelDatosPaciente + 5);
    doc.text(`Solicitante:`, xLabelDatosPaciente, yLabelDatosPaciente + 10);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.apePatCliente}${data.apeMatCliente} ${data.nombreCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente,
    );

    doc.setLineWidth(0.3);
    doc.line(10, 39, 142, 39); // línea horizontal debajo del encabezado

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
