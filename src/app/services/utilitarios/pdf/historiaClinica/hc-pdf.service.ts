import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ISolicitudAtencion } from '../../../../models/Gestion/solicitudAtencion.models';
import { PacienteService } from '../../../mantenimiento/paciente/paciente.service';
import { IPaciente } from '../../../../models/Mantenimiento/paciente.models';
import { FechaValidatorService } from '../../validators/fechasValidator/fecha-validator.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HcPdfService {
  constructor(
    private _sanitizer: DomSanitizer,
    private readonly _pacienteService: PacienteService,
    private readonly _fechasServices: FechaValidatorService,
  ) {}

  datoPaciente = {} as IPaciente;
  edad = '';

  async generarHojaConsultaMedicaPDF(
    data: ISolicitudAtencion,
  ): Promise<SafeResourceUrl | void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4', // Cambiado a formato A4 landscape (297 x 210 mm)
    });

    console.log('Datos para generar PDF de Hoja de Consulta Médica:', data);

    try {
      // Obtener los datos del paciente
      this.datoPaciente = await firstValueFrom(
        this._pacienteService.getPatientbyId(data.clienteId),
      );
      console.log('Datos del paciente obtenidos:', this.datoPaciente);
    } catch (error) {
      console.error('Error al obtener los datos del paciente:', error);
    }

    try {
      this.edad = this._fechasServices.calcularEdadEnFecha(
        this.datoPaciente.fechaNacimiento,
        data.fechaEmision,
      );
    } catch (error) {
      console.error('Error al calcular la edad:', error);
    }

    doc.setFont('helvetica', 'bold');

    const imagenBase64 = '/images/logo labfray.png';
    let logoHeight = 16; // Alto de la imagen (escalado)
    let logoWidth = logoHeight * 0.896; // Ancho de la imagen
    doc.addImage(imagenBase64, 'PNG', 12, 8.5, logoWidth, logoHeight); // (x, y, width, height)

    //constantes (ajustadas para A4 landscape)
    const margin = 7; // Margen del documento (aumentado)
    const headerHeight = 27; // Altura del encabezado (escalada)
    const altofila = 5.8; // Altura de cada fila (escalada)

    //ARMANDO ESQUELETO (escalado para A4 landscape)
    // Encabezado
    doc.setDrawColor(0, 70, 175); // RGB azul oscuro
    //doc.setFillColor(0, 70, 175); // RGB azul oscuro
    doc.rect(margin, margin, 283, 196, 'S'); // Escalado para A4 (297-14=283, 210-14=196)

    doc.line(7, headerHeight, 290, headerHeight); // Línea horizontal encabezado (escalada)
    for (let i = 1; i < 23; i++) {
      doc.line(
        7,
        headerHeight + i * altofila,
        290,
        headerHeight + i * altofila,
      );
    }
    doc.line(150, 7, 150, 27); // Línea vertical central (escalada)
    doc.line(150, 20, 290, 20); // Línea horizontal superior derecha (escalada)
    doc.line(150, 131.5, 150, 203); // Línea vertical derecha (escalada)
    doc.line(
      7,
      headerHeight + 23 * altofila,
      150,
      headerHeight + 23 * altofila,
    );
    doc.line(
      7,
      headerHeight + 24 * altofila,
      150,
      headerHeight + 24 * altofila,
    );

    //AGREGANDO TEXTO (escalado para A4)
    doc.setTextColor(0, 70, 175);
    doc.setFontSize(16); // Aumentado para A4
    doc.text('EVOLUCIÓN AMBULATORIA', 51, 14.5); // Reposicionado
    doc.setFontSize(14); // Aumentado para A4
    doc.text(`Nro HC:`, 60, 22); // Reposicionado
    doc.text(`${data.hc}`, 80, 22); // Reposicionado

    // Paciente y doctor (escalado)
    doc.setFontSize(11); // Aumentado para A4
    doc.setFont('helvetica', 'bold');
    doc.text(`Documento`, 155, 11.5); // Reposicionado para A4
    doc.text(`Fecha:`, 242, 11.5); // Reposicionado para A4
    doc.text(`Paciente`, 155, 17.5); // Reposicionado para A4
    doc.text(`Médico`, 155, 25); // Reposicionado para A4
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.tipoDoc} ${data.nroDoc}`, 180, 11.5); // Reposicionado
    //Formateando fecha
    const fecha = new Date(data.fechaEmision);
    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    doc.text(`${fechaFormateada}`, 260, 11.5); // Reposicionado para A4
    doc.text(
      `${data.apePatCliente} ${data.apeMatCliente} ${data.nombreCliente}`,
      180,
      17.5, // Reposicionado
    );
    doc.text(
      `${data.servicios[0].medicoAtiende?.apePatRecHumano} ${data.servicios[0].medicoAtiende?.apeMatRecHumano} ${data.servicios[0]?.medicoAtiende?.nombreRecHumano}`,
      180,
      25, // Reposicionado
    );

    //primera fila Sexo, Talla, Peso, Edad (escalada para A4)
    const fila1Y = 31.5;
    doc.setFont('helvetica', 'bold');
    doc.text(`Sexo:`, 12, fila1Y);
    doc.text(`Talla:`, 70, fila1Y); // Más espacio
    doc.text(`Peso:`, 110, fila1Y); // Más espacio
    doc.text(`Edad:`, 155, fila1Y); // Reposicionado

    doc.setFont('helvetica', 'normal');
    doc.text(`${this.datoPaciente.sexoCliente}`, 26, fila1Y);
    doc.text(`${this.edad}`, 170, fila1Y);

    doc.setFont('helvetica', 'bold');
    //segunda fila Motivo de Consulta, Tipo de Enfermedad (escalada)
    doc.text(`Motivo de consulta:`, 12, fila1Y + altofila);
    doc.text(`Tipo de Enfermedad:`, 155, fila1Y + altofila);

    //tercera fila FUR Y RAM (escalada)
    doc.text(`FUR:`, 12, fila1Y + altofila * 6);
    doc.text(`RAM:`, 110, fila1Y + altofila * 6);

    //cuarta fila, antecedentes (escalada)
    doc.text(`Antecedentes:`, 12, fila1Y + altofila * 7);

    //quinta fila, examen clínico (escalada)
    doc.text(`Examen Clínico:`, 12, fila1Y + altofila * 10);
    doc.text(`FR:`, 70, fila1Y + altofila * 10);
    doc.text(`FC:`, 110, fila1Y + altofila * 10);
    doc.text(`PA:`, 155, fila1Y + altofila * 10);
    doc.text(`T°:`, 200, fila1Y + altofila * 10);
    doc.text(`Sat:`, 240, fila1Y + altofila * 10);

    //sexta fila, diagnóstico, CIE10 (escalada)
    doc.text(`Diagnóstico:`, 12, fila1Y + altofila * 14);
    doc.text(`CIE10:`, 155, fila1Y + altofila * 14);
    doc.text(`CIE10:`, 155, fila1Y + altofila * 15);
    doc.text(`CIE10:`, 155, fila1Y + altofila * 16);

    //septima fila, exámenes auxiliares (escalada para A4)
    doc.text(`Exámenes Auxiliares:`, 12, fila1Y + altofila * 17);
    doc.text(`Lab`, 70, fila1Y + altofila * 17);
    doc.roundedRect(
      80,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Rx`, 90, fila1Y + altofila * 17);
    doc.roundedRect(
      98,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Ecog`, 108, fila1Y + altofila * 17);
    doc.roundedRect(
      122,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Mamog`, 132, fila1Y + altofila * 17);
    doc.roundedRect(
      148,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`D.O.`, 158, fila1Y + altofila * 17);
    doc.roundedRect(
      168,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`TAC`, 178, fila1Y + altofila * 17);
    doc.roundedRect(
      190,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`RMN`, 200, fila1Y + altofila * 17);
    doc.roundedRect(
      214,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`NO`, 224, fila1Y + altofila * 17);
    doc.roundedRect(
      232,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );
    doc.text(`Otros`, 242, fila1Y + altofila * 17);
    doc.roundedRect(
      256,
      fila1Y + altofila * 17 - altofila / 2,
      4,
      3,
      0.5,
      0.5,
      'S',
    );

    //octava fila, tratamiento (escalada)
    doc.text(`Medicación:`, 12, fila1Y + altofila * 18);
    doc.text(`N° días:`, 80, fila1Y + altofila * 18);
    doc.text(`Procedimiento:`, 155, fila1Y + altofila * 18);

    //novena fila, interconsulta (escalada)
    doc.text(`Interconsulta:`, 155, fila1Y + altofila * 20);
    // décima fila, descanso medico (escalada)
    doc.text(`Descanso Médico:`, 155, fila1Y + altofila * 21);
    doc.text(`Desde:`, 200, fila1Y + altofila * 21);
    doc.text(`hasta:`, 245, fila1Y + altofila * 21);
    // undécima fila, firma (escalada)
    doc.text(`Firma y sello:`, 155, fila1Y + altofila * 22);

    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    //doc.save(`HC_${data.codigoSolicitud}.pdf`);

    return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
  }
}
