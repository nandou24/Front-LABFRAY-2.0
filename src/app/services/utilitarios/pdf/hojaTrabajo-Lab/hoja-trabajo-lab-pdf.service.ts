import { Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import jsPDF from 'jspdf';
import { PacienteService } from '../../../mantenimiento/paciente/paciente.service';
import { IPaciente } from '../../../../models/Mantenimiento/paciente.models';
import { firstValueFrom } from 'rxjs';
import { FechaValidatorService } from '../../validators/fechasValidator/fecha-validator.service';
import { IRefMedico } from '../../../../models/Mantenimiento/referenciaMedico.models';
import { ReferenciaMedicoService } from '../../../mantenimiento/referencias/referencia-medico.service';

@Injectable({
  providedIn: 'root',
})
export class HojaTrabajoLabPdfService {
  constructor(
    private readonly _pacienteService: PacienteService,
    private readonly _refMedicoService: ReferenciaMedicoService,
    private readonly _fechasServices: FechaValidatorService,
    private _sanitizer: DomSanitizer,
  ) {}

  datoPaciente = {} as IPaciente;
  edad = '';
  datoSolicitante = {} as IRefMedico;

  async generarHojaTrabajoLabPDF(
    data: any,
    pruebasLaboratorio: any,
  ): Promise<SafeResourceUrl | void> {
    console.log(
      'Datos para generar PDF de Hoja de Trabajo de Laboratorio:',
      data,
    );
    console.log('Pruebas de laboratorio con items:', pruebasLaboratorio);

    try {
      // Obtener los datos del paciente
      this.datoPaciente = await firstValueFrom(
        this._pacienteService.getPatientbyId(data.clienteId),
      );
    } catch (error) {
      console.error('Error al obtener los datos del paciente:', error);
    }

    try {
      this.edad = this._fechasServices.calcularEdad(
        this.datoPaciente.fechaNacimiento,
      );
    } catch (error) {
      console.error('Error al calcular la edad:', error);
    }

    try {
      this.datoSolicitante = await firstValueFrom(
        this._refMedicoService.getRefMedicobyId(data.solicitanteId),
      );
    } catch (error) {
      console.error('Error al obtener los datos del solicitante:', error);
    }

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
    doc.text(`Documento:`, xLabelDatosPaciente + 90, yLabelDatosPaciente);
    doc.text(`Sexo:`, xLabelDatosPaciente, yLabelDatosPaciente + 4);
    doc.text(`Edad:`, xLabelDatosPaciente + 40, yLabelDatosPaciente + 4);
    doc.text(`Solicitante:`, xLabelDatosPaciente, yLabelDatosPaciente + 8);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.apePatCliente} ${data.apeMatCliente} ${data.nombreCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente,
    );
    doc.text(
      `${data.tipoDoc} ${data.nroDoc}`,
      xValueDatosPaciente + 90,
      yValueDatosPaciente,
    );
    doc.text(
      `${this.datoPaciente.sexoCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente + 4,
    );
    doc.text(`${this.edad}`, xValueDatosPaciente + 31, yValueDatosPaciente + 4);
    doc.text(
      `Dr. ${this.datoSolicitante.apePatRefMedico} ${this.datoSolicitante.apeMatRefMedico} ${this.datoSolicitante.nombreRefMedico} `,
      xValueDatosPaciente,
      yValueDatosPaciente + 8,
    );

    doc.setLineWidth(0.3);
    doc.line(10, 37, 142, 37); // línea horizontal debajo del encabezado

    // Ordenar pruebas por ordenImpresion
    pruebasLaboratorio.sort((a: any, b: any) => {
      const ordenA = a.ordenImpresion ?? 0;
      const ordenB = b.ordenImpresion ?? 0;
      return ordenA - ordenB;
    });

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
        doc.line(33, y, 43, y); // ajustado al ancho disponible

        // Mostrar unidad y referencia (alineado a la derecha, en 2 columnas pequeñas)
        doc.setFontSize(6);
        const xValuesRef = 45;
        let valoresRefText = '';
        if (valoresRef) valoresRefText += `${valoresRef}`;
        if (valoresRefText) doc.text(valoresRefText, xValuesRef, y);
        const xInfo = 58;
        let infoText = '';
        if (unidad) infoText += `${unidad}`;
        if (infoText) doc.text(infoText, xInfo, y);

        y += 5.5;

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
