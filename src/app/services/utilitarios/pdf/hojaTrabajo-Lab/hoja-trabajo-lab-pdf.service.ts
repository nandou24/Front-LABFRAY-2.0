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
    this.datoPaciente = {} as IPaciente;
    this.edad = '';
    this.datoSolicitante = {} as IRefMedico;

    // console.log(
    //   'Datos para generar PDF de Hoja de Trabajo de Laboratorio:',
    //   data,
    // );
    // console.log('Pruebas de laboratorio con items:', pruebasLaboratorio);

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

    try {
      if (data.solicitanteId) {
        this.datoSolicitante = await firstValueFrom(
          this._refMedicoService.getRefMedicobyId(data.solicitanteId),
        );
      }
    } catch (error) {
      console.error('Error al obtener los datos del solicitante:', error);
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4', // Cambiado a formato A4 estándar (210 x 297 mm)
    });

    doc.setFont('helvetica', 'bold');

    const imagenBase64 = '/images/logo labfray.png';
    let logoHeight = 15; // Alto de la imagen (escalado)
    let logoWidth = logoHeight * 0.896; // Ancho de la imagen
    doc.addImage(imagenBase64, 'PNG', 15, 10, logoWidth, logoHeight); // (x, y, width, height)

    //Constantes datos superiores (ajustadas para A4)
    let xLabelSuperior = 110;
    let yLabelSuperior = 15;
    let xValueSuperior = 140;
    let yValueSuperior = yLabelSuperior;

    let xLabelDatosPaciente = 8;
    let yLabelDatosPaciente = 35;
    let xValueDatosPaciente = 30;
    let yValueDatosPaciente = yLabelDatosPaciente;
    let y = 55;

    doc.setFontSize(14); // Aumentado el tamaño de fuente
    doc.text('Solicitud de', 70, 18, {
      // Centrado en A4
      align: 'center',
    });
    doc.text('Laboratorio Clínico', 70, 24, {
      // Centrado en A4
      align: 'center',
    });

    const fecha = new Date(data.fechaEmision);
    const fechaFormateada = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    // Extraer hora de data.fechaEmision
    const horaFormateada = fecha.toTimeString().slice(0, 5); // formato HH:MM

    // Información superior derecha
    doc.setFontSize(10);
    doc.text(`Cod. Solicitud:`, xLabelSuperior, yLabelSuperior);
    doc.text(`Fecha:`, xLabelSuperior, yLabelSuperior + 5);
    doc.text(`Hora:`, xLabelSuperior, yLabelSuperior + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${data.codSolicitud}`, xValueSuperior, yValueSuperior);
    doc.text(`${fechaFormateada}`, xValueSuperior, yValueSuperior + 5);
    doc.text(`${horaFormateada}`, xValueSuperior, yValueSuperior + 10);

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    const squareX = 170; // Ajustado para A4
    const squareY = yLabelSuperior - 6;
    const rectWidth = 30; // Más ancho para A4
    const rectHeight = 18; // Más alto para A4
    doc.rect(squareX, squareY, rectWidth, rectHeight);

    doc.setLineWidth(0.3);
    doc.line(8, 30, 200, 30); // línea horizontal debajo del encabezado (ajustada para A4)

    // Información del paciente (ajustada para A4)
    doc.setFontSize(11); // Ligeramente más grande
    doc.setFont('helvetica', 'bold');
    doc.text(`Paciente:`, xLabelDatosPaciente, yLabelDatosPaciente);
    doc.text(`Documento:`, xLabelDatosPaciente + 125, yLabelDatosPaciente); // Más espacio
    doc.text(`Sexo:`, xLabelDatosPaciente, yLabelDatosPaciente + 6);
    doc.text(`Edad:`, xLabelDatosPaciente + 50, yLabelDatosPaciente + 6); // Más espacio
    doc.text(`Teléfono:`, xLabelDatosPaciente + 125, yLabelDatosPaciente + 6); // Más espacio
    doc.text(`Solicitante:`, xLabelDatosPaciente, yLabelDatosPaciente + 12);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.apePatCliente} ${data.apeMatCliente} ${data.nombreCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente,
    );
    doc.text(
      `${data.tipoDoc} ${data.nroDoc}`,
      xValueDatosPaciente + 130, // Ajustado
      yValueDatosPaciente,
    );
    doc.text(
      `${this.datoPaciente.sexoCliente}`,
      xValueDatosPaciente,
      yValueDatosPaciente + 6,
    );
    doc.text(`${this.edad}`, xValueDatosPaciente + 40, yValueDatosPaciente + 6); // Ajustado
    const phoneNumber =
      this.datoPaciente.phones && this.datoPaciente.phones.length > 0
        ? this.datoPaciente.phones[0].phoneNumber || ''
        : '';
    doc.text(
      `${phoneNumber}`,
      xValueDatosPaciente + 130, // Ajustado
      yValueDatosPaciente + 6,
    );

    if (this.datoSolicitante && Object.keys(this.datoSolicitante).length > 0) {
      doc.text(
        `${this.datoSolicitante.apePatRefMedico} ${this.datoSolicitante.apeMatRefMedico} ${this.datoSolicitante.nombreRefMedico} `,
        xValueDatosPaciente,
        yValueDatosPaciente + 12,
      );
    }

    doc.setLineWidth(0.3);
    doc.line(8, 50, 200, 50); // línea horizontal debajo de datos del paciente (ajustada para A4)

    // Variables para el sistema de columnas
    const columnaIzquierda = 8;
    const columnaDerecha = 110; // Columna derecha comienza en x=110
    const limiteInferior = 280; // Límite inferior de la página
    const yInicial = 55; // Posición Y inicial
    let xActual = columnaIzquierda; // Posición X actual (comienza en columna izquierda)
    let enColumnaIzquierda = true; // Flag para saber en qué columna estamos

    // Línea vertical divisoria entre columnas
    doc.line(105, 50, 105, limiteInferior);

    // Ordenar pruebas por ordenImpresion
    pruebasLaboratorio.sort((a: any, b: any) => {
      const ordenA = a.ordenImpresion ?? 0;
      const ordenB = b.ordenImpresion ?? 0;
      return ordenA - ordenB;
    });

    let numeroPrueba = 1; // Contador para enumerar las pruebas

    // Función para verificar y cambiar de columna o página
    const verificarSaltoColumnaOPagina = () => {
      if (y >= limiteInferior) {
        if (enColumnaIzquierda) {
          // Cambiar a columna derecha
          xActual = columnaDerecha;
          y = yInicial;
          enColumnaIzquierda = false;
        } else {
          // Crear nueva página y volver a columna izquierda
          doc.addPage();
          // Agregar línea divisoria en la nueva página
          doc.line(105, 25, 105, limiteInferior);
          xActual = columnaIzquierda;
          y = 25;
          enColumnaIzquierda = true;
        }
      }
    };

    for (const prueba of pruebasLaboratorio) {
      const items = prueba.itemsComponentes || [];

      // Si hay solo 1 item, mostrar como prueba numerada sin viñeta
      if (items.length === 1) {
        const item = items[0].itemLabId;
        if (!item) continue;

        const nombreItem = item.nombreHojaTrabajo || 'Ítem sin nombre';
        const unidad = item.unidadesRef || '';
        const valoresRef = item.valoresHojaTrabajo || '';

        // Capitalizar solo la primera letra
        const nombreCapitalizado =
          nombreItem.charAt(0).toUpperCase() +
          nombreItem.slice(1).toLowerCase();

        doc.setFont('helvetica', 'bold'); // Negrita
        doc.setFontSize(11);
        doc.text(`${numeroPrueba}. ${nombreCapitalizado}`, xActual, y);

        // Línea para escribir resultado a mano (ajustada a la columna)
        const lineaInicio = xActual + 43;
        const lineaFin = xActual + 62;
        doc.line(lineaInicio, y, lineaFin, y);

        // Mostrar unidad y referencia (ajustadas a la columna)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const xValuesRef = xActual + 66;
        let valoresRefText = '';
        if (valoresRef) valoresRefText += `${valoresRef}`;
        if (valoresRefText) doc.text(valoresRefText, xValuesRef, y);
        const xInfo = xActual + 83;
        let infoText = '';
        if (unidad) infoText += `${unidad}`;
        if (infoText) doc.text(infoText, xInfo, y);

        y += 7;
        verificarSaltoColumnaOPagina();
      } else {
        // Si hay más de 1 item, mostrar encabezado numerado y items con viñeta

        // Capitalizar solo la primera letra del nombre de la prueba
        const nombrePruebaCapitalizado =
          prueba.nombrePruebaLab.charAt(0).toUpperCase() +
          prueba.nombrePruebaLab.slice(1).toLowerCase();

        doc.setFont('helvetica', 'bold'); // Negrita
        doc.setFontSize(11);
        doc.text(`${numeroPrueba}. ${nombrePruebaCapitalizado}`, xActual, y);
        y += 7.5;

        // Primero ordenamos todos los items por ordenImpresion
        const itemsOrdenadosPorImpresion = [...items].sort((a: any, b: any) => {
          const ordenA = a.itemLabId?.ordenImpresion ?? 999;
          const ordenB = b.itemLabId?.ordenImpresion ?? 999;
          return ordenA - ordenB;
        });

        // Agrupamos los items por grupo
        const gruposMap = new Map();
        const itemsSinGrupo = [];

        for (const comp of itemsOrdenadosPorImpresion) {
          const item = comp.itemLabId;
          if (!item) continue;

          const grupo = item.grupoItemLab;
          if (grupo) {
            if (!gruposMap.has(grupo)) {
              gruposMap.set(grupo, []);
            }
            gruposMap.get(grupo).push(comp);
          } else {
            itemsSinGrupo.push(comp);
          }
        }

        // Procesamos primero los items sin grupo
        for (const comp of itemsSinGrupo) {
          const item = comp.itemLabId;
          if (!item) continue;

          const nombreItem = item.nombreHojaTrabajo || 'Ítem sin nombre';
          const unidad = item.unidadesRef || '';
          const valoresRef = item.valoresHojaTrabajo || '';

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.text(`• ${nombreItem}`, xActual + 1, y);

          // Línea para escribir resultado a mano (ajustada a la columna)
          const lineaInicio = xActual + 43;
          const lineaFin = xActual + 62;
          doc.line(lineaInicio, y, lineaFin, y);

          // Mostrar unidad y referencia (ajustadas a la columna)
          doc.setFontSize(8.5);
          const xValuesRef = xActual + 66;
          let valoresRefText = '';
          if (valoresRef) valoresRefText += `${valoresRef}`;
          if (valoresRefText) doc.text(valoresRefText, xValuesRef, y);
          const xInfo = xActual + 83;
          let infoText = '';
          if (unidad) infoText += `${unidad}`;
          if (infoText) doc.text(infoText, xInfo, y);

          y += 7;
          verificarSaltoColumnaOPagina();
        }

        // Procesamos los grupos ordenados alfabéticamente
        const gruposOrdenados = Array.from(gruposMap.keys()).sort();

        for (const nombreGrupo of gruposOrdenados) {
          const itemsDelGrupo = gruposMap.get(nombreGrupo);

          // Solo mostrar encabezado de grupo si hay más de 1 item
          if (itemsDelGrupo.length > 1) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(nombreGrupo, xActual + 3, y);
            y += 5;
            verificarSaltoColumnaOPagina();
          }

          // Mostrar items del grupo (ya están ordenados por ordenImpresion)
          for (const comp of itemsDelGrupo) {
            const item = comp.itemLabId;
            if (!item) continue;

            const nombreItem = item.nombreHojaTrabajo || 'Ítem sin nombre';
            const unidad = item.unidadesRef || '';
            const valoresRef = item.valoresHojaTrabajo || '';

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);

            // Si hay más de 1 item en el grupo, indentar más
            const indentacion =
              itemsDelGrupo.length > 1 ? xActual + 6 : xActual + 1;
            doc.text(`• ${nombreItem}`, indentacion, y);

            // Línea para escribir resultado a mano (ajustada a la columna)
            const lineaInicio = xActual + 43;
            const lineaFin = xActual + 62;
            doc.line(lineaInicio, y, lineaFin, y);

            // Mostrar unidad y referencia (ajustadas a la columna)
            doc.setFontSize(8.5);
            const xValuesRef = xActual + 66;
            let valoresRefText = '';
            if (valoresRef) valoresRefText += `${valoresRef}`;
            if (valoresRefText) doc.text(valoresRefText, xValuesRef, y);
            const xInfo = xActual + 83;
            let infoText = '';
            if (unidad) infoText += `${unidad}`;
            if (infoText) doc.text(infoText, xInfo, y);

            y += 7;
            verificarSaltoColumnaOPagina();
          }
        }
      }

      numeroPrueba++; // Incrementar contador de pruebas
      y += 1; // espacio entre pruebas

      // Verificar salto de columna o página
      verificarSaltoColumnaOPagina();
    }

    doc.autoPrint();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Opcional: abrir el PDF en una nueva pestaña
    return this._sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);
  }
}
